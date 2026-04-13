const express = require("express");

const { config } = require("../config/env");
const {
  createOrActivateEnrollment,
  createOrUpdatePurchase,
  getPurchaseByProviderSessionId,
  markPurchaseFailed,
  markPurchasePaid,
} = require("../repositories/academy.repository");
const {
  constructWebhookEvent,
  getStripeClient,
  isStripeConfigured,
} = require("../services/stripe.service");

// Mapping des offres vers les Price IDs Stripe (remplacer par vos vrais price_… dans Stripe)
const OFFERS_PRICES = {
  SPARK: "price_ID_SPARK_ICI",
  SIGNATURE: "price_ID_SIGNATURE_ICI",
  SCALE: "price_ID_SCALE_ICI",
};

const router = express.Router();

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

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { offerType, clientEmail, clientName } = req.body;
    const code = String(offerType || "").toUpperCase();

    if (!code || !OFFERS_PRICES[code]) {
      return res.status(400).json({ error: "Offre invalide" });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(503).json({ error: "Stripe n'est pas configuré." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: OFFERS_PRICES[code],
          quantity: 1,
        },
      ],
      success_url: `${config.site.baseUrl}${config.site.studentCheckoutSuccessRoute}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.site.baseUrl}/contact`,
      customer_email: clientEmail,
      metadata: {
        offerType: code,
        clientName: clientName || "",
      },
      subscription_data: {
        metadata: {
          offerType: code,
          clientName: clientName || "",
        },
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: "Erreur création session paiement" });
  }
});

async function handleSubscriptionWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ""));
    event = constructWebhookEvent(rawBody, sig);
  } catch (err) {
    console.log("Webhook signature verification failed.");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { offerType, clientName } = session.metadata || {};
    const email = session.customer_details?.email || session.customer_email;

    console.log(
      `[Stripe] Paiement validé pour ${email} (${clientName || "—"}) sur l'offre ${offerType || "?"}`
    );

    // TODO: Insérer ou mettre à jour le client dans la table 'clients'
  }

  res.json({ received: true });
}

function handleAcademyWebhook(req, res) {
  if (!isStripeConfigured()) {
    return res.status(200).json({ ok: true, ignored: true });
  }

  let event;

  try {
    if (config.stripe.webhookSecret) {
      const signature = req.headers["stripe-signature"];
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ""));
      event = constructWebhookEvent(rawBody, signature);
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
}

module.exports = {
  router,
  handleSubscriptionWebhook,
  handleAcademyWebhook,
};
