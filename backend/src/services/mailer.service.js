const nodemailer = require("nodemailer");

const { config } = require("../config/env");
const { escapeHtml } = require("../utils/sanitize");

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function createMailerService() {
  const requiredFields = {
    SMTP_HOST: config.smtp.host,
    SMTP_USER: config.smtp.user,
    SMTP_PASS: config.smtp.pass,
    SMTP_FROM: config.smtp.from,
    LEADS_NOTIFY_EMAIL: config.leadsNotifyEmail,
  };
  const configuredKeys = Object.entries(requiredFields)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key);
  const missingKeys = Object.entries(requiredFields)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  const hasPartialConfiguration =
    configuredKeys.length > 0 && configuredKeys.length < Object.keys(requiredFields).length;
  const isConfigured = missingKeys.length === 0;

  if (!isConfigured) {
    return {
      isConfigured: false,
      hasPartialConfiguration,
      missingKeys,
      async verify() {
        return false;
      },
      async sendTransactionalEmail() {
        return { status: "not_configured" };
      },
      async sendLeadConfirmation() {
        return { status: "not_configured" };
      },
      async sendLeadNotification() {
        return { status: "not_configured" };
      },
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  async function sendLeadNotification(lead) {
    const subjectTarget = lead.company || lead.name;
    const text = [
      "Nouveau lead Astra Studio",
      "",
      `Nom : ${lead.name}`,
      `E-mail : ${lead.email}`,
      `Téléphone : ${lead.phone || "Non renseigné"}`,
      `Entreprise / marque : ${lead.company}`,
      `Site / Instagram : ${lead.website_or_instagram || "Non renseigné"}`,
      `Type de projet : ${lead.project_type}`,
      `Budget : ${lead.budget}`,
      `Timing : ${lead.timeline}`,
      `Source : ${lead.source || "Site Astra Studio"}`,
      `Date : ${formatDate(lead.created_at)}`,
      "",
      "Contexte du projet :",
      lead.message,
      "",
      `Lead ID : ${lead.id}`,
    ].join("\n");

    const html = `
      <div style="font-family: Arial, sans-serif; background:#0b0c10; color:#f5f1e8; padding:32px;">
        <div style="max-width:680px; margin:0 auto; border:1px solid rgba(255,255,255,0.08); border-radius:24px; overflow:hidden; background:#111318;">
          <div style="padding:28px 32px; border-bottom:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0 0 10px; letter-spacing:0.18em; text-transform:uppercase; font-size:12px; color:#c8a76a;">Nouveau lead Astra Studio</p>
            <h1 style="margin:0; font-size:28px; line-height:1.2; font-weight:600;">${escapeHtml(subjectTarget)}</h1>
          </div>
          <div style="padding:28px 32px;">
            <table style="width:100%; border-collapse:collapse;">
              <tbody>
                ${[
                  ["Nom", lead.name],
                  ["E-mail", lead.email],
                  ["Téléphone", lead.phone || "Non renseigné"],
                  ["Entreprise / marque", lead.company],
                  ["Site / Instagram", lead.website_or_instagram || "Non renseigné"],
                  ["Type de projet", lead.project_type],
                  ["Budget", lead.budget],
                  ["Timing", lead.timeline],
                  ["Source", lead.source || "Site Astra Studio"],
                  ["Date", formatDate(lead.created_at)],
                ]
                  .map(
                    ([label, value]) => `
                      <tr>
                        <td style="padding:10px 0; vertical-align:top; color:#a8adb8; width:180px;">${escapeHtml(label)}</td>
                        <td style="padding:10px 0; vertical-align:top;">${escapeHtml(value)}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
            <div style="margin-top:24px; padding-top:24px; border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0 0 10px; letter-spacing:0.14em; text-transform:uppercase; font-size:12px; color:#c8a76a;">Contexte du projet</p>
              <p style="margin:0; line-height:1.7; white-space:pre-line;">${escapeHtml(lead.message)}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: config.smtp.from,
      to: config.leadsNotifyEmail,
      replyTo: lead.email,
      subject: `Nouveau lead Astra Studio — ${subjectTarget}`,
      text,
      html,
    });

    return { status: "sent" };
  }

  async function sendLeadConfirmation(lead) {
    const text = [
      `Bonjour ${lead.name},`,
      "",
      "Votre demande a bien été reçue par Astra Studio.",
      "Le studio revient vers vous sous 48 h ouvrées avec une première lecture du besoin.",
      "",
      "Récapitulatif :",
      `- Marque : ${lead.company}`,
      `- Type de projet : ${lead.project_type}`,
      `- Budget : ${lead.budget}`,
      `- Timing : ${lead.timeline}`,
      "",
      "Merci pour votre confiance,",
      "Astra Studio",
    ].join("\n");

    const html = `
      <div style="font-family: Arial, sans-serif; background:#0b0c10; color:#f5f1e8; padding:32px;">
        <div style="max-width:640px; margin:0 auto; border:1px solid rgba(255,255,255,0.08); border-radius:24px; overflow:hidden; background:#111318;">
          <div style="padding:28px 32px; border-bottom:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0 0 10px; letter-spacing:0.18em; text-transform:uppercase; font-size:12px; color:#c8a76a;">Astra Studio</p>
            <h1 style="margin:0; font-size:26px; line-height:1.2; font-weight:600;">Votre demande a bien été reçue.</h1>
          </div>
          <div style="padding:28px 32px;">
            <p style="margin:0 0 16px; line-height:1.7;">Bonjour ${escapeHtml(lead.name)},</p>
            <p style="margin:0 0 16px; line-height:1.7;">
              Merci pour votre message. Astra Studio revient vers vous sous 48 h ouvrées avec une première lecture claire du projet.
            </p>
            <div style="padding:18px 20px; border-radius:18px; border:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.03);">
              <p style="margin:0 0 12px; letter-spacing:0.14em; text-transform:uppercase; font-size:12px; color:#c8a76a;">Votre demande</p>
              <p style="margin:0 0 8px; line-height:1.6;"><strong>Marque :</strong> ${escapeHtml(lead.company)}</p>
              <p style="margin:0 0 8px; line-height:1.6;"><strong>Type de projet :</strong> ${escapeHtml(lead.project_type)}</p>
              <p style="margin:0 0 8px; line-height:1.6;"><strong>Budget :</strong> ${escapeHtml(lead.budget)}</p>
              <p style="margin:0; line-height:1.6;"><strong>Timing :</strong> ${escapeHtml(lead.timeline)}</p>
            </div>
            <p style="margin:20px 0 0; line-height:1.7;">Merci pour votre confiance,<br />Astra Studio</p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: config.smtp.from,
      to: lead.email,
      replyTo: config.smtp.replyTo || config.leadsNotifyEmail,
      subject: "Astra Studio — votre demande a bien été reçue",
      text,
      html,
    });

    return { status: "sent" };
  }

  async function sendTransactionalEmail(message) {
    await transporter.sendMail({
      from: config.smtp.from,
      ...message,
    });

    return { status: "sent" };
  }

  return {
    isConfigured: true,
    hasPartialConfiguration: false,
    missingKeys: [],
    async verify() {
      await transporter.verify();
      return true;
    },
    sendTransactionalEmail,
    sendLeadConfirmation,
    sendLeadNotification,
  };
}

module.exports = {
  createMailerService,
};
