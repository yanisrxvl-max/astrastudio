function notFoundHandler(req, res, next) {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      ok: false,
      message: "Route introuvable.",
    });
  }

  return next();
}

function errorHandler(error, req, res, next) {
  const status = error.status || 500;

  if (status >= 500) {
    console.error("[Astra Studio] Erreur serveur :", error);
  }

  if (req.path.startsWith("/api/")) {
    return res.status(status).json({
      ok: false,
      message:
        error.message ||
        "Une erreur inattendue est survenue. Merci de réessayer dans un instant.",
      ...(error.details || {}),
    });
  }

  return res.status(status).send(error.message || "Une erreur est survenue.");
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
