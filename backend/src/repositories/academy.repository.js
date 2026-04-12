const { createHash, randomUUID } = require("node:crypto");

const { getDatabase } = require("../db/database");
const { bindNamedParameters } = require("../utils/sqlite");

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    status: row.status,
    last_login_at: row.last_login_at,
  };
}

function listPublishedCourses() {
  const db = getDatabase();

  return db
    .prepare(`
      SELECT
        c.*,
        COUNT(DISTINCT m.id) AS module_count,
        COUNT(DISTINCT l.id) AS lesson_count
      FROM academy_courses c
      LEFT JOIN academy_modules m ON m.course_id = c.id
      LEFT JOIN academy_lessons l ON l.course_id = c.id
      WHERE c.status = 'published'
      GROUP BY c.id
      ORDER BY c.order_index ASC, c.created_at ASC
    `)
    .all();
}

function listCoursesAdmin() {
  const db = getDatabase();

  return db
    .prepare(`
      SELECT
        c.*,
        COUNT(DISTINCT m.id) AS module_count,
        COUNT(DISTINCT l.id) AS lesson_count,
        COUNT(DISTINCT e.id) AS enrollment_count
      FROM academy_courses c
      LEFT JOIN academy_modules m ON m.course_id = c.id
      LEFT JOIN academy_lessons l ON l.course_id = c.id
      LEFT JOIN academy_enrollments e ON e.course_id = c.id AND e.status = 'active'
      GROUP BY c.id
      ORDER BY c.order_index ASC, c.created_at ASC
    `)
    .all();
}

function getCourseBySlug(slug) {
  const db = getDatabase();
  return (
    db
      .prepare("SELECT * FROM academy_courses WHERE slug = @slug")
      .get(bindNamedParameters({ slug })) || null
  );
}

function getCourseById(courseId) {
  const db = getDatabase();
  return (
    db
      .prepare("SELECT * FROM academy_courses WHERE id = @course_id")
      .get(bindNamedParameters({ course_id: courseId })) || null
  );
}

function listModulesByCourse(courseId) {
  const db = getDatabase();
  return db
    .prepare(
      "SELECT * FROM academy_modules WHERE course_id = @course_id ORDER BY order_index ASC, created_at ASC"
    )
    .all(bindNamedParameters({ course_id: courseId }));
}

function listLessonsByCourse(courseId) {
  const db = getDatabase();
  return db
    .prepare(`
      SELECT
        l.*,
        m.title AS module_title,
        m.order_index AS module_order_index
      FROM academy_lessons l
      INNER JOIN academy_modules m ON m.id = l.module_id
      WHERE l.course_id = @course_id
      ORDER BY m.order_index ASC, l.order_index ASC, l.created_at ASC
    `)
    .all(bindNamedParameters({ course_id: courseId }));
}

function listResourcesByCourse(courseId) {
  const db = getDatabase();
  return db
    .prepare(
      "SELECT * FROM academy_resources WHERE course_id = @course_id ORDER BY order_index ASC, created_at ASC"
    )
    .all(bindNamedParameters({ course_id: courseId }));
}

function getLessonById(lessonId) {
  const db = getDatabase();
  return (
    db
      .prepare("SELECT * FROM academy_lessons WHERE id = @lesson_id")
      .get(bindNamedParameters({ lesson_id: lessonId })) || null
  );
}

function getModuleById(moduleId) {
  const db = getDatabase();
  return (
    db
      .prepare("SELECT * FROM academy_modules WHERE id = @module_id")
      .get(bindNamedParameters({ module_id: moduleId })) || null
  );
}

function getUserByEmail(email) {
  const db = getDatabase();
  const normalizedEmail = normalizeEmail(email);
  const row =
    db
      .prepare("SELECT * FROM academy_users WHERE email = @email LIMIT 1")
      .get(bindNamedParameters({ email: normalizedEmail })) || null;
  return row;
}

function getUserById(userId) {
  const db = getDatabase();
  const row =
    db
      .prepare("SELECT * FROM academy_users WHERE id = @user_id")
      .get(bindNamedParameters({ user_id: userId })) || null;
  return row;
}

function createUser(input) {
  const db = getDatabase();
  const now = nowIso();
  const user = {
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    full_name: input.full_name,
    email: normalizeEmail(input.email),
    password_hash: input.password_hash,
    role: input.role || "student",
    status: input.status || "active",
    last_login_at: "",
  };

  db.prepare(`
    INSERT INTO academy_users (
      id, created_at, updated_at, full_name, email, password_hash, role, status, last_login_at
    ) VALUES (
      @id, @created_at, @updated_at, @full_name, @email, @password_hash, @role, @status, @last_login_at
    )
  `).run(bindNamedParameters(user));

  return mapUser(user);
}

