const express = require("express");
const path = require("node:path");

const { config } = require("./config/env");
const { createAuthRouter } = require("./routes/auth.routes");
const { createMailerService } = require("./services/mailer.service");
const { applySecurityHeaders } = require("./middleware/security-headers");
const { createPublicRouter } = require("./routes/public.routes");
const { createAdminRouter } = require("./routes/admin.routes");
const { createStaticRouter } = require("./routes/static.routes");
const paymentsRoutes = require("./routes/payments.routes");
const { createStudentRouter } = require("./routes/student.routes");
const { createAdminAcademyRouter } = require("./routes/admin-academy.routes");
const { getSessionFromRequest, requireAdminSession } = require("./middleware/admin-session");
const { requireStudentSession } = require("./middleware/student-session");
const { errorHandler, notFoundHandler } = require("./middleware/error-handler");

function createApp() {
  const app = express();
  const mailer = createMailerService();
  const adminViewPath = path.join(config.rootDir, "backend", "src", "views", "admin.html");
  const adminLoginViewPath = path.join(
    config.rootDir,
    "backend",
    "src",
    "views",
    "admin-login.html"
  );
  const adminAcademyViewPath = path.join(config.rootDir, "backend", "src", "views", "admin-academy.html");
  const studentAuthViewPath = path.join(config.rootDir, "backend", "src", "views", "student-auth.html");
  const studentDashboardViewPath = path.join(
    config.rootDir,
    "backend",
    "src",
    "views",
    "student-dashboard.html"
  );
  const studentCourseViewPath = path.join(config.rootDir, "backend", "src", "views", "student-course.html");
  const studentCheckoutSuccessViewPath = path.join(
    config.rootDir,
    "backend",
    "src",
    "views",
    "student-checkout-success.html"
  );

  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);

  app.use(applySecurityHeaders);
  app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    paymentsRoutes.handleSubscriptionWebhook
  );
  app.post(
    "/api/payments/stripe/webhook",
    express.raw({ type: "application/json" }),
    paymentsRoutes.handleAcademyWebhook
  );
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/payments", paymentsRoutes.router);
  app.use(express.urlencoded({ extended: false }));

  app.use("/api/admin/auth", createAuthRouter());
  app.use("/api", createPublicRouter({ mailer }));
  app.use("/api/astra-signal", require("./routes/astra-signal.routes"));
  app.use("/api/quotes", require("./routes/quotes.routes"));
  app.use("/api/student", createStudentRouter({ mailer }));
  app.use("/api/admin", createAdminRouter({ mailer }));
  app.use("/api/admin/academy", createAdminAcademyRouter());
  app.get("/admin/login", (req, res) => {
    const session = getSessionFromRequest(req);

    if (session) {
      return res.redirect(config.site.adminRoute);
    }

    return res.sendFile(adminLoginViewPath);
  });
  app.get(config.site.adminRoute, requireAdminSession, (req, res) => {
    res.sendFile(adminViewPath);
  });
  app.get(config.site.adminAcademyRoute, requireAdminSession, (req, res) => {
    res.sendFile(adminAcademyViewPath);
  });
  app.get("/admin.html", (req, res) => {
    res.redirect(config.site.adminRoute);
  });
  app.get("/admin/academy.html", (req, res) => {
    res.redirect(config.site.adminAcademyRoute);
  });
  app.get(config.site.studentAuthRoute, (_req, res) => {
    res.sendFile(studentAuthViewPath);
  });
  app.get(`${config.site.studentAuthRoute}.html`, (_req, res) => {
    res.sendFile(studentAuthViewPath);
  });
  app.get(config.site.studentDashboardRoute, requireStudentSession, (req, res) => {
    res.sendFile(studentDashboardViewPath);
  });
  app.get(`${config.site.studentDashboardRoute}.html`, requireStudentSession, (req, res) => {
    res.sendFile(studentDashboardViewPath);
  });
  app.get(config.site.studentCourseRoute, requireStudentSession, (req, res) => {
    res.sendFile(studentCourseViewPath);
  });
  app.get(`${config.site.studentCourseRoute}.html`, requireStudentSession, (req, res) => {
    res.sendFile(studentCourseViewPath);
  });
  app.get(config.site.studentCheckoutSuccessRoute, requireStudentSession, (req, res) => {
    res.sendFile(studentCheckoutSuccessViewPath);
  });
  app.get(`${config.site.studentCheckoutSuccessRoute}.html`, requireStudentSession, (req, res) => {
    res.sendFile(studentCheckoutSuccessViewPath);
  });
  app.use("/", createStaticRouter());

  app.use(notFoundHandler);
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({
        ok: false,
        message: "Route introuvable.",
      });
    }

    return res.status(404).sendFile(path.join(config.rootDir, "404.html"));
  });
  app.use(errorHandler);

  return { app, mailer };
}

module.exports = {
  createApp,
};
