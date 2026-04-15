/**
 * Types alignés sur supabase/migration_cockpit.sql
 * (non inclus dans Database pour éviter les conflits d’inférence Supabase JS)
 */

export type LedgerKind = "income" | "expense";
export type LedgerPaymentStatus = "pending" | "paid" | "cancelled";

export type LedgerCategory = {
  id: string;
  name: string;
  kind: LedgerKind;
  parent_id: string | null;
  sort_order: number;
};

export type LedgerTransaction = {
  id: string;
  kind: LedgerKind;
  amount: number;
  category_id: string | null;
  subcategory: string | null;
  status: LedgerPaymentStatus;
  payment_method: string | null;
  occurred_on: string;
  description: string | null;
  notes: string | null;
  attachment_url: string | null;
  client_id: string | null;
  quote_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectStatus =
  | "planned"
  | "active"
  | "blocked"
  | "done"
  | "cancelled";
export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export type Project = {
  id: string;
  client_id: string | null;
  name: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline: string | null;
  progress: number;
  checklist: unknown;
  deliverables: string | null;
  notes: string | null;
  links: unknown;
  created_at: string;
  updated_at: string;
};

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled";

export type Invoice = {
  id: string;
  invoice_number: string;
  client_id: string | null;
  project_id: string | null;
  items: unknown;
  subtotal: number;
  tax_rate: number;
  total: number;
  status: InvoiceStatus;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
};

export type SavedPlace = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  client_id: string | null;
  project_id: string | null;
  notes: string | null;
  created_at: string;
};

export type InternalDocument = {
  id: string;
  title: string;
  category: string | null;
  file_url: string | null;
  storage_path: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
};

export type WorkPriority = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: "open" | "done" | "dismissed";
  sort_order: number;
  created_at: string;
};
