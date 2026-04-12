const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");

const express = require("express");
const multer = require("multer");

const { config } = require("../config/env");
const { getCoursePresentation } = require("../data/academy-curriculum");
const { applyStudentSession, requireStudentSession, STUDENT_SESSION_COOKIE_NAME } = require("../middleware/student-session");
const {
  consumePasswordResetToken,
  createOrActivateEnrollment,
  createOrUpdatePurchase,
  createPasswordResetToken,
  createStudentSession,
  createSubmissionWithAttachments,
  createUser,
  deleteExpiredStudentSessions,
  deleteStudentSessionByToken,
  getAttachmentById,
  getCourseById,
  getCourseBySlug,
  getCourseTreeForStudent,
  getEnrollment,
  getLessonById,
  getPasswordResetToken,
  getPurchaseByProviderSessionId,
  getUserByEmail,
  listPublishedCourses,
  listSubmissionsForUser,
  listUserEnrollments,
  markPurchasePaid,
  markUserLastLogin,
  updateUserPassword,
  upsertLessonProgress,
} = require("../repositories/academy.repository");
const { hashPassword, verifyPassword } = require("../services/password.service");
const { createCheckoutSession, isStripeConfigured, retrieveCheckoutSession } = require("../services/stripe.service");
const {
  validateCheckoutConfirmPayload,
  validateCheckoutPayload,
  validateForgotPasswordPayload,
  validateProgressPayload,
  validateResetPasswordPayload,
  validateStudentLoginPayload,
  validateStudentSignupPayload,
  validateSubmissionPayload,
} = require("../validation/academy.validation");
const { serializeCookie } = require("../utils/cookies");
const { sanitizeText } = require("../utils/sanitize");
const { asyncHandler } = require("../utils/async-handler");
const { createHttpError } = require("../utils/http-error");

function getUploadsDirectory() {
  const uploadsDirectory = path.join(config.uploadsDir, "submissions");
  fs.mkdirSync(uploadsDirectory, { recursive: true });
  return uploadsDirectory;
}

function getStudentSessionExpiryDate() {
  return new Date(Date.now() + config.student.sessionTtlHours * 60 * 60 * 1000);
}

function buildStudentSessionCookie(token, expiresAt) {
  return serializeCookie(STUDENT_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "Lax",
    secure: config.env === "production",
    path: "/",
    maxAge: config.student.sessionTtlHours * 60 * 60,
    expires: expiresAt,
  });
}

function clearStudentSessionCookie() {
  return serializeCookie(STUDENT_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "Lax",
    secure: config.env === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

function createStudentUploadMiddleware() {
  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, getUploadsDirectory());
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname || "").toLowerCase().slice(0, 10);
      callback(null, `${Date.now()}-${randomBytes(8).toString("hex")}${extension}`);
    },
  });

  return multer({
    storage,
    limits: {
      files: 4,
      fileSize: 8 * 1024 * 1024,
    },
  });
}

function getSafeFilename(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "") || "fichier";
}

function getDashboardPayload(userId) {
  const enrollments = listUserEnrollments(userId).map((enrollment) => {
    const totalLessons = Number(enrollment.total_lessons || 0);
    const completedLessons = Number(enrollment.completed_lessons || 0);
    const progressPercent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const tree = getCourseTreeForStudent(userId, enrollment.course_id);
    const presentation = getCoursePresentation(enrollment.course_id) || {};

    return {
      ...enrollment,
      progress_percent: progressPercent,
      module_count: tree?.modules?.length || 0,
      total_duration_minutes: tree?.stats?.total_duration_minutes || 0,
      remaining_duration_minutes: tree?.stats?.remaining_duration_minutes || 0,
      next_lesson: tree?.next_lesson || null,
      presentation,
    };
  });

  const totalCourses = enrollments.length;
  const avgProgress = totalCourses
    ? Math.round(
        enrollments.reduce((sum, enrollment) => sum + Number(enrollment.progress_percent || 0), 0) /
          totalCourses
      )
    : 0;

  const pendingAssignments = listSubmissionsForUser(userId).filter((submission) =>
    ["submitted", "pending_review", "revision_requested"].includes(submission.status)
  ).length;
  const nextStep =
    enrollments.find((enrollment) => Number(enrollment.progress_percent || 0) < 100 && enrollment.next_lesson) ||
    enrollments.find((enrollment) => enrollment.next_lesson) ||
    null;

  return {
    metrics: {
      total_courses: totalCourses,
      average_progress: avgProgress,
      pending_assignments: pendingAssignments,
    },
    next_step: nextStep
      ? {
          course_id: nextStep.course_id,
          course_slug: nextStep.slug,
          course_title: nextStep.title,
          course_subtitle: nextStep.subtitle,
          progress_percent: nextStep.progress_percent,
          remaining_duration_minutes: nextStep.remaining_duration_minutes,
          next_lesson: nextStep.next_lesson,
          promise: nextStep.presentation?.promise || "",
        }
      : null,
    enrollments,
  };
}

