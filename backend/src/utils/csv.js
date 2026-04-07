function escapeCsv(value) {
  const text = String(value ?? "");
  const escaped = text.replaceAll('"', '""');
  return `"${escaped}"`;
}

function buildCsv(leads) {
  const headers = [
    "id",
    "created_at",
    "updated_at",
    "status",
    "name",
    "email",
    "phone",
    "company",
    "website_or_instagram",
    "project_type",
    "budget",
    "estimated_budget_amount",
    "timeline",
    "source",
    "quote_sent_at",
    "last_contact_at",
    "follow_up_status",
    "next_follow_up_at",
    "message",
    "internal_notes",
    "notification_status",
    "confirmation_status",
  ];

  const rows = leads.map((lead) =>
    headers.map((header) => escapeCsv(lead[header])).join(",")
  );

  return `\uFEFF${headers.join(",")}\n${rows.join("\n")}`;
}

module.exports = {
  buildCsv,
};
