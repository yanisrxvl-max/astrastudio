const fs = require("node:fs");

const { config } = require("../config/env");
const { academyCurriculum } = require("../data/academy-curriculum");
const { bindNamedParameters } = require("../utils/sqlite");
const { getDatabase } = require("./database");

function createTables() {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL,
      website_or_instagram TEXT NOT NULL DEFAULT '',
      project_type TEXT NOT NULL,
      budget TEXT NOT NULL,
      timeline TEXT NOT NULL,
      message TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT '',
      referer TEXT NOT NULL DEFAULT '',
      ip TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      estimated_budget_amount INTEGER NOT NULL DEFAULT 0,
      quote_sent_at TEXT NOT NULL DEFAULT '',
      last_contact_at TEXT NOT NULL DEFAULT '',
      follow_up_status TEXT NOT NULL DEFAULT 'none',
      next_follow_up_at TEXT NOT NULL DEFAULT '',
      internal_notes TEXT NOT NULL DEFAULT '',
      notification_status TEXT NOT NULL DEFAULT 'pending',
      confirmation_status TEXT NOT NULL DEFAULT 'pending',
      notification_error TEXT NOT NULL DEFAULT '',
      confirmation_error TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      client_id TEXT NOT NULL DEFAULT '',
      client_email TEXT NOT NULL,
      stripe_subscription_id TEXT NOT NULL UNIQUE,
      offer_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      current_period_end TEXT NOT NULL DEFAULT '',
      cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
      last_payment_at TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(client_email);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

    CREATE TABLE IF NOT EXISTS content_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_key TEXT NOT NULL UNIQUE,
      module_type TEXT NOT NULL,
      title TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_content_modules_type ON content_modules(module_type);

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      lead_id TEXT NOT NULL DEFAULT '',
      contact_name TEXT NOT NULL,
      company TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      website TEXT NOT NULL DEFAULT '',
      instagram TEXT NOT NULL DEFAULT '',
      client_type TEXT NOT NULL DEFAULT 'brand',
      status TEXT NOT NULL DEFAULT 'active',
      estimated_value INTEGER NOT NULL DEFAULT 0,
      useful_links TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      collaboration_history TEXT NOT NULL DEFAULT '',
      last_contact_at TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company);
    CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      mission_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      priority TEXT NOT NULL DEFAULT 'normal',
      start_date TEXT NOT NULL DEFAULT '',
      deadline TEXT NOT NULL DEFAULT '',
      budget INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      deliverables TEXT NOT NULL DEFAULT '',
      useful_links TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline);

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      client_id TEXT NOT NULL DEFAULT '',
      project_id TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      document_type TEXT NOT NULL DEFAULT 'file',
      file_url TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      issued_at TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
    CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
    CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

    CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      client_id TEXT NOT NULL DEFAULT '',
      project_id TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      media_type TEXT NOT NULL,
      preview_url TEXT NOT NULL DEFAULT '',
      asset_url TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      captured_at TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_media_client ON media_items(client_id);
    CREATE INDEX IF NOT EXISTS idx_media_project ON media_items(project_id);
    CREATE INDEX IF NOT EXISTS idx_media_type ON media_items(media_type);

    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      usage_notes TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

    CREATE TABLE IF NOT EXISTS academy_users (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      status TEXT NOT NULL DEFAULT 'active',
      last_login_at TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_academy_users_email ON academy_users(email);

    CREATE TABLE IF NOT EXISTS academy_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      ip TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_academy_sessions_user_id ON academy_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_academy_sessions_expires_at ON academy_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS academy_password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_academy_password_resets_user_id ON academy_password_resets(user_id);
    CREATE INDEX IF NOT EXISTS idx_academy_password_resets_expires_at ON academy_password_resets(expires_at);

    CREATE TABLE IF NOT EXISTS academy_courses (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      level TEXT NOT NULL DEFAULT 'beginner',
      status TEXT NOT NULL DEFAULT 'published',
      price_cents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'EUR',
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_academy_courses_slug ON academy_courses(slug);
    CREATE INDEX IF NOT EXISTS idx_academy_courses_order ON academy_courses(order_index);

    CREATE TABLE IF NOT EXISTS academy_modules (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (course_id) REFERENCES academy_courses(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_academy_modules_course ON academy_modules(course_id);
    CREATE INDEX IF NOT EXISTS idx_academy_modules_order ON academy_modules(order_index);

    CREATE TABLE IF NOT EXISTS academy_lessons (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      course_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      title TEXT NOT NULL,
      lesson_type TEXT NOT NULL DEFAULT 'mixed',
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      video_url TEXT NOT NULL DEFAULT '',
      content_markdown TEXT NOT NULL DEFAULT '',
      assignment_prompt TEXT NOT NULL DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (course_id) REFERENCES academy_courses(id) ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES academy_modules(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_academy_lessons_module ON academy_lessons(module_id);
    CREATE INDEX IF NOT EXISTS idx_academy_lessons_course ON academy_lessons(course_id);
    CREATE INDEX IF NOT EXISTS idx_academy_lessons_order ON academy_lessons(order_index);

    CREATE TABLE IF NOT EXISTS academy_resources (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      resource_type TEXT NOT NULL DEFAULT 'pdf',
      file_url TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (course_id) REFERENCES academy_courses(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_academy_resources_course ON academy_resources(course_id);

    CREATE TABLE IF NOT EXISTS academy_enrollments (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'purchase',
      status TEXT NOT NULL DEFAULT 'active',
      started_at TEXT NOT NULL DEFAULT '',
      completed_at TEXT NOT NULL DEFAULT '',
      UNIQUE(user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES academy_courses(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_academy_enrollments_user ON academy_enrollments(user_id);
    CREATE INDEX IF NOT EXISTS idx_academy_enrollments_course ON academy_enrollments(course_id);

    CREATE TABLE IF NOT EXISTS academy_purchases (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'stripe',
      provider_session_id TEXT NOT NULL DEFAULT '',
      provider_payment_intent TEXT NOT NULL DEFAULT '',
      amount_cents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'EUR',
      status TEXT NOT NULL DEFAULT 'pending',
      paid_at TEXT NOT NULL DEFAULT '',
      metadata_json TEXT NOT NULL DEFAULT '{}',
      UNIQUE(provider, provider_session_id),
      FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES academy_courses(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_academy_purchases_user ON academy_purchases(user_id);
    CREATE INDEX IF NOT EXISTS idx_academy_purchases_status ON academy_purchases(status);
    CREATE INDEX IF NOT EXISTS idx_academy_purchases_course ON academy_purchases(course_id);

    CREATE TABLE IF NOT EXISTS academy_lesson_progress (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not_started',
      progress_percent INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL DEFAULT '',
      completed_at TEXT NOT NULL DEFAULT '',
      last_position_seconds INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, lesson_id),
      FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES academy_courses(id) ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES academy_modules(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES academy_lessons(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_academy_lesson_progress_user ON academy_lesson_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_academy_lesson_progress_course ON academy_lesson_progress(course_id);

    CREATE TABLE IF NOT EXISTS academy_submissions (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      text_response TEXT NOT NULL DEFAULT '',
      admin_feedback TEXT NOT NULL DEFAULT '',
      reviewed_at TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES academy_courses(id) ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES academy_modules(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES academy_lessons(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_academy_submissions_user ON academy_submissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_academy_submissions_status ON academy_submissions(status);
    CREATE INDEX IF NOT EXISTS idx_academy_submissions_lesson ON academy_submissions(lesson_id);

    CREATE TABLE IF NOT EXISTS academy_submission_attachments (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT '',
      size_bytes INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (submission_id) REFERENCES academy_submissions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_academy_attachments_submission ON academy_submission_attachments(submission_id);
  `);
}

function migrateSubscriptionsIfNeeded() {
  const db = getDatabase();
  const table = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='subscriptions'")
    .get();
  if (!table) {
    return;
  }
  const cols = db.prepare("PRAGMA table_info(subscriptions)").all();
  if (cols.some((c) => c.name === "offer_type")) {
    return;
  }
  db.exec(`
    DROP TABLE IF EXISTS subscriptions;
    CREATE TABLE subscriptions (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      client_id TEXT NOT NULL DEFAULT '',
      client_email TEXT NOT NULL,
      stripe_subscription_id TEXT NOT NULL UNIQUE,
      offer_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      current_period_end TEXT NOT NULL DEFAULT '',
      cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
      last_payment_at TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(client_email);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
  `);
}

function ensureTableColumns(tableName, columns) {
  const db = getDatabase();
  const existingColumns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all()
    .map((row) => row.name);

  columns.forEach(({ name, definition }) => {
    if (!existingColumns.includes(name)) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${definition}`);
    }
  });
}

function ensureLeadSchema() {
  ensureTableColumns("leads", [
    { name: "estimated_budget_amount", definition: "INTEGER NOT NULL DEFAULT 0" },
    { name: "quote_sent_at", definition: "TEXT NOT NULL DEFAULT ''" },
    { name: "last_contact_at", definition: "TEXT NOT NULL DEFAULT ''" },
    { name: "follow_up_status", definition: "TEXT NOT NULL DEFAULT 'none'" },
    { name: "next_follow_up_at", definition: "TEXT NOT NULL DEFAULT ''" },
  ]);

  const db = getDatabase();
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_leads_follow_up_status ON leads(follow_up_status);
    CREATE INDEX IF NOT EXISTS idx_leads_quote_sent_at ON leads(quote_sent_at DESC);
  `);
}

function seedSettings() {
  const db = getDatabase();
  const now = new Date().toISOString();
  const seedStatement = db.prepare(`
    INSERT INTO app_settings (setting_key, setting_value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(setting_key) DO NOTHING
  `);

  seedStatement.run("contact_email", config.leadsNotifyEmail || "bonjour@studioastraparis.fr", now);
  seedStatement.run("response_delay", "48 h ouvrées", now);
  seedStatement.run("site_name", "Astra Studio", now);
}

function seedContentModules() {
  const db = getDatabase();
  const now = new Date().toISOString();
  const modules = [
    {
      key: "results.performance.highlights",
      type: "performance",
      title: "Modules de performance",
      payload: {
        owner: "results.html",
        purpose: "Préparer une future administration des chiffres et graphiques de performance.",
        entries: [
          "Vue annuelle TikTok",
          "Fenêtres 60 jours et 28 jours",
          "Distribution organique X",
        ],
      },
    },
    {
      key: "work.case-studies",
      type: "portfolio",
      title: "Dossiers créatifs",
      payload: {
        owner: "work.html",
        purpose: "Préparer une évolution vers des case studies administrables sans refonte du front.",
        entries: ["Glowy Glow", "Qaymar Glow", "SnackMe"],
      },
    },
    {
      key: "contact.pipeline",
      type: "operations",
      title: "Pipeline contact",
      payload: {
        owner: "contact.html",
        purpose: "Gérer les demandes de contact, leurs statuts, les exports et les notes internes.",
        statuses: ["new", "contacted", "quote_sent", "won", "lost"],
      },
    },
  ];

  const statement = db.prepare(`
    INSERT INTO content_modules (module_key, module_type, title, payload_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(module_key) DO NOTHING
  `);

  modules.forEach((module) => {
    statement.run(
      module.key,
      module.type,
      module.title,
      JSON.stringify(module.payload),
      now,
      now
    );
  });
}

function seedAcademyContent() {
  const db = getDatabase();
  const existingCourses = db.prepare("SELECT COUNT(*) AS total FROM academy_courses").get().total || 0;
  const existingModules = db.prepare("SELECT COUNT(*) AS total FROM academy_modules").get().total || 0;
  const existingLessons = db.prepare("SELECT COUNT(*) AS total FROM academy_lessons").get().total || 0;

  if (existingCourses > 0 || existingModules > 0 || existingLessons > 0) {
    return;
  }

  const now = new Date().toISOString();
  const courseStatement = db.prepare(`
    INSERT INTO academy_courses (
      id, created_at, updated_at, slug, title, subtitle, description, level, status, price_cents, currency, order_index
    ) VALUES (@id, @created_at, @updated_at, @slug, @title, @subtitle, @description, @level, 'published', @price_cents, @currency, @order_index)
    ON CONFLICT(id) DO NOTHING
  `);

  const moduleStatement = db.prepare(`
    INSERT INTO academy_modules (
      id, created_at, updated_at, course_id, title, description, order_index
    ) VALUES (@id, @created_at, @updated_at, @course_id, @title, @description, @order_index)
    ON CONFLICT(id) DO NOTHING
  `);

  const lessonStatement = db.prepare(`
    INSERT INTO academy_lessons (
      id, created_at, updated_at, course_id, module_id, title, lesson_type, duration_minutes, video_url, content_markdown, assignment_prompt, order_index
    ) VALUES (@id, @created_at, @updated_at, @course_id, @module_id, @title, @lesson_type, @duration_minutes, @video_url, @content_markdown, @assignment_prompt, @order_index)
    ON CONFLICT(id) DO NOTHING
  `);

  const resourceStatement = db.prepare(`
    INSERT INTO academy_resources (
      id, created_at, updated_at, course_id, title, resource_type, file_url, description, order_index
    ) VALUES (@id, @created_at, @updated_at, @course_id, @title, @resource_type, @file_url, @description, @order_index)
    ON CONFLICT(id) DO NOTHING
  `);

  academyCurriculum.forEach((course) => {
    courseStatement.run(
      bindNamedParameters({
        id: course.id,
        created_at: now,
        updated_at: now,
        slug: course.slug,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        level: course.level,
        price_cents: course.price_cents,
        currency: course.currency || "EUR",
        order_index: course.order_index,
      })
    );

    (course.modules || []).forEach((module, moduleIndex) => {
      moduleStatement.run(
        bindNamedParameters({
          id: module.id,
          created_at: now,
          updated_at: now,
          course_id: course.id,
          title: module.title,
          description: module.description || "",
          order_index: module.order_index || moduleIndex + 1,
        })
      );

      (module.lessons || []).forEach((lesson, lessonIndex) => {
        lessonStatement.run(
          bindNamedParameters({
            id: lesson.id,
            created_at: now,
            updated_at: now,
            course_id: course.id,
            module_id: module.id,
            title: lesson.title,
            lesson_type: lesson.lesson_type || "mixed",
            duration_minutes: lesson.duration_minutes || 0,
            video_url: lesson.video_url || "",
            content_markdown: lesson.content_markdown || "",
            assignment_prompt: lesson.assignment_prompt || "",
            order_index: lesson.order_index || lessonIndex + 1,
          })
        );
      });
    });

    (course.resources || []).forEach((resource, resourceIndex) => {
      resourceStatement.run(
        bindNamedParameters({
          id: `${course.id}-${resource.id || `resource-${resourceIndex + 1}`}`,
          created_at: now,
          updated_at: now,
          course_id: course.id,
          title: resource.title,
          resource_type: resource.resource_type || "guide",
          file_url: resource.file_url || "",
          description: resource.description || "",
          order_index: resourceIndex + 1,
        })
      );
    });
  });
}

function migrateLegacyLeadsIfNeeded() {
  const db = getDatabase();
  const totalLeads = db.prepare("SELECT COUNT(*) AS count FROM leads").get().count;

  if (totalLeads > 0 || !fs.existsSync(config.legacyLeadsFile)) {
    return;
  }

  const raw = fs.readFileSync(config.legacyLeadsFile, "utf8").trim();

  if (!raw) {
    return;
  }

  const parsed = JSON.parse(raw);
  const leads = Array.isArray(parsed.leads) ? parsed.leads : [];

  if (!leads.length) {
    return;
  }

  const insertLead = db.prepare(`
    INSERT OR IGNORE INTO leads (
      id, created_at, updated_at, status, name, email, phone, company,
      website_or_instagram, project_type, budget, timeline, message,
      source, referer, ip, user_agent, internal_notes,
      notification_status, confirmation_status, notification_error, confirmation_error
    ) VALUES (
      @id, @created_at, @updated_at, @status, @name, @email, @phone, @company,
      @website_or_instagram, @project_type, @budget, @timeline, @message,
      @source, @referer, @ip, @user_agent, @internal_notes,
      @notification_status, @confirmation_status, @notification_error, @confirmation_error
    )
  `);

  db.exec("BEGIN");

  try {
    leads.forEach((lead) => {
      insertLead.run(bindNamedParameters({
        id: lead.id,
        created_at: lead.created_at,
        updated_at: lead.updated_at || lead.created_at,
        status: lead.status || "new",
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        company: lead.company || "",
        website_or_instagram: lead.website_or_instagram || "",
        project_type: lead.project_type || "",
        budget: lead.budget || "",
        timeline: lead.timeline || "",
        message: lead.message || "",
        source: lead.source || "",
        referer: lead.referer || "",
        ip: lead.ip || "",
        user_agent: lead.user_agent || "",
        internal_notes: lead.internal_notes || "",
        notification_status: lead.notification_status || "pending",
        confirmation_status: lead.confirmation_status || "pending",
        notification_error: lead.notification_error || "",
        confirmation_error: lead.confirmation_error || "",
      }));
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function initializeDatabase() {
  createTables();
  migrateSubscriptionsIfNeeded();
  ensureLeadSchema();
  seedSettings();
  seedContentModules();
  seedAcademyContent();
  migrateLegacyLeadsIfNeeded();
}

module.exports = {
  initializeDatabase,
};