function updateUserPassword(userId, passwordHash) {
  const db = getDatabase();
  const updatedAt = nowIso();
  db.prepare(`
    UPDATE academy_users
    SET password_hash = @password_hash, updated_at = @updated_at
    WHERE id = @user_id
  `).run(
    bindNamedParameters({
      password_hash: passwordHash,
      updated_at: updatedAt,
      user_id: userId,
    })
  );
}

function markUserLastLogin(userId) {
  const db = getDatabase();
  const now = nowIso();
  db.prepare(`
    UPDATE academy_users
    SET last_login_at = @last_login_at, updated_at = @updated_at
    WHERE id = @user_id
  `).run(
    bindNamedParameters({
      last_login_at: now,
      updated_at: now,
      user_id: userId,
    })
  );
}

function createStudentSession(input) {
  const db = getDatabase();
  const session = {
    id: randomUUID(),
    user_id: input.user_id,
    token_hash: hashToken(input.token),
    created_at: nowIso(),
    expires_at: input.expires_at,
    ip: input.ip || "",
    user_agent: input.user_agent || "",
  };

  db.prepare(`
    INSERT INTO academy_sessions (
      id, user_id, token_hash, created_at, expires_at, ip, user_agent
    ) VALUES (
      @id, @user_id, @token_hash, @created_at, @expires_at, @ip, @user_agent
    )
  `).run(bindNamedParameters(session));

  return session;
}

function deleteExpiredStudentSessions() {
  const db = getDatabase();
  db.prepare(`
    DELETE FROM academy_sessions
    WHERE datetime(expires_at) < datetime('now')
  `).run();
}

function deleteStudentSessionByToken(token) {
  const db = getDatabase();
  db.prepare("DELETE FROM academy_sessions WHERE token_hash = @token_hash").run(
    bindNamedParameters({ token_hash: hashToken(token) })
  );
}

function getStudentSessionByToken(token) {
  const db = getDatabase();
  const tokenHash = hashToken(token);

  const row =
    db
      .prepare(`
        SELECT
          s.*,
          u.full_name,
          u.email,
          u.role,
          u.status AS user_status
        FROM academy_sessions s
        INNER JOIN academy_users u ON u.id = s.user_id
        WHERE s.token_hash = @token_hash
        LIMIT 1
      `)
      .get(bindNamedParameters({ token_hash: tokenHash })) || null;

  if (!row) {
    return null;
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    db.prepare("DELETE FROM academy_sessions WHERE id = @session_id").run(
      bindNamedParameters({ session_id: row.id })
    );
    return null;
  }

  return row;
}

function createPasswordResetToken(input) {
  const db = getDatabase();
  const now = nowIso();
  db.prepare(`
    DELETE FROM academy_password_resets
    WHERE user_id = @user_id
       OR datetime(expires_at) < datetime('now')
  `).run(bindNamedParameters({ user_id: input.user_id }));

  const tokenRecord = {
    id: randomUUID(),
    user_id: input.user_id,
    token_hash: hashToken(input.token),
    created_at: now,
    expires_at: input.expires_at,
    consumed_at: "",
  };

  db.prepare(`
    INSERT INTO academy_password_resets (
      id, user_id, token_hash, created_at, expires_at, consumed_at
    ) VALUES (
      @id, @user_id, @token_hash, @created_at, @expires_at, @consumed_at
    )
  `).run(bindNamedParameters(tokenRecord));

  return tokenRecord;
}