function buildResetEmailHtml({ fullName, resetUrl }) {
  return `
    <div style="font-family: Arial, sans-serif; background:#0b0c10; color:#f5f1e8; padding:32px;">
      <div style="max-width:640px; margin:0 auto; border:1px solid rgba(255,255,255,0.08); border-radius:22px; overflow:hidden; background:#111318;">
        <div style="padding:28px 32px; border-bottom:1px solid rgba(255,255,255,0.08);">
          <p style="margin:0 0 10px; letter-spacing:0.16em; text-transform:uppercase; font-size:12px; color:#c8a76a;">Astra Studio • Espace élève</p>
          <h1 style="margin:0; font-size:26px; line-height:1.25;">Réinitialisez votre mot de passe</h1>
        </div>
        <div style="padding:28px 32px;">
          <p style="margin:0 0 14px; line-height:1.7;">Bonjour ${fullName},</p>
          <p style="margin:0 0 18px; line-height:1.7;">
            Une demande de réinitialisation a été enregistrée pour votre espace formation Astra Studio.
          </p>
          <p style="margin:0 0 26px;">
            <a href="${resetUrl}" style="display:inline-block; padding:12px 20px; border-radius:999px; color:#130f09; text-decoration:none; font-weight:600; background:linear-gradient(145deg,#e5c796,#b88d4c);">
              Définir un nouveau mot de passe
            </a>
          </p>
          <p style="margin:0; line-height:1.6; color:#b8bec9; font-size:13px;">
            Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer ce message.
          </p>
        </div>
      </div>
    </div>
  `;
}

