import { createBrowserClient } from "@supabase/ssr";

/** Sans générique : les types manuels dans database.ts ne satisfont pas
 * Row extends Record<string, unknown> (exigence postgrest-js v12).
 * Utiliser Tables<> / types exportés pour typer les réponses côté app. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
