require("dotenv").config();

const { academyCurriculum } = require("../src/data/academy-curriculum");
const { initializeDatabase } = require("../src/db/migrations");
const { getDatabase } = require("../src/db/database");
const { bindNamedParameters } = require("../src/utils/sqlite");

function nowIso() {
  return new Date().toISOString();
}

function syncCourse(db, course) {
  const now = nowIso();

  db.prepare(`
    INSERT INTO academy_courses (
      id, created_at, updated_at, slug, title, subtitle, description, level, status, price_cents, currency, order_index
    ) VALUES (
      @id, @created_at, @updated_at, @slug, @title, @subtitle, @description, @level, 'published', @price_cents, @currency, @order_index
    )
    ON CONFLICT(id) DO UPDATE SET
      updated_at = excluded.updated_at,
      slug = excluded.slug,
      title = excluded.title,
      subtitle = excluded.subtitle,
      description = excluded.description,
      level = excluded.level,
      status = 'published',
      price_cents = excluded.price_cents,
      currency = excluded.currency,
      order_index = excluded.order_index
  `).run(
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
      currency: course.currency,
      order_index: course.order_index,
    })
  );

  db.prepare("DELETE FROM academy_resources WHERE course_id = @course_id").run(
    bindNamedParameters({ course_id: course.id })
  );
  db.prepare(
    "DELETE FROM academy_submission_attachments WHERE submission_id IN (SELECT id FROM academy_submissions WHERE course_id = @course_id)"
  ).run(bindNamedParameters({ course_id: course.id }));
  db.prepare("DELETE FROM academy_submissions WHERE course_id = @course_id").run(
    bindNamedParameters({ course_id: course.id })
  );
  db.prepare("DELETE FROM academy_lesson_progress WHERE course_id = @course_id").run(
    bindNamedParameters({ course_id: course.id })
  );
  db.prepare("DELETE FROM academy_lessons WHERE course_id = @course_id").run(
    bindNamedParameters({ course_id: course.id })
  );
  db.prepare("DELETE FROM academy_modules WHERE course_id = @course_id").run(
    bindNamedParameters({ course_id: course.id })
  );

  const insertModule = db.prepare(`
    INSERT INTO academy_modules (id, created_at, updated_at, course_id, title, description, order_index)
    VALUES (@id, @created_at, @updated_at, @course_id, @title, @description, @order_index)
  `);

  const insertLesson = db.prepare(`
    INSERT INTO academy_lessons (
      id, created_at, updated_at, course_id, module_id, title, lesson_type, duration_minutes, video_url, content_markdown, assignment_prompt, order_index
    ) VALUES (
      @id, @created_at, @updated_at, @course_id, @module_id, @title, @lesson_type, @duration_minutes, @video_url, @content_markdown, @assignment_prompt, @order_index
    )
  `);

  const insertResource = db.prepare(`
    INSERT INTO academy_resources (id, created_at, updated_at, course_id, title, resource_type, file_url, description, order_index)
    VALUES (@id, @created_at, @updated_at, @course_id, @title, @resource_type, @file_url, @description, @order_index)
  `);

  course.modules.forEach((module, moduleIndex) => {
    insertModule.run(
      bindNamedParameters({
        id: module.id,
        created_at: now,
        updated_at: now,
        course_id: course.id,
        title: module.title,
        description: module.description,
        order_index: module.order_index || moduleIndex + 1,
      })
    );

    module.lessons.forEach((lesson, lessonIndex) => {
      insertLesson.run(
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

  (course.resources || []).forEach((resource, index) => {
    insertResource.run(
      bindNamedParameters({
        id: `${course.id}-${resource.id || `resource-${index + 1}`}`,
        created_at: now,
        updated_at: now,
        course_id: course.id,
        title: resource.title,
        resource_type: resource.resource_type || "guide",
        file_url: resource.file_url || "",
        description: resource.description || "",
        order_index: index + 1,
      })
    );
  });
}

function main() {
  initializeDatabase();

  const db = getDatabase();
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("BEGIN");

  try {
    academyCurriculum.forEach((course) => {
      syncCourse(db, course);
    });

    db.exec("COMMIT");
    console.info(
      `[Astra Studio] Curriculum academy synchronise : ${academyCurriculum.length} programmes mis a jour.`
    );
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

main();
