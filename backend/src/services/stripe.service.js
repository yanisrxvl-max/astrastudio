const Stripe = require("stripe");

const { config } = require("../config/env");

let stripeClient = null;

function getStripeClient() {
  if (!config.stripe.secretKey) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(config.stripe.secretKey, {
      apiVersion: "2025-03-31.basil",
    });
  }

  return stripeClient;
}

function isStripeConfigured() {
  return Boolean(config.stripe.secretKey);
}

async function createCheckoutSession({ course, user }) {
  const stripe = getStripeClient();

  if (!stripe) {
    throw new Error("Stripe n'est pas configuré.");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${config.site.baseUrl}${config.site.studentCheckoutSuccessRoute}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.site.baseUrl}/formations.html?checkout=cancelled`,
    customer_email: user.email,
    locale: "fr",
    allow_promotion_codes: true,
    metadata: {
      user_id: user.id,
      course_id: course.id,
      course_slug: course.slug,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: String(config.stripe.currency || "eur").toLowerCase(),
          unit_amount: Number(course.price_cents || 0),
          product_data: {
            name: course.title,
            description: course.subtitle || "Formation digitale Astra Studio",
          },
        },
      },
    ],
  });

  return session;
}

async function retrieveCheckoutSession(sessionId) {
  const stripe = getStripeClient();

  if (!stripe) {
    throw new Error("Stripe n'est pas configuré.");
  }

  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
}

function constructWebhookEvent(rawBody, signature) {
  const stripe = getStripeClient();

  if (!stripe) {
    throw new Error("Stripe n'est pas configuré.");
  }

  if (!config.stripe.webhookSecret) {
    throw new Error("Webhook Stripe non configuré.");
  }

  return stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
}

module.exports = {
  constructWebhookEvent,
  createCheckoutSession,
  getStripeClient,
  isStripeConfigured,
  retrieveCheckoutSession,
};