function getPasswordResetToken(token) {
  const db = getDatabase();
  const row =
    db
      .prepare(`
        SELECT *
        FROM academy_password_resets
        WHERE token_hash = @token_hash
          AND consumed_at = ''
        LIMIT 1
      `)
      .get(bindNamedParameters({ token_hash: hashToken(token) })) || null;

  if (!row) {
    return null;
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return row;
}

function consumePasswordResetToken(resetId) {
  const db = getDatabase();
  db.prepare(`
    UPDATE academy_password_resets
    SET consumed_at = @consumed_at
    WHERE id = @reset_id
  `).run(
    bindNamedParameters({
      consumed_at: nowIso(),
      reset_id: resetId,
    })
  );
}

function listUserEnrollments(userId) {
  const db = getDatabase();
  return db
    .prepare(`
      SELECT
        e.*,
        c.slug,
        c.title,
        c.subtitle,
        c.description,
        c.level,
        c.price_cents,
        c.currency,
        (
          SELECT COUNT(*)
          FROM academy_lessons l
          WHERE l.course_id = c.id
        ) AS total_lessons,
        (
          SELECT COUNT(*)
          FROM academy_lesson_progress p
          WHERE p.user_id = e.user_id
            AND p.course_id = e.course_id
            AND p.status = 'completed'
        ) AS completed_lessons,
        (
          SELECT MAX(updated_at)
          FROM academy_lesson_progress p2
          WHERE p2.user_id = e.user_id
            AND p2.course_id = e.course_id
        ) AS last_activity_at
      FROM academy_enrollments e
      INNER JOIN academy_courses c ON c.id = e.course_id
      WHERE e.user_id = @user_id
        AND e.status = 'active'
      ORDER BY datetime(e.updated_at) DESC
    `)
    .all(bindNamedParameters({ user_id: userId }));
}

function getEnrollment(userId, courseId) {
  const db = getDatabase();
  return (
    db
      .prepare(`
        SELECT *
        FROM academy_enrollments
        WHERE user_id = @user_id
          AND course_id = @course_id
          AND status = 'active'
        LIMIT 1
      `)
      .get(
        bindNamedParameters({
          user_id: userId,
          course_id: courseId,
        })
      ) || null
  );
}

function createOrActivateEnrollment(input) {
  const db = getDatabase();
  const now = nowIso();
  const enrollmentId = randomUUID();
  db.prepare(`
    INSERT INTO academy_enrollments (
      id, created_at, updated_at, user_id, course_id, source, status, started_at, completed_at
    ) VALUES (
      @id, @created_at, @updated_at, @user_id, @course_id, @source, 'active', '', ''
    )
    ON CONFLICT(user_id, course_id)
    DO UPDATE SET
      updated_at = excluded.updated_at,
      source = excluded.source,
      status = 'active'
  `).run(
    bindNamedParameters({
      id: enrollmentId,
      created_at: now,
      updated_at: now,
      user_id: input.user_id,
      course_id: input.course_id,
      source: input.source || "purchase",
    })
  );

  return getEnrollment(input.user_id, input.course_id);
}

function createOrUpdatePurchase(input) {
  const db = getDatabase();
  const existing =
    db
      .prepare(`
        SELECT *
        FROM academy_purchases
        WHERE provider = @provider
          AND provider_session_id = @provider_session_id
        LIMIT 1
      `)
      .get(
        bindNamedParameters({
          provider: input.provider || "stripe",
          provider_session_id: input.provider_session_id,
        })
      ) || null;
  const now = nowIso();

  if (existing) {
    db.prepare(`
      UPDATE academy_purchases
      SET updated_at = @updated_at,
          user_id = @user_id,
          course_id = @course_id,
          amount_cents = @amount_cents,
          currency = @currency,
          metadata_json = @metadata_json,
          status = @status
      WHERE id = @purchase_id
    `).run(
      bindNamedParameters({
        updated_at: now,
        user_id: input.user_id,
        course_id: input.course_id,
        amount_cents: input.amount_cents,
        currency: input.currency,
        metadata_json: JSON.stringify(input.metadata || {}),
        status: input.status || existing.status,
        purchase_id: existing.id,
      })
    );
    return getPurchaseByProviderSessionId(input.provider_session_id);
  }

  const purchase = {
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    user_id: input.user_id,
    course_id: input.course_id,
    provider: input.provider || "stripe",
    provider_session_id: input.provider_session_id || "",
    provider_payment_intent: input.provider_payment_intent || "",
    amount_cents: input.amount_cents || 0,
    currency: String(input.currency || "eur").toUpperCase(),
    status: input.status || "pending",
    paid_at: input.paid_at || "",
    metadata_json: JSON.stringify(input.metadata || {}),
  };

  db.prepare(`
    INSERT INTO academy_purchases (
      id, created_at, updated_at, user_id, course_id, provider, provider_session_id,
      provider_payment_intent, amount_cents, currency, status, paid_at, metadata_json
    ) VALUES (
      @id, @created_at, @updated_at, @user_id, @course_id, @provider, @provider_session_id,
      @provider_payment_intent, @amount_cents, @currency, @status, @paid_at, @metadata_json
    )
  `).run(bindNamedParameters(purchase));

  return purchase;
}

function getPurchaseByProviderSessionId(sessionId) {
  const db = getDatabase();
  return (
    db
      .prepare(`
        SELECT *
        FROM academy_purchases
        WHERE provider = 'stripe'
          AND provider_session_id = @provider_session_id
        LIMIT 1
      `)
      .get(bindNamedParameters({ provider_session_id: sessionId })) || null
  );
}

function markPurchasePaid(input) {
  const db = getDatabase();
  const now = nowIso();
  db.prepare(`
    UPDATE academy_purchases
    SET updated_at = @updated_at,
        status = 'paid',
        paid_at = CASE WHEN paid_at = '' THEN @paid_at ELSE paid_at END,
        provider_payment_intent = CASE WHEN @provider_payment_intent = '' THEN provider_payment_intent ELSE @provider_payment_intent END,
        metadata_json = @metadata_json
    WHERE id = @purchase_id
  `).run(
    bindNamedParameters({
      updated_at: now,
      paid_at: now,
      provider_payment_intent: input.provider_payment_intent || "",
      metadata_json: JSON.stringify(input.metadata || {}),
      purchase_id: input.purchase_id,
    })
  );
}

function markPurchaseFailed(input) {
  const db = getDatabase();
  db.prepare(`
    UPDATE academy_purchases
    SET updated_at = @updated_at, status = @status
    WHERE id = @purchase_id
  `).run(
    bindNamedParameters({
      updated_at: nowIso(),
      status: input.status || "failed",
      purchase_id: input.purchase_id,
    })
  );
}

function listPurchasesAdmin(filters = {}) {
  const db = getDatabase();
  const clauses = [];
  const params = {};

  if (filters.status) {
    clauses.push("p.status = @status");
    params.status = filters.status;
  }

  if (filters.query) {
    clauses.push("(u.email LIKE @query OR u.full_name LIKE @query OR c.title LIKE @query)");
    params.query = `%${filters.query}%`;
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  return db
    .prepare(`
      SELECT
        p.*,
        u.full_name AS user_name,
        u.email AS user_email,
        c.slug AS course_slug,
        c.title AS course_title
      FROM academy_purchases p
      INNER JOIN academy_users u ON u.id = p.user_id
      INNER JOIN academy_courses c ON c.id = p.course_id
      ${whereClause}
      ORDER BY datetime(p.created_at) DESC
    `)
    .all(bindNamedParameters(params));
}

function listUsersAdmin(filters = {}) {
  const db = getDatabase();
  const clauses = ["u.role = 'student'"];
  const params = {};

  if (filters.query) {
    clauses.push("(u.full_name LIKE @query OR u.email LIKE @query)");
    params.query = `%${filters.query}%`;
  }

  return db
    .prepare(`
      SELECT
        u.*,
        (
          SELECT COUNT(*)
          FROM academy_enrollments e
          WHERE e.user_id = u.id
            AND e.status = 'active'
        ) AS enrollment_count
      FROM academy_users u
      WHERE ${clauses.join(" AND ")}
      ORDER BY datetime(u.created_at) DESC
    `)
    .all(bindNamedParameters(params))
    .map(mapUser)
    .map((user, index) => ({
      ...user,
      enrollment_count:
        db
          .prepare(`
          SELECT COUNT(*) AS total
          FROM academy_enrollments
          WHERE user_id = @user_id
              AND status = 'active'
          `)
          .get(bindNamedParameters({ user_id: user.id }))?.total || 0,
      row_index: index,
    }));
}

function getCourseTreeForStudent(userId, courseId) {
  const course = getCourseById(courseId);

  if (!course) {
    return null;
  }

  const modules = listModulesByCourse(courseId);
  const lessons = listLessonsByCourse(courseId);
  const resources = listResourcesByCourse(courseId);
  const db = getDatabase();
  const progressRows = db
    .prepare(`
      SELECT *
      FROM academy_lesson_progress
      WHERE user_id = @user_id
        AND course_id = @course_id
    `)
    .all(
      bindNamedParameters({
        user_id: userId,
        course_id: courseId,
      })
    );

  const progressMap = new Map(progressRows.map((row) => [row.lesson_id, row]));
  const lessonOrder = lessons.map((lesson) => ({
    ...lesson,
    progress: progressMap.get(lesson.id) || null,
  }));
  const lessonsByModule = modules.map((module) => {
    const moduleLessons = lessonOrder.filter((lesson) => lesson.module_id === module.id);

    const completed = moduleLessons.filter((lesson) => lesson.progress?.status === "completed").length;
    const moduleDuration = moduleLessons.reduce(
      (sum, lesson) => sum + Number(lesson.duration_minutes || 0),
      0
    );

    return {
      ...module,
      lessons: moduleLessons,
      stats: {
        total_lessons: moduleLessons.length,
        completed_lessons: completed,
        total_duration_minutes: moduleDuration,
      },
    };
  }).filter((module) => module.lessons.length > 0);

  const totalLessons = lessons.length;
  const completedLessons = progressRows.filter((row) => row.status === "completed").length;
  const progressPercent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const totalDurationMinutes = lessonOrder.reduce(
    (sum, lesson) => sum + Number(lesson.duration_minutes || 0),
    0
  );
  const completedDurationMinutes = lessonOrder
    .filter((lesson) => lesson.progress?.status === "completed")
    .reduce((sum, lesson) => sum + Number(lesson.duration_minutes || 0), 0);
  const nextLesson =
    lessonOrder.find((lesson) => lesson.progress?.status !== "completed") ||
    lessonOrder[lessonOrder.length - 1] ||
    null;

  return {
    ...course,
    modules: lessonsByModule,
    resources,
    next_lesson: nextLesson
      ? {
          id: nextLesson.id,
          title: nextLesson.title,
          module_id: nextLesson.module_id,
          module_title: nextLesson.module_title,
          duration_minutes: nextLesson.duration_minutes,
          lesson_type: nextLesson.lesson_type,
          progress_status: nextLesson.progress?.status || "not_started",
        }
      : null,
    stats: {
      total_lessons: totalLessons,
      completed_lessons: completedLessons,
      progress_percent: progressPercent,
      total_duration_minutes: totalDurationMinutes,
      completed_duration_minutes: completedDurationMinutes,
      remaining_duration_minutes: Math.max(0, totalDurationMinutes - completedDurationMinutes),
      last_activity_at:
        progressRows
          .slice()
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
          ?.updated_at || "",
    },
  };
}

function upsertLessonProgress(input) {
  const db = getDatabase();
  const now = nowIso();
  const current =
    db
      .prepare(`
        SELECT *
        FROM academy_lesson_progress
        WHERE user_id = @user_id
          AND lesson_id = @lesson_id
        LIMIT 1
      `)
      .get(
        bindNamedParameters({
          user_id: input.user_id,
          lesson_id: input.lesson_id,
        })
      ) || null;

  const nextStatus = input.status || current?.status || "in_progress";
  const nextPercent = Number.isFinite(input.progress_percent)
    ? Math.max(0, Math.min(100, Math.round(input.progress_percent)))
    : current?.progress_percent || 0;
  const startedAt = current?.started_at || now;
  const completedAt =
    nextStatus === "completed" ? current?.completed_at || now : current?.completed_at || "";

  if (!current) {
    db.prepare(`
      INSERT INTO academy_lesson_progress (
        id, created_at, updated_at, user_id, course_id, module_id, lesson_id,
        status, progress_percent, started_at, completed_at, last_position_seconds
      ) VALUES (
        @id, @created_at, @updated_at, @user_id, @course_id, @module_id, @lesson_id,
        @status, @progress_percent, @started_at, @completed_at, @last_position_seconds
      )
    `).run(
      bindNamedParameters({
        id: randomUUID(),
        created_at: now,
        updated_at: now,
        user_id: input.user_id,
        course_id: input.course_id,
        module_id: input.module_id,
        lesson_id: input.lesson_id,
        status: nextStatus,
        progress_percent: nextPercent,
        started_at: startedAt,
        completed_at: completedAt,
        last_position_seconds: Number(input.last_position_seconds || 0),
      })
    );

    return;
  }

  db.prepare(`
    UPDATE academy_lesson_progress
    SET updated_at = @updated_at,
        status = @status,
        progress_percent = @progress_percent,
        started_at = @started_at,
        completed_at = @completed_at,
        last_position_seconds = @last_position_seconds
    WHERE id = @progress_id
  `).run(
    bindNamedParameters({
      updated_at: now,
      status: nextStatus,
      progress_percent: nextPercent,
      started_at: startedAt,
      completed_at: completedAt,
      last_position_seconds: Number(input.last_position_seconds || current.last_position_seconds || 0),
      progress_id: current.id,
    })
  );
}

function createSubmissionWithAttachments(input) {
  const db = getDatabase();
  const now = nowIso();
  const submissionId = randomUUID();
  db.exec("BEGIN");

  try {
    db.prepare(`
      INSERT INTO academy_submissions (
        id, created_at, updated_at, user_id, course_id, module_id, lesson_id, status, text_response, admin_feedback, reviewed_at
      ) VALUES (@id, @created_at, @updated_at, @user_id, @course_id, @module_id, @lesson_id, 'submitted', @text_response, '', '')
    `).run(
      bindNamedParameters({
        id: submissionId,
        created_at: now,
        updated_at: now,
        user_id: input.user_id,
        course_id: input.course_id,
        module_id: input.module_id,
        lesson_id: input.lesson_id,
        text_response: input.text_response || "",
      })
    );

    const attachmentStatement = db.prepare(`
      INSERT INTO academy_submission_attachments (
        id, submission_id, user_id, created_at, original_name, stored_name, mime_type, size_bytes
      ) VALUES (@id, @submission_id, @user_id, @created_at, @original_name, @stored_name, @mime_type, @size_bytes)
    `);

    (input.attachments || []).forEach((file) => {
      attachmentStatement.run(
        bindNamedParameters({
          id: randomUUID(),
          submission_id: submissionId,
          user_id: input.user_id,
          created_at: now,
          original_name: file.original_name,
          stored_name: file.stored_name,
          mime_type: file.mime_type || "",
          size_bytes: Number(file.size_bytes || 0),
        })
      );
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return getSubmissionById(submissionId);
}

function listSubmissionsForUser(userId, filters = {}) {
  const db = getDatabase();
  const clauses = ["s.user_id = @user_id"];
  const params = { user_id: userId };

  if (filters.course_id) {
    clauses.push("s.course_id = @course_id");
    params.course_id = filters.course_id;
  }

  const rows = db
    .prepare(`
      SELECT
        s.*,
        c.title AS course_title,
        l.title AS lesson_title,
        m.title AS module_title
      FROM academy_submissions s
      INNER JOIN academy_courses c ON c.id = s.course_id
      INNER JOIN academy_lessons l ON l.id = s.lesson_id
      INNER JOIN academy_modules m ON m.id = s.module_id
      WHERE ${clauses.join(" AND ")}
      ORDER BY datetime(s.created_at) DESC
    `)
    .all(bindNamedParameters(params));

  return rows.map((submission) => ({
    ...submission,
    attachments: listAttachmentsForSubmission(submission.id),
  }));
}

function listSubmissionsForAdmin(filters = {}) {
  const db = getDatabase();
  const clauses = [];
  const params = {};

  if (filters.status) {
    clauses.push("s.status = @status");
    params.status = filters.status;
  }

  if (filters.query) {
    clauses.push("(u.full_name LIKE @query OR u.email LIKE @query OR c.title LIKE @query OR l.title LIKE @query)");
    params.query = `%${filters.query}%`;
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(`
      SELECT
        s.*,
        u.full_name AS user_name,
        u.email AS user_email,
        c.title AS course_title,
        c.slug AS course_slug,
        l.title AS lesson_title,
        m.title AS module_title
      FROM academy_submissions s
      INNER JOIN academy_users u ON u.id = s.user_id
      INNER JOIN academy_courses c ON c.id = s.course_id
      INNER JOIN academy_lessons l ON l.id = s.lesson_id
      INNER JOIN academy_modules m ON m.id = s.module_id
      ${whereClause}
      ORDER BY datetime(s.created_at) DESC
    `)
    .all(bindNamedParameters(params));

  return rows.map((submission) => ({
    ...submission,
    attachments: listAttachmentsForSubmission(submission.id),
  }));
}

function getSubmissionById(submissionId) {
  const db = getDatabase();
  const row =
    db
      .prepare(`
        SELECT
          s.*,
          u.full_name AS user_name,
          u.email AS user_email,
          c.title AS course_title,
          c.slug AS course_slug,
          l.title AS lesson_title,
          m.title AS module_title
        FROM academy_submissions s
        INNER JOIN academy_users u ON u.id = s.user_id
        INNER JOIN academy_courses c ON c.id = s.course_id
        INNER JOIN academy_lessons l ON l.id = s.lesson_id
        INNER JOIN academy_modules m ON m.id = s.module_id
        WHERE s.id = @submission_id
        LIMIT 1
      `)
      .get(bindNamedParameters({ submission_id: submissionId })) || null;

  if (!row) {
    return null;
  }

  return {
    ...row,
    attachments: listAttachmentsForSubmission(row.id),
  };
}

function listAttachmentsForSubmission(submissionId) {
  const db = getDatabase();
  return db
    .prepare(`
      SELECT *
      FROM academy_submission_attachments
      WHERE submission_id = @submission_id
      ORDER BY datetime(created_at) ASC
    `)
    .all(bindNamedParameters({ submission_id: submissionId }));
}

function getAttachmentById(attachmentId) {
  const db = getDatabase();
  return (
    db
      .prepare(`
        SELECT *
        FROM academy_submission_attachments
        WHERE id = @attachment_id
        LIMIT 1
      `)
      .get(bindNamedParameters({ attachment_id: attachmentId })) || null
  );
}

function updateSubmissionReview(submissionId, updates) {
  const db = getDatabase();
  const current = getSubmissionById(submissionId);

  if (!current) {
    return null;
  }

  const nextStatus = updates.status || current.status;
  const nextFeedback = typeof updates.admin_feedback === "string" ? updates.admin_feedback : current.admin_feedback;
  const reviewedAt = ["validated", "revision_requested"].includes(nextStatus) ? nowIso() : current.reviewed_at || "";
  const now = nowIso();

  db.prepare(`
    UPDATE academy_submissions
    SET updated_at = @updated_at, status = @status, admin_feedback = @admin_feedback, reviewed_at = @reviewed_at
    WHERE id = @submission_id
  `).run(
    bindNamedParameters({
      updated_at: now,
      status: nextStatus,
      admin_feedback: nextFeedback,
      reviewed_at: reviewedAt,
      submission_id: submissionId,
    })
  );

  return getSubmissionById(submissionId);
}

function getAcademyOverview() {
  const db = getDatabase();
  const totalStudents =
    db.prepare("SELECT COUNT(*) AS total FROM academy_users WHERE role = 'student'").get().total || 0;
  const totalEnrollments =
    db.prepare("SELECT COUNT(*) AS total FROM academy_enrollments WHERE status = 'active'").get()
      .total || 0;
  const paidPurchases =
    db.prepare("SELECT COUNT(*) AS total FROM academy_purchases WHERE status = 'paid'").get().total || 0;
  const revenueCents =
    db.prepare("SELECT COALESCE(SUM(amount_cents), 0) AS total FROM academy_purchases WHERE status = 'paid'").get()
      .total || 0;
  const pendingSubmissions =
    db
      .prepare(
        "SELECT COUNT(*) AS total FROM academy_submissions WHERE status IN ('submitted', 'pending_review', 'revision_requested')"
      )
      .get().total || 0;

  return {
    total_students: totalStudents,
    total_enrollments: totalEnrollments,
    paid_purchases: paidPurchases,
    revenue_cents: revenueCents,
    pending_submissions: pendingSubmissions,
  };
}

function createCourse(input) {
  const db = getDatabase();
  const now = nowIso();
  const item = {
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    slug: input.slug,
    title: input.title,
    subtitle: input.subtitle || "",
    description: input.description || "",
    level: input.level || "debutant",
    status: input.status || "published",
    price_cents: Number(input.price_cents || 0),
    currency: String(input.currency || "EUR").toUpperCase(),
    order_index: Number(input.order_index || 0),
  };

  db.prepare(`
    INSERT INTO academy_courses (
      id, created_at, updated_at, slug, title, subtitle, description, level, status, price_cents, currency, order_index
    ) VALUES (
      @id, @created_at, @updated_at, @slug, @title, @subtitle, @description, @level, @status, @price_cents, @currency, @order_index
    )
  `).run(bindNamedParameters(item));

  return item;
}

function updateCourse(courseId, updates) {
  const db = getDatabase();
  const current = getCourseById(courseId);

  if (!current) {
    return null;
  }

  const next = {
    ...current,
    ...updates,
    id: current.id,
    created_at: current.created_at,
    updated_at: nowIso(),
  };

  db.prepare(`
    UPDATE academy_courses
    SET
      updated_at = @updated_at,
      slug = @slug,
      title = @title,
      subtitle = @subtitle,
      description = @description,
      level = @level,
      status = @status,
      price_cents = @price_cents,
      currency = @currency,
      order_index = @order_index
    WHERE id = @id
  `).run(bindNamedParameters(next));

  return getCourseById(courseId);
}

function createModule(input) {
  const db = getDatabase();
  const item = {
    id: randomUUID(),
    created_at: nowIso(),
    updated_at: nowIso(),
    course_id: input.course_id,
    title: input.title,
    description: input.description || "",
    order_index: Number(input.order_index || 0),
  };

  db.prepare(`
    INSERT INTO academy_modules (id, created_at, updated_at, course_id, title, description, order_index)
    VALUES (@id, @created_at, @updated_at, @course_id, @title, @description, @order_index)
  `).run(bindNamedParameters(item));

  return item;
}

function updateModule(moduleId, updates) {
  const db = getDatabase();
  const current = getModuleById(moduleId);

  if (!current) {
    return null;
  }

  const next = {
    ...current,
    ...updates,
    id: current.id,
    updated_at: nowIso(),
  };

  db.prepare(`
    UPDATE academy_modules
    SET
      updated_at = @updated_at,
      title = @title,
      description = @description,
      order_index = @order_index
    WHERE id = @id
  `).run(bindNamedParameters(next));

  return getModuleById(moduleId);
}

function createLesson(input) {
  const db = getDatabase();
  const item = {
    id: randomUUID(),
    created_at: nowIso(),
    updated_at: nowIso(),
    course_id: input.course_id,
    module_id: input.module_id,
    title: input.title,
    lesson_type: input.lesson_type || "mixed",
    duration_minutes: Number(input.duration_minutes || 0),
    video_url: input.video_url || "",
    content_markdown: input.content_markdown || "",
    assignment_prompt: input.assignment_prompt || "",
    order_index: Number(input.order_index || 0),
  };

  db.prepare(`
    INSERT INTO academy_lessons (
      id, created_at, updated_at, course_id, module_id, title, lesson_type, duration_minutes,
      video_url, content_markdown, assignment_prompt, order_index
    ) VALUES (
      @id, @created_at, @updated_at, @course_id, @module_id, @title, @lesson_type, @duration_minutes,
      @video_url, @content_markdown, @assignment_prompt, @order_index
    )
  `).run(bindNamedParameters(item));

  return item;
}

function updateLesson(lessonId, updates) {
  const db = getDatabase();
  const current = getLessonById(lessonId);

  if (!current) {
    return null;
  }

  const next = {
    ...current,
    ...updates,
    id: current.id,
    updated_at: nowIso(),
  };

  db.prepare(`
    UPDATE academy_lessons
    SET
      updated_at = @updated_at,
      title = @title,
      lesson_type = @lesson_type,
      duration_minutes = @duration_minutes,
      video_url = @video_url,
      content_markdown = @content_markdown,
      assignment_prompt = @assignment_prompt,
      order_index = @order_index
    WHERE id = @id
  `).run(bindNamedParameters(next));

  return getLessonById(lessonId);
}

function createManualEnrollment(input) {
  const user = getUserByEmail(input.email);

  if (!user) {
    return null;
  }

  return createOrActivateEnrollment({
    user_id: user.id,
    course_id: input.course_id,
    source: "manual",
  });
}

function getPurchaseById(purchaseId) {
  const db = getDatabase();
  return (
    db
      .prepare("SELECT * FROM academy_purchases WHERE id = @purchase_id")
      .get(bindNamedParameters({ purchase_id: purchaseId })) || null
  );
}

module.exports = {
  createCourse,
  createLesson,
  createManualEnrollment,
  createModule,
  createOrActivateEnrollment,
  createOrUpdatePurchase,
  createPasswordResetToken,
  createStudentSession,
  createSubmissionWithAttachments,
  createUser,
  deleteExpiredStudentSessions,
  deleteStudentSessionByToken,
  getAcademyOverview,
  getAttachmentById,
  getCourseById,
  getCourseBySlug,
  getCourseTreeForStudent,
  getEnrollment,
  getLessonById,
  getModuleById,
  getPasswordResetToken,
  getPurchaseById,
  getPurchaseByProviderSessionId,
  getStudentSessionByToken,
  getSubmissionById,
  getUserByEmail,
  getUserById,
  hashToken,
  listCoursesAdmin,
  listLessonsByCourse,
  listModulesByCourse,
  listResourcesByCourse,
  listPublishedCourses,
  listPurchasesAdmin,
  listSubmissionsForAdmin,
  listSubmissionsForUser,
  listUserEnrollments,
  listUsersAdmin,
  markPurchaseFailed,
  markPurchasePaid,
  markUserLastLogin,
  mapUser,
  normalizeEmail,
  consumePasswordResetToken,
  updateCourse,
  updateLesson,
  updateModule,
  updateSubmissionReview,
  updateUserPassword,
  upsertLessonProgress,
};
