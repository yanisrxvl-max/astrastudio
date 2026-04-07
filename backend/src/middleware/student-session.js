const { config } = require("../config/env");
const { getStudentSessionByToken, mapUser, getUserById } = require("../repositories/academy.repository");
const { parseCookies } = require("../utils/cookies");

const STUDENT_SESSION_COOKIE_NAME = "astra_student_session";

function getStudentSessionFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies[STUDENT_SESSION_COOKIE_NAME];

  if (!token) {
    return null;
  }

  const session = getStudentSessionByToken(token);

  if (!session) {
    return null;
  }

  if (session.user_status !== "active") {
    return null;
  }

  const userRecord = getUserById(session.user_id);
  const mappedUser =
    mapUser(userRecord) ||
    mapUser({
      id: session.user_id,
      full_name: session.full_name,
      email: session.email,
      role: session.role,
      status: session.user_status,
      created_at: session.created_at,
      updated_at: session.created_at,
      last_login_at: "",
    });

  return {
    token,
    session: {
      id: session.id,
      user_id: session.user_id,
      created_at: session.created_at,
      expires_at: session.expires_at,
    },
    user: mappedUser,
  };
}

function applyStudentSession(req, _res, next) {
  const studentSession = getStudentSessionFromRequest(req);
  req.studentSession = studentSession || null;
  next();
}

function requireStudentSession(req, res, next) {
  const studentSession = getStudentSessionFromRequest(req);

  if (!studentSession) {
    if (req.path.startsWith("/api/")) {
      return res.status(401).json({
        ok: false,
        message: "Connexion requise pour accéder à l’espace élève.",
      });
    }

    return res.redirect(config.site.studentAuthRoute);
  }

  req.studentSession = studentSession;
  return next();
}

module.exports = {
  STUDENT_SESSION_COOKIE_NAME,
  applyStudentSession,
  getStudentSessionFromRequest,
  requireStudentSession,
};
