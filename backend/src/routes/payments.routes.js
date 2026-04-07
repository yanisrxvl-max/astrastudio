const express = require("express");

const { config } = require("../config/env");
const {
  createOrActivateEnrollment,
  createOrUpdatePurchase,
  getPurchaseByProviderSessionId,
  markPurchaseFailed,
  markPurchasePaid,
} = require("../repositories/academy.repository");
const { constructWebhookEvent, isStripeConfigured } = require("../services/stripe.service");

function extractCheckoutSession(event) {
  if (!event?.data?.object) {
    return null;
  }

  return event.data.object;
}

function getPaymentIntentId(session) {
  if (!session) {
    return "";
  }

  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }

  return session.payment_intent?.id || "";
}

function createPaymentsRouter() {
  const router = express.Router();

  router.post("/stripe/webhook", (req, res) => {
    if (!isStripeConfigured()) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    let event;

    try {
      if (config.stripe.webhookSecret) {
        const signature = req.headers["stripe-signature"];
        event = constructWebhookEvent(req.body, signature);
      } else {
        const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body || "{}");
        event = JSON.parse(raw);
      }
    } catch (error) {
      return res.status(400).json({
        ok: false,
        message: "Webhook Stripe invalide.",
      });
    }

    const session = extractCheckoutSession(event);

    if (!session) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const metadata = session.metadata || {};
    const userId = metadata.user_id || "";
    const courseId = metadata.course_id || "";
    const sessionId = session.id || "";

    if (!userId || !courseId || !sessionId) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const purchase =
      getPurchaseByProviderSessionId(sessionId) ||
      createOrUpdatePurchase({
        user_id: userId,
        course_id: courseId,
        provider: "stripe",
        provider_session_id: sessionId,
        provider_payment_intent: getPaymentIntentId(session),
        amount_cents: session.amount_total || 0,
        currency: session.currency || "eur",
        status: session.payment_status === "paid" ? "paid" : "pending",
        metadata: {
          webhook_event: event.type,
        },
      });

    if (
      ["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type) &&
      session.payment_status === "paid"
    ) {
      markPurchasePaid({
        purchase_id: purchase.id,
        provider_payment_intent: getPaymentIntentId(session),
        metadata: {
          webhook_event: event.type,
          payment_status: session.payment_status,
        },
      });

      createOrActivateEnrollment({
        user_id: userId,
        course_id: courseId,
        source: "purchase",
      });
    }

    if (["checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.type)) {
      markPurchaseFailed({
        purchase_id: purchase.id,
        status: "failed",
      });
    }

    return res.status(200).json({
      ok: true,
      received: true,
    });
  });

  return router;
}

module.exports = {
  createPaymentsRouter,
};
