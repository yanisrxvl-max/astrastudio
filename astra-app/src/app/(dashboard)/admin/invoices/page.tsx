import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";
import { cockpitDb } from "@/lib/supabase/cockpit-db";
import type { Invoice, InvoiceStatus } from "@/types/cockpit";

const INV_STATUS: Record<
  InvoiceStatus,
  { label: string; variant: "default" | "success" | "warning" | "danger" | "gold" | "muted" }
> = {
  draft: { label: "Brouillon", variant: "muted" },
  sent: { label: "Envoyée", variant: "warning" },
  paid: { label: "Payée", variant: "success" },
  overdue: { label: "En retard", variant: "danger" },
  cancelled: { label: "Annulée", variant: "muted" },
};

export default async function AdminInvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const db = cockpitDb(supabase);
  const { data: invoices } = await db
    .from("invoices")
    .select("*, clients(company_name)")
    .order("created_at", { ascending: false });

  const rows =
    (invoices ?? []) as Array<
      Invoice & { clients: { company_name: string } | null }
    >;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Factures</h1>
          <p className="mt-1 text-sm text-astra-text-secondary">
            Facturation client — numérotation automatique à la création.
          </p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="inline-flex items-center gap-2 rounded-xl bg-astra-gold px-4 py-2.5 text-sm font-semibold text-black"
        >
          <Plus className="h-4 w-4" />
          Nouvelle facture
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-astra-text-muted">
              Aucune facture. Les devis existants restent dans « Devis » ; les
              factures sont des documents de facturation distincts.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.06] text-xs uppercase text-astra-text-muted">
                  <tr>
                    <th className="px-4 py-3">N°</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Montant TTC</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Émission</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((inv) => {
                    const st = INV_STATUS[inv.status];
                    return (
                      <tr
                        key={inv.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/invoices/${inv.id}`}
                            className="font-medium text-astra-gold hover:underline"
                          >
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-astra-text-secondary">
                          {inv.clients?.company_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-white">
                          {formatCurrency(inv.total)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-astra-text-muted">
                          {inv.issued_at
                            ? formatDate(inv.issued_at)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
