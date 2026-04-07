const fs = require("node:fs");
const path = require("node:path");

const express = require("express");

const { requireAdminSession } = require("../middleware/admin-session");
const {
  createCourse,
  createLesson,
  createManualEnrollment,
  createModule,
  getAcademyOverview,
  getAttachmentById,
  getCourseById,
  getLessonById,
  getModuleById,
  listCoursesAdmin,
  listLessonsByCourse,
  listModulesByCourse,
  listPurchasesAdmin,
  listSubmissionsForAdmin,
  listUsersAdmin,
  updateCourse,
  updateLesson,
  updateModule,
  updateSubmissionReview,
} = require("../repositories/academy.repository");
const { asyncHandler } = require("../utils/async-handler");
const { createHttpError } = require("../utils/http-error");
const { sanitizeText } = require("../utils/sanitize");
const { config } = require("../config/env");
const {
  validateAdminCoursePayload,
  validateAdminLessonPayload,
  validateAdminModulePayload,
  validateManualEnrollmentPayload,
  validateSubmissionReviewPayload,
} = require("../validation/academy.validation");

function getUploadsDirectory() {
  const uploadsDirectory = path.join(config.uploadsDir, "submissions");
  fs.mkdirSync(uploadsDirectory, { recursive: true });
  return uploadsDirectory;
}

