import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Tables cockpit (migration_cockpit.sql) non déclarées dans Database.
 * Utiliser pour ledger_*, projects, invoices, work_priorities, saved_places,
 * internal_documents, financial_goals, business_settings.
 */
export function cockpitDb(client: SupabaseClient) {
  return client as SupabaseClient;
}
