import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { upsertMonthlyGoal, updateDefaultMonthlyGoal } from "@/lib/actions/finance";
import { getCockpitSnapshot } from "@/lib/cockpit/snapshot";
import { cockpitDb } from "@/lib/supabase/cockpit-db";
import { ArrowLeft } from "lucide-react";

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: { ok?: string; err?: string };
}) {
  const q = searchParams;
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

  const start = new Date();
  start.setDate(1);
  const periodStart = start.toISOString().slice(0, 10);

  const db = cockpitDb(supabase);
  const [{ data: monthGoal }, { data: settings }, snap] = await Promise.all([
    db
      .from("financial_goals")
      .select("*")
      .eq("period_type", "month")
      .eq("period_start", periodStart)
      .maybeSingle(),
    db.from("business_settings").select("*").eq("id", 1).maybeSingle(),
    getCockpitSnapshot(),
  ]);

  const effectiveGoal =
    monthGoal?.target_amount ?? settings?.default_monthly_goal ?? 0;

  const flash =
    q.ok === "month" || q.ok === "default"
      ? {
          type: "success" as const,
          text:
            q.ok === "month"
              ? "Objectif du mois enregistré."
              : "Objectif par défaut mis à jour.",
        }
      : q.err === "invalid"
        ? {
            type: "error" as const,
            text: "Montant invalide. Entrez un nombre positif.",
          }
        : q.err === "save"
          ? {
              type: "error" as const,
              text: "Enregistrement impossible. Réessayez ou vérifiez la base de données.",
            }
          : null;

  return (
    <div className="space-y-8">
      {flash && (
        <div
          className={
            flash.type === "success"
              ? "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
              : "rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          }
          role="status"
        >
          {flash.text}
        </div>
      )}
      <div>
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-2 text-sm text-astra-text-muted hover:text-astra-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Cockpit
        </Link>
        <h1 className="text-2xl font-semibold text-white">Finance & objectifs</h1>
        <p className="mt-1 text-sm text-astra-text-secondary">
          Objectifs mensuels, défaut business et synthèse du mois en cours.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-astra-text-muted">
              Objectif du mois en cours
            </h2>
            <p className="text-3xl font-semibold tabular-nums text-white">
              {formatCurrency(Number(effectiveGoal))}
            </p>
            <p className="text-xs text-astra-text-secondary">
              Spécifique à {periodStart}. Écrase le défaut pour ce mois uniquement.
            </p>
            <form action={upsertMonthlyGoal} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-astra-text-muted">Montant (€)</label>
                <input
                  name="target_amount"
                  type="text"
                  defaultValue={monthGoal?.target_amount ?? ""}
                  placeholder="ex. 15000"
                  className="mt-1 block w-48 rounded-xl border border-astra-border bg-[#0a0a0a] px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-astra-gold px-4 py-2 text-sm font-semibold text-black"
              >
                Enregistrer
              </button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-astra-text-muted">
              Objectif mensuel par défaut
            </h2>
            <p className="text-xs text-astra-text-secondary">
              Utilisé quand aucun objectif n&apos;est défini pour un mois donné.
            </p>
            <form
              action={updateDefaultMonthlyGoal}
              className="flex flex-wrap items-end gap-3"
            >
              <div>
                <label className="text-xs text-astra-text-muted">Montant (€)</label>
                <input
                  name="default_monthly_goal"
                  type="text"
                  defaultValue={settings?.default_monthly_goal ?? ""}
                  placeholder="ex. 12000"
                  className="mt-1 block w-48 rounded-xl border border-astra-border bg-[#0a0a0a] px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl border border-astra-border px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.04]"
              >
                Mettre à jour
              </button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-6 py-6 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-astra-text-muted">CA mois</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {formatCurrency(snap.revenueMonth)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-astra-text-muted">Dépenses</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {formatCurrency(snap.expensesMonth)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-astra-text-muted">Marge</p>
            <p className="mt-1 text-xl font-semibold text-emerald-400">
              {formatCurrency(snap.marginMonth)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Link
          href="/admin/finance/transactions"
          className="text-sm text-astra-gold hover:underline"
        >
          Gérer les transactions →
        </Link>
      </div>
    </div>
  );
}