function createStudentRouter({ mailer }) {
  const router = express.Router();
  const upload = createStudentUploadMiddleware();

  router.use(applyStudentSession);

  router.get("/session", (req, res) => {
    if (!req.studentSession) {
      return res.status(200).json({
        ok: true,
        authenticated: false,
      });
    }

    return res.status(200).json({
      ok: true,
      authenticated: true,
      user: req.studentSession.user,
      dashboard: getDashboardPayload(req.studentSession.user.id).metrics,
    });
  });

  router.post(
    "/auth/signup",
    asyncHandler(async (req, res) => {
      const validation = validateStudentSignupPayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Certains champs doivent être corrigés.", {
          field_errors: validation.errors,
        });
      }

      const existingUser = getUserByEmail(validation.values.email);

      if (existingUser) {
        throw createHttpError(409, "Un compte existe déjà avec cette adresse e-mail.");
      }

      const user = createUser({
        full_name: validation.values.full_name,
        email: validation.values.email,
        password_hash: hashPassword(validation.values.password),
      });

      const token = randomBytes(32).toString("hex");
      const expiresAt = getStudentSessionExpiryDate();

      createStudentSession({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
        ip: req.ip || "",
        user_agent: sanitizeText(req.get("user-agent"), { max: 280 }),
      });

      markUserLastLogin(user.id);
      res.setHeader("Set-Cookie", buildStudentSessionCookie(token, expiresAt));

      return res.status(201).json({
        ok: true,
        user,
        redirect_to: config.site.studentDashboardRoute,
      });
    })
  );

  router.post(
    "/auth/login",
    asyncHandler(async (req, res) => {
      deleteExpiredStudentSessions();
      const validation = validateStudentLoginPayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Identifiants invalides.", {
          field_errors: validation.errors,
        });
      }

      const user = getUserByEmail(validation.values.email);

      if (!user || !verifyPassword(validation.values.password, user.password_hash)) {
        throw createHttpError(401, "Identifiants invalides.");
      }

      if (user.status !== "active") {
        throw createHttpError(403, "Compte inactif. Contactez Astra Studio.");
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = getStudentSessionExpiryDate();

      createStudentSession({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
        ip: req.ip || "",
        user_agent: sanitizeText(req.get("user-agent"), { max: 280 }),
      });

      markUserLastLogin(user.id);
      res.setHeader("Set-Cookie", buildStudentSessionCookie(token, expiresAt));

      return res.status(200).json({
        ok: true,
        redirect_to: config.site.studentDashboardRoute,
      });
    })
  );

  router.post("/auth/logout", (req, res) => {
    if (req.studentSession?.token) {
      deleteStudentSessionByToken(req.studentSession.token);
    }

    res.setHeader("Set-Cookie", clearStudentSessionCookie());
    return res.status(200).json({
      ok: true,
    });
  });

  router.post(
    "/auth/forgot-password",
    asyncHandler(async (req, res) => {
      const validation = validateForgotPasswordPayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Adresse e-mail invalide.", {
          field_errors: validation.errors,
        });
      }

      const user = getUserByEmail(validation.values.email);
      let debugToken = "";

      if (user) {
        const resetToken = randomBytes(32).toString("hex");
        const expiresAt = new Date(
          Date.now() + config.student.passwordResetTtlMinutes * 60 * 1000
        ).toISOString();

        createPasswordResetToken({
          user_id: user.id,
          token: resetToken,
          expires_at: expiresAt,
        });

        const resetUrl = `${config.site.baseUrl}${config.site.studentAuthRoute}?mode=reset&token=${encodeURIComponent(resetToken)}`;
        debugToken = resetToken;

        await mailer.sendTransactionalEmail({
          to: user.email,
          replyTo: config.smtp.replyTo || config.leadsNotifyEmail || config.smtp.from,
          subject: "Astra Studio — Réinitialisation de votre accès élève",
          text: [
            `Bonjour ${user.full_name},`,
            "",
            "Voici votre lien de réinitialisation :",
            resetUrl,
            "",
            "Ce lien expire automatiquement.",
          ].join("\n"),
          html: buildResetEmailHtml({
            fullName: user.full_name,
            resetUrl,
          }),
        });
      }

      return res.status(200).json({
        ok: true,
        message:
          "Si un compte correspond à cette adresse, un lien de réinitialisation vient d’être envoyé.",
        debug_reset_token:
          config.env !== "production" && !mailer.isConfigured && user ? debugToken : undefined,
      });
    })
  );

  router.post(
    "/auth/reset-password",
    asyncHandler(async (req, res) => {
      const validation = validateResetPasswordPayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Réinitialisation impossible.", {
          field_errors: validation.errors,
        });
      }

      const resetToken = getPasswordResetToken(validation.values.token);

      if (!resetToken) {
        throw createHttpError(400, "Le lien de réinitialisation est invalide ou expiré.");
      }

      updateUserPassword(resetToken.user_id, hashPassword(validation.values.password));
      consumePasswordResetToken(resetToken.id);

      return res.status(200).json({
        ok: true,
        message: "Mot de passe mis à jour avec succès.",
      });
    })
  );

  router.get("/courses", (req, res) => {
    const courses = listPublishedCourses();

    if (!req.studentSession) {
      return res.json({
        ok: true,
        courses: courses.map((course) => ({
          ...course,
          enrolled: false,
        })),
      });
    }

    const enrollments = listUserEnrollments(req.studentSession.user.id);
    const enrollmentSet = new Set(enrollments.map((enrollment) => enrollment.course_id));

    return res.json({
      ok: true,
      courses: courses.map((course) => ({
        ...course,
        enrolled: enrollmentSet.has(course.id),
      })),
    });
  });

  router.post(
    "/checkout/session",
    requireStudentSession,
    asyncHandler(async (req, res) => {
      const canUseFakeCheckout =
        !isStripeConfigured() &&
        config.env !== "production" &&
        config.student.allowDevFakeCheckout;

      if (!isStripeConfigured() && !canUseFakeCheckout) {
        throw createHttpError(
          503,
          "Le paiement est momentanément indisponible. Contactez Astra Studio pour finaliser votre inscription."
        );
      }

      const validation = validateCheckoutPayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Formation invalide.", {
          field_errors: validation.errors,
        });
      }

      const course = getCourseBySlug(validation.values.course_slug);

      if (!course || course.status !== "published") {
        throw createHttpError(404, "Formation introuvable.");
      }

      const enrollment = getEnrollment(req.studentSession.user.id, course.id);

      if (enrollment) {
        return res.status(200).json({
          ok: true,
          already_enrolled: true,
          redirect_to: `${config.site.studentCourseRoute}?course=${encodeURIComponent(course.slug)}`,
        });
      }

      if (canUseFakeCheckout) {
        createOrUpdatePurchase({
          user_id: req.studentSession.user.id,
          course_id: course.id,
          provider: "dev_fake",
          provider_session_id: `fake_${Date.now()}_${randomBytes(4).toString("hex")}`,
          amount_cents: Number(course.price_cents || 0),
          currency: String(course.currency || "EUR"),
          status: "paid",
          paid_at: new Date().toISOString(),
          metadata: {
            mode: "dev_fake_checkout",
            note: "Paiement simulé local (Stripe non configuré)",
          },
        });

        createOrActivateEnrollment({
          user_id: req.studentSession.user.id,
          course_id: course.id,
          source: "dev_fake_checkout",
        });

        return res.status(200).json({
          ok: true,
          fake_checkout: true,
          already_enrolled: true,
          message: "Mode démo actif : accès formation débloqué immédiatement.",
          redirect_to: `${config.site.studentCourseRoute}?course=${encodeURIComponent(course.slug)}`,
        });
      }

      const checkoutSession = await createCheckoutSession({
        course,
        user: req.studentSession.user,
      });

      createOrUpdatePurchase({
        user_id: req.studentSession.user.id,
        course_id: course.id,
        provider: "stripe",
        provider_session_id: checkoutSession.id,
        amount_cents: Number(course.price_cents || 0),
        currency: String(course.currency || "EUR"),
        status: "pending",
        metadata: {
          checkout_url: checkoutSession.url,
        },
      });

      return res.status(200).json({
        ok: true,
        checkout_url: checkoutSession.url,
      });
    })
  );

  router.post(
    "/checkout/confirm",
    requireStudentSession,
    asyncHandler(async (req, res) => {
      const validation = validateCheckoutConfirmPayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Session de paiement invalide.", {
          field_errors: validation.errors,
        });
      }

      const checkoutSession = await retrieveCheckoutSession(validation.values.session_id);
      const metadata = checkoutSession.metadata || {};
      const userId = metadata.user_id || "";
      const courseId = metadata.course_id || "";

      if (!userId || !courseId || userId !== req.studentSession.user.id) {
        throw createHttpError(403, "Session de paiement non autorisée.");
      }

      const purchase =
        getPurchaseByProviderSessionId(checkoutSession.id) ||
        createOrUpdatePurchase({
          user_id: userId,
          course_id: courseId,
          provider: "stripe",
          provider_session_id: checkoutSession.id,
          provider_payment_intent:
            typeof checkoutSession.payment_intent === "string"
              ? checkoutSession.payment_intent
              : checkoutSession.payment_intent?.id || "",
          amount_cents: checkoutSession.amount_total || 0,
          currency: checkoutSession.currency || "eur",
          status: checkoutSession.payment_status === "paid" ? "paid" : "pending",
          metadata: {
            mode: checkoutSession.mode,
          },
        });

      if (checkoutSession.payment_status === "paid") {
        markPurchasePaid({
          purchase_id: purchase.id,
          provider_payment_intent:
            typeof checkoutSession.payment_intent === "string"
              ? checkoutSession.payment_intent
              : checkoutSession.payment_intent?.id || "",
          metadata: {
            amount_total: checkoutSession.amount_total || 0,
            currency: checkoutSession.currency || "eur",
          },
        });

        createOrActivateEnrollment({
          user_id: userId,
          course_id: courseId,
          source: "purchase",
        });
      }

      return res.status(200).json({
        ok: true,
        payment_status: checkoutSession.payment_status,
        enrolled: checkoutSession.payment_status === "paid",
        course_id: courseId,
        course_slug: metadata.course_slug || getCourseById(courseId)?.slug || "",
      });
    })
  );

  router.get(
    "/dashboard",
    requireStudentSession,
    asyncHandler(async (req, res) => {
      const payload = getDashboardPayload(req.studentSession.user.id);

      return res.status(200).json({
        ok: true,
        user: req.studentSession.user,
        ...payload,
      });
    })
  );

  router.get(
    "/courses/:courseSlug",
    requireStudentSession,
    asyncHandler(async (req, res) => {
      const courseSlug = sanitizeText(req.params.courseSlug, { max: 120 });
      const course = getCourseBySlug(courseSlug);

      if (!course) {
        throw createHttpError(404, "Formation introuvable.");
      }

      const enrollment = getEnrollment(req.studentSession.user.id, course.id);

      if (!enrollment) {
        throw createHttpError(403, "Accès réservé aux élèves inscrits à cette formation.");
      }

      const tree = getCourseTreeForStudent(req.studentSession.user.id, course.id);

      if (!tree) {
        throw createHttpError(404, "Programme introuvable.");
      }

      return res.status(200).json({
        ok: true,
        course: {
          ...tree,
          presentation: getCoursePresentation(course.id) || getCoursePresentation(course.slug) || null,
        },
        submissions: listSubmissionsForUser(req.studentSession.user.id, { course_id: course.id }),
      });
    })
  );

  router.post(
    "/progress",
    requireStudentSession,
    asyncHandler(async (req, res) => {
      const validation = validateProgressPayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Progression invalide.", {
          field_errors: validation.errors,
        });
      }

      const lesson = getLessonById(validation.values.lesson_id);

      if (!lesson) {
        throw createHttpError(404, "Leçon introuvable.");
      }

      const enrollment = getEnrollment(req.studentSession.user.id, lesson.course_id);

      if (!enrollment) {
        throw createHttpError(403, "Accès non autorisé à cette leçon.");
      }

      upsertLessonProgress({
        user_id: req.studentSession.user.id,
        course_id: lesson.course_id,
        module_id: lesson.module_id,
        lesson_id: lesson.id,
        status: validation.values.status,
        progress_percent: validation.values.progress_percent,
        last_position_seconds: validation.values.last_position_seconds,
      });

      return res.status(200).json({
        ok: true,
        course: {
          ...getCourseTreeForStudent(req.studentSession.user.id, lesson.course_id),
          presentation:
            getCoursePresentation(lesson.course_id) ||
            getCoursePresentation(getCourseById(lesson.course_id)?.slug || "") ||
            null,
        },
      });
    })
  );

  router.post(
    "/submissions",
    requireStudentSession,
    upload.array("attachments", 4),
    asyncHandler(async (req, res) => {
      const validation = validateSubmissionPayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Soumission invalide.", {
          field_errors: validation.errors,
        });
      }

      const lesson = getLessonById(validation.values.lesson_id);

      if (!lesson) {
        throw createHttpError(404, "Leçon introuvable.");
      }

      const enrollment = getEnrollment(req.studentSession.user.id, lesson.course_id);

      if (!enrollment) {
        throw createHttpError(403, "Accès non autorisé.");
      }

      const files = Array.isArray(req.files) ? req.files : [];
      const attachments = files.map((file) => ({
        original_name: file.originalname,
        stored_name: path.basename(file.filename),
        mime_type: file.mimetype,
        size_bytes: file.size,
      }));

      const submission = createSubmissionWithAttachments({
        user_id: req.studentSession.user.id,
        course_id: lesson.course_id,
        module_id: lesson.module_id,
        lesson_id: lesson.id,
        text_response: validation.values.text_response,
        attachments,
      });

      return res.status(201).json({
        ok: true,
        submission,
        message: "Votre devoir a bien été envoyé.",
      });
    })
  );

  router.get(
    "/submissions",
    requireStudentSession,
    asyncHandler(async (req, res) => {
      const courseSlug = sanitizeText(req.query.course, { max: 120 });
      let courseId = "";

      if (courseSlug) {
        const course = getCourseBySlug(courseSlug);
        if (course) {
          courseId = course.id;
        }
      }

      return res.status(200).json({
        ok: true,
        submissions: listSubmissionsForUser(req.studentSession.user.id, {
          course_id: courseId || undefined,
        }),
      });
    })
  );

  router.get(
    "/submissions/attachments/:attachmentId",
    requireStudentSession,
    asyncHandler(async (req, res) => {
      const attachmentId = sanitizeText(req.params.attachmentId, { max: 120 });
      const attachment = getAttachmentById(attachmentId);

      if (!attachment) {
        throw createHttpError(404, "Pièce jointe introuvable.");
      }

      if (attachment.user_id !== req.studentSession.user.id) {
        throw createHttpError(403, "Accès non autorisé.");
      }

      const absolutePath = path.join(getUploadsDirectory(), path.basename(attachment.stored_name));

      if (!fs.existsSync(absolutePath)) {
        throw createHttpError(404, "Fichier introuvable.");
      }

      return res.download(absolutePath, getSafeFilename(attachment.original_name));
    })
  );

  return router;
}

module.exports = {
  createStudentRouter,
};