function createAdminAcademyRouter() {
  const router = express.Router();

  router.use(requireAdminSession);

  router.get(
    "/overview",
    asyncHandler(async (_req, res) => {
      res.json({
        ok: true,
        data: getAcademyOverview(),
      });
    })
  );

  router.get(
    "/courses",
    asyncHandler(async (_req, res) => {
      res.json({
        ok: true,
        courses: listCoursesAdmin(),
      });
    })
  );

  router.post(
    "/courses",
    asyncHandler(async (req, res) => {
      const validation = validateAdminCoursePayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Données de formation invalides.", {
          field_errors: validation.errors,
        });
      }

      const course = createCourse(validation.values);

      return res.status(201).json({
        ok: true,
        course,
      });
    })
  );

  router.patch(
    "/courses/:courseId",
    asyncHandler(async (req, res) => {
      const validation = validateAdminCoursePayload({
        ...getCourseById(req.params.courseId),
        ...req.body,
      });

      if (!validation.valid) {
        throw createHttpError(400, "Données de formation invalides.", {
          field_errors: validation.errors,
        });
      }

      const course = updateCourse(req.params.courseId, validation.values);

      if (!course) {
        throw createHttpError(404, "Formation introuvable.");
      }

      return res.json({
        ok: true,
        course,
      });
    })
  );

  router.get(
    "/courses/:courseId/modules",
    asyncHandler(async (req, res) => {
      const course = getCourseById(req.params.courseId);

      if (!course) {
        throw createHttpError(404, "Formation introuvable.");
      }

      const modules = listModulesByCourse(course.id).map((module) => {
        const lessonCount = listLessonsByCourse(course.id).filter(
          (lesson) => lesson.module_id === module.id
        ).length;
        return {
          ...module,
          lesson_count: lessonCount,
        };
      });

      return res.json({
        ok: true,
        course,
        modules,
      });
    })
  );

  router.post(
    "/modules",
    asyncHandler(async (req, res) => {
      const validation = validateAdminModulePayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Données de module invalides.", {
          field_errors: validation.errors,
        });
      }

      const course = getCourseById(validation.values.course_id);
      if (!course) {
        throw createHttpError(404, "Formation introuvable.");
      }

      const module = createModule(validation.values);

      return res.status(201).json({
        ok: true,
        module,
      });
    })
  );

  router.patch(
    "/modules/:moduleId",
    asyncHandler(async (req, res) => {
      const module = getModuleById(req.params.moduleId);

      if (!module) {
        throw createHttpError(404, "Module introuvable.");
      }

      const validation = validateAdminModulePayload({
        ...module,
        ...req.body,
      });

      if (!validation.valid) {
        throw createHttpError(400, "Données de module invalides.", {
          field_errors: validation.errors,
        });
      }

      const updatedModule = updateModule(req.params.moduleId, validation.values);

      return res.json({
        ok: true,
        module: updatedModule,
      });
    })
  );

  router.get(
    "/modules/:moduleId/lessons",
    asyncHandler(async (req, res) => {
      const module = getModuleById(req.params.moduleId);

      if (!module) {
        throw createHttpError(404, "Module introuvable.");
      }

      const lessons = listLessonsByCourse(module.course_id).filter(
        (lesson) => lesson.module_id === module.id
      );

      return res.json({
        ok: true,
        module,
        lessons,
      });
    })
  );

  router.post(
    "/lessons",
    asyncHandler(async (req, res) => {
      const validation = validateAdminLessonPayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Données de leçon invalides.", {
          field_errors: validation.errors,
        });
      }

      const module = getModuleById(validation.values.module_id);
      if (!module) {
        throw createHttpError(404, "Module introuvable.");
      }

      const lesson = createLesson(validation.values);

      return res.status(201).json({
        ok: true,
        lesson,
      });
    })
  );

  router.patch(
    "/lessons/:lessonId",
    asyncHandler(async (req, res) => {
      const lesson = getLessonById(req.params.lessonId);

      if (!lesson) {
        throw createHttpError(404, "Leçon introuvable.");
      }

      const validation = validateAdminLessonPayload({
        ...lesson,
        ...req.body,
      });

      if (!validation.valid) {
        throw createHttpError(400, "Données de leçon invalides.", {
          field_errors: validation.errors,
        });
      }

      const updatedLesson = updateLesson(req.params.lessonId, validation.values);

      return res.json({
        ok: true,
        lesson: updatedLesson,
      });
    })
  );

  router.get(
    "/users",
    asyncHandler(async (req, res) => {
      const query = sanitizeText(req.query.q, { max: 120 });
      res.json({
        ok: true,
        users: listUsersAdmin({
          query,
        }),
      });
    })
  );

  router.get(
    "/purchases",
    asyncHandler(async (req, res) => {
      const query = sanitizeText(req.query.q, { max: 120 });
      const status = sanitizeText(req.query.status, { max: 40 });
      res.json({
        ok: true,
        purchases: listPurchasesAdmin({
          query,
          status,
        }),
      });
    })
  );

  router.get(
    "/submissions",
    asyncHandler(async (req, res) => {
      const query = sanitizeText(req.query.q, { max: 120 });
      const status = sanitizeText(req.query.status, { max: 40 });

      res.json({
        ok: true,
        submissions: listSubmissionsForAdmin({
          query,
          status,
        }),
      });
    })
  );

  router.patch(
    "/submissions/:submissionId",
    asyncHandler(async (req, res) => {
      const validation = validateSubmissionReviewPayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Mise à jour de devoir invalide.", {
          field_errors: validation.errors,
        });
      }

      const submission = updateSubmissionReview(req.params.submissionId, validation.values);

      if (!submission) {
        throw createHttpError(404, "Soumission introuvable.");
      }

      res.json({
        ok: true,
        submission,
      });
    })
  );

  router.post(
    "/enrollments/manual",
    asyncHandler(async (req, res) => {
      const validation = validateManualEnrollmentPayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Attribution manuelle invalide.", {
          field_errors: validation.errors,
        });
      }

      const enrollment = createManualEnrollment({
        email: validation.values.email,
        course_id: validation.values.course_id,
      });

      if (!enrollment) {
        throw createHttpError(404, "Élève introuvable pour cette adresse e-mail.");
      }

      res.status(201).json({
        ok: true,
        enrollment,
      });
    })
  );

  router.get(
    "/submissions/attachments/:attachmentId",
    asyncHandler(async (req, res) => {
      const attachmentId = sanitizeText(req.params.attachmentId, { max: 120 });
      const attachment = getAttachmentById(attachmentId);

      if (!attachment) {
        throw createHttpError(404, "Pièce jointe introuvable.");
      }

      const absolutePath = path.join(getUploadsDirectory(), path.basename(attachment.stored_name));
      if (!fs.existsSync(absolutePath)) {
        throw createHttpError(404, "Fichier introuvable.");
      }

      return res.download(absolutePath, attachment.original_name || "piece-jointe");
    })
  );

  return router;
}

module.exports = {
  createAdminAcademyRouter,
};
