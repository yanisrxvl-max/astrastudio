const express = require("express");

const { asyncHandler } = require("../utils/async-handler");
const { createHttpError } = require("../utils/http-error");
const { sanitizeText } = require("../utils/sanitize");
const { validateLeadPayload } = require("../validation/lead.validation");
const { validateDiagnosticPayload } = require("../validation/diagnostic.validation");
const { applyLeadRateLimit, getClientIp } = require("../middleware/rate-limit");
const { registerLead } = require("../services/lead.service");
const { getSiteBootstrap } = require("../services/content.service");
const { analyzeDiagnosticResponses } = require("../services/diagnostic-ai.service");

function createPublicRouter({ mailer }) {
  const router = express.Router();

  router.get("/health", (req, res) => {
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      service: "astra-studio",
    });
  });

  router.get("/site/bootstrap", (req, res) => {
    res.json({
      ok: true,
      data: getSiteBootstrap(),
    });
  });

  router.post(
    "/leads",
    applyLeadRateLimit,
    asyncHandler(async (req, res) => {
      const honeypot = sanitizeText(req.body.company_website, { max: 200 });

      if (honeypot) {
        return res.status(202).json({
          ok: true,
          message: "Votre demande a bien été prise en compte.",
        });
      }

      const validation = validateLeadPayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Certains champs doivent être complétés ou corrigés.", {
          field_errors: validation.errors,
        });
      }

      const referer = sanitizeText(req.get("referer"), { max: 280 });
      const source = validation.values.source || referer || "Site Astra Studio";

      await registerLead(
        {
          ...validation.values,
          source,
          referer,
          ip: getClientIp(req),
          user_agent: sanitizeText(req.get("user-agent"), { max: 280 }),
        },
        mailer
      );

      res.status(201).json({
        ok: true,
        message:
          "Votre demande a bien été reçue. Astra Studio revient vers vous sous 48 h ouvrées.",
      });
    })
  );

  router.post(
    "/diagnostic/analyze",
    applyLeadRateLimit,
    asyncHandler(async (req, res) => {
      const honeypot = sanitizeText(req.body.company_website, { max: 200 });

      if (honeypot) {
        return res.status(202).json({
          ok: true,
          data: {
            profile_name: "Trajectoire à clarifier",
            profile_summary:
              "Votre diagnostic a été capté. Une lecture stratégique est nécessaire pour hiérarchiser les leviers d'image et de performance.",
            strengths: [
              "Présence digitale active.",
              "Volonté de structuration visible.",
              "Potentiel d'évolution réel.",
            ],
            blockers: [
              "Lecture de marque encore diffuse.",
              "Système éditorial non stabilisé.",
              "Conversion insuffisamment pilotée.",
            ],
            priority:
              "Clarifier le positionnement et installer un plan 90 jours orienté traction utile.",
            recommended_path: "audit_premium",
            cta_title: "Demander un audit premium",
            cta_text:
              "Lancer un cadrage stratégique court avant d'investir sur le déploiement.",
            profile_type: "audit_premium",
            strategic_summary:
              "Votre diagnostic a été capté. Une lecture stratégique est nécessaire pour hiérarchiser les leviers d'image et de performance.",
            recommendation:
              "Lancer un cadrage stratégique court avant d'investir sur le déploiement.",
            cta: {
              label: "Demander un audit premium",
              href: "contact.html?intent=audit-premium",
              secondary_href: "results.html",
            },
            transparency_note:
              "Pré-diagnostic assisté par IA. La recommandation finale est confirmée après revue stratégique Astra Studio.",
            model: "fallback",
          },
        });
      }

      const validation = validateDiagnosticPayload(req.body);

      if (!validation.valid) {
        throw createHttpError(400, "Le format du diagnostic est invalide.", {
          field_errors: validation.errors,
        });
      }

      const referer = sanitizeText(req.get("referer"), { max: 280 });
      const source = validation.values.source || referer || "Diagnostic Astra Signal";
      const analysis = await analyzeDiagnosticResponses({
        responses: validation.values.responses,
        source,
        ip: getClientIp(req),
        userAgent: sanitizeText(req.get("user-agent"), { max: 280 }),
      });

      return res.status(200).json({
        ok: true,
        data: analysis,
        meta: {
          source,
          mode: "analyse_assistee_par_ia",
        },
      });
    })
  );

  return router;
}

module.exports = {
  createPublicRouter,
};
