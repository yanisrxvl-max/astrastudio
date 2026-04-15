import { createClient } from "@/lib/supabase/server";
import { cockpitDb } from "@/lib/supabase/cockpit-db";

export type CockpitSnapshot = {
  ok: boolean;
  /** Revenus encaissés (ledger, mois en cours, statut payé) */
  revenueMonth: number;
  /** Dépenses (ledger, mois en cours) */
  expensesMonth: number;
  /** Marge opérationnelle simple sur le mois */
  marginMonth: number;
  /** Objectif mensuel (financial_goals ou default business_settings) */
  monthlyGoal: number;
  /** Progression 0–100 vers l'objectif mensuel */
  goalProgressPct: number;
  /** Projection fin de mois (linéaire sur jours écoulés) */
  projectedMonthEnd: number;
  /** Jours écoulés / jours du mois */
  monthProgressPct: number;
  leadsTotal: number;
  leadsNew: number;
  clientsActive: number;
  projectsActive: number;
  projectsBlocked: number;
  quotesPending: number;
  invoicesUnpaid: number;
  invoicesUnpaidAmount: number;
  paymentsReceivedMonth: number;
  prioritiesOpen: Array<{
    id: string;
    title: string;
    due_date: string | null;
    status: string;
  }>;
  alerts: string[];
  recentActivity: Array<{ label: string; at: string; type: string }>;
};

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysInMonth = end.getDate();
  const dayOfMonth = now.getDate();
  const monthProgressPct = Math.round((dayOfMonth / daysInMonth) * 100);
  return {
    startStr: start.toISOString().slice(0, 10),
    endStr: end.toISOString().slice(0, 10),
    daysInMonth,
    dayOfMonth,
    monthProgressPct,
  };
}

export async function getCockpitSnapshot(): Promise<CockpitSnapshot> {
  const empty: CockpitSnapshot = {
    ok: false,
    revenueMonth: 0,
    expensesMonth: 0,
    marginMonth: 0,
    monthlyGoal: 0,
    goalProgressPct: 0,
    projectedMonthEnd: 0,
    monthProgressPct: 0,
    leadsTotal: 0,
    leadsNew: 0,
    clientsActive: 0,
    projectsActive: 0,
    projectsBlocked: 0,
    quotesPending: 0,
    invoicesUnpaid: 0,
    invoicesUnpaidAmount: 0,
    paymentsReceivedMonth: 0,
    prioritiesOpen: [],
    alerts: [],
    recentActivity: [],
  };

  const supabase = await createClient();
  const db = cockpitDb(supabase);
  const { startStr, endStr, dayOfMonth, daysInMonth, monthProgressPct } =
    monthBounds();

  try {
    const [
      ledgerIncome,
      ledgerExpense,
      goals,
      settings,
      leadsTotal,
      leadsNew,
      clientsActive,
      projectsActive,
      projectsBlocked,
      quotesSent,
      invoicesOpen,
      priorities,
      recentLeads,
    ] = await Promise.all([
      db
        .from("ledger_transactions")
        .select("amount")
        .eq("kind", "income")
        .eq("status", "paid")
        .gte("occurred_on", startStr)
        .lte("occurred_on", endStr),
      db
        .from("ledger_transactions")
        .select("amount")
        .eq("kind", "expense")
        .eq("status", "paid")
        .gte("occurred_on", startStr)
        .lte("occurred_on", endStr),
      db
        .from("financial_goals")
        .select("target_amount")
        .eq("period_type", "month")
        .eq("period_start", startStr)
        .maybeSingle(),
      db
        .from("business_settings")
        .select("default_monthly_goal")
        .eq("id", 1)
        .maybeSingle(),
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "new"),
      supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      db
        .from("projects")
        .select("*", { count: "exact", head: true })
        .in("status", ["planned", "active"]),
      db
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "blocked"),
      supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .in("status", ["sent", "viewed"]),
      db
        .from("invoices")
        .select("total, status")
        .in("status", ["sent", "overdue"]),
      db
        .from("work_priorities")
        .select("id, title, due_date, status")
        .eq("status", "open")
        .order("sort_order", { ascending: true })
        .limit(8),
      supabase
        .from("leads")
        .select("first_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const revenueMonth =
      ledgerIncome.data?.reduce(
        (s: number, r: { amount: unknown }) => s + Number(r.amount),
        0,
      ) ?? 0;
    const expensesMonth =
      ledgerExpense.data?.reduce(
        (s: number, r: { amount: unknown }) => s + Number(r.amount),
        0,
      ) ?? 0;
    const marginMonth = revenueMonth - expensesMonth;

    const monthlyGoal = Number(
      goals.data?.target_amount ?? settings.data?.default_monthly_goal ?? 0,
    );

    const goalProgressPct =
      monthlyGoal > 0
        ? Math.min(100, Math.round((revenueMonth / monthlyGoal) * 100))
        : 0;

    const projectedMonthEnd =
      dayOfMonth > 0 ? Math.round((revenueMonth / dayOfMonth) * daysInMonth) : 0;

    let invoicesUnpaidAmount = 0;
    let invoicesUnpaid = 0;
    if (invoicesOpen.data) {
      for (const inv of invoicesOpen.data) {
        invoicesUnpaidAmount += Number(inv.total);
        invoicesUnpaid += 1;
      }
    }

    const alerts: string[] = [];
    if (monthlyGoal > 0 && goalProgressPct < monthProgressPct - 15) {
      alerts.push(
        "Rythme du mois en dessous de la courbe nécessaire pour atteindre l'objectif.",
      );
    }
    if ((projectsBlocked.count ?? 0) > 0) {
      alerts.push(
        `${projectsBlocked.count} projet(s) en statut bloqué — à débloquer en priorité.`,
      );
    }
    if (invoicesUnpaid > 0) {
      alerts.push(
        `${invoicesUnpaid} facture(s) non soldée(s) — relances ou encaissements à prévoir.`,
      );
    }

    const recentActivity =
      recentLeads.data?.map((l) => ({
        label: `Nouveau lead : ${l.first_name}`,
        at: l.created_at,
        type: "lead",
      })) ?? [];

    return {
      ok: true,
      revenueMonth,
      expensesMonth,
      marginMonth,
      monthlyGoal,
      goalProgressPct,
      projectedMonthEnd,
      monthProgressPct,
      leadsTotal: leadsTotal.count ?? 0,
      leadsNew: leadsNew.count ?? 0,
      clientsActive: clientsActive.count ?? 0,
      projectsActive: projectsActive.count ?? 0,
      projectsBlocked: projectsBlocked.count ?? 0,
      quotesPending: quotesSent.count ?? 0,
      invoicesUnpaid,
      invoicesUnpaidAmount,
      paymentsReceivedMonth: revenueMonth,
      prioritiesOpen: priorities.data ?? [],
      alerts,
      recentActivity,
    };
  } catch {
    return empty;
  }
}
