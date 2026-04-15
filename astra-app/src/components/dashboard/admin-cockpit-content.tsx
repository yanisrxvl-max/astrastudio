import Link from "next/link";
import { getCockpitSnapshot } from "@/lib/cockpit/snapshot";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import {
  TrendingUp,
  Wallet,
  Target,
  Users,
  Building2,
  FolderKanban,
  FileText,
  Receipt,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  MapPin,
  BookOpen,
} from "lucide-react";

export async function AdminCockpitContent() {
  const snap = await getCockpitSnapshot();

  const kpiMain = [
    {
      label: "CA encaissé (mois)",
      value: formatCurrency(snap.revenueMonth),
      hint: `Marge opérationnelle : ${formatCurrency(snap.marginMonth)}`,
      icon: Wallet,
      accent: "border-l-astra-gold",
    },
    {
      label: "Objectif mensuel",
      value:
        snap.monthlyGoal > 0 ? formatCurrency(snap.monthlyGoal) : "Non défini",
      hint:
        snap.monthlyGoal > 0
          ? `${snap.goalProgressPct}% atteint · projection fin de mois ${formatCurrency(snap.projectedMonthEnd)}`
          : "Définissez un objectif dans Finance",
      icon: Target,
      accent: "border-l-emerald-500/80",
    },
    {
      label: "Prospects / Clients",
      value: `${snap.leadsNew} / ${snap.clientsActive}`,
      hint: `${snap.leadsTotal} leads au total`,
      icon: Users,
      accent: "border-l-sky-400/80",
    },
    {
      label: "Projets actifs",
      value: String(snap.projectsActive),
      hint:
        snap.projectsBlocked > 0
          ? `${snap.projectsBlocked} bloqué(s)`
          : "Aucun blocage",
      icon: FolderKanban,
      accent: "border-l-violet-400/80",
    },
  ];

  const ops = [
    {
      label: "Devis en attente",
      value: snap.quotesPending,
      href: "/admin/quotes",
      icon: FileText,
    },
    {
      label: "Factures à encaisser",
      value: snap.invoicesUnpaid,
      sub: snap.invoicesUnpaidAmount
        ? formatCurrency(snap.invoicesUnpaidAmount)
        : undefined,
      href: "/admin/invoices",
      icon: Receipt,
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-astra-border bg-astra-card px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-astra-text-secondary">
            <Sparkles className="h-3.5 w-3.5 text-astra-gold" />
            Cockpit
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">
            Pilotage d&apos;activité
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-astra-text-secondary">
            Vue synthétique : trésorerie opérationnelle, pipeline commercial et
            priorités. Données issues du grand livre interne, des devis et des
            factures.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/finance"
            className="inline-flex items-center gap-2 rounded-xl bg-astra-gold px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            <TrendingUp className="h-4 w-4" />
            Finance & objectifs
          </Link>
          <Link
            href="/admin/finance/transactions"
            className="inline-flex items-center gap-2 rounded-xl border border-astra-border px-4 py-2.5 text-sm font-medium text-white hover:bg-white/[0.04]"
          >
            Transactions
          </Link>
        </div>
      </div>

      {!snap.ok && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Certaines données ne sont pas disponibles. Exécutez les scripts SQL{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">
            migration_cockpit.sql
          </code>{" "}
          puis{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">
            rls_cockpit.sql
          </code>{" "}
          sur votre projet Supabase.
        </div>
      )}

      {snap.alerts.length > 0 && (
        <div className="space-y-2">
          {snap.alerts.map((a) => (
            <div
              key={a}
              className="flex items-start gap-3 rounded-xl border border-astra-border bg-astra-card px-4 py-3 text-sm text-astra-text-secondary"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-astra-warning" />
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiMain.map((k) => {
          const Icon = k.icon;
          return (
            <Card
              key={k.label}
              className={`border-l-4 ${k.accent} border border-astra-border bg-astra-card`}
            >
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-astra-text-muted">
                      {k.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                      {k.value}
                    </p>
                    <p className="mt-1 text-xs text-astra-text-secondary">
                      {k.hint}
                    </p>
                  </div>
                  <Icon className="h-5 w-5 shrink-0 text-astra-text-muted opacity-70" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {ops.map((o) => {
          const Icon = o.icon;
          return (
            <Link key={o.label} href={o.href}>
              <Card className="h-full transition-colors hover:border-astra-border-hover hover:bg-astra-card-hover">
                <CardContent className="flex items-center justify-between gap-4 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04]">
                      <Icon className="h-5 w-5 text-astra-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{o.label}</p>
                      <p className="text-2xl font-semibold tabular-nums text-white">
                        {o.value}
                        {o.sub && (
                          <span className="ml-2 text-base font-normal text-astra-text-secondary">
                            ({o.sub})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-astra-text-muted" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-astra-text-muted">
              Modules
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                href: "/admin/leads",
                title: "CRM & leads",
                desc: "Pipeline, chaleur, conversion",
                icon: Users,
              },
              {
                href: "/admin/clients",
                title: "Clients",
                desc: "Fiches, projets, facturation",
                icon: Building2,
              },
              {
                href: "/admin/projects",
                title: "Projets",
                desc: "Statuts, deadlines, livrables",
                icon: FolderKanban,
              },
              {
                href: "/admin/locations",
                title: "Terrain & lieux",
                desc: "Repères et rendez-vous",
                icon: MapPin,
              },
              {
                href: "/admin/documents",
                title: "Documents internes",
                desc: "Liens, tags, ressources",
                icon: FileText,
              },
              {
                href: "/admin/academy",
                title: "Formations",
                desc: "Pilotage programmes (V1)",
                icon: BookOpen,
              },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <Link key={m.href} href={m.href}>
                  <Card className="h-full transition-colors hover:border-astra-gold/30 hover:bg-astra-card-hover">
                    <CardContent className="flex gap-3 py-4">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-astra-gold" />
                      <div>
                        <p className="font-medium text-white">{m.title}</p>
                        <p className="text-xs text-astra-text-secondary">
                          {m.desc}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <span className="text-xs text-astra-gold">Ouvrir</span>
                    </CardFooter>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-astra-text-muted">
              Flux récent
            </h2>
            <Card>
              <CardContent className="divide-y divide-white/[0.06] py-0">
                {snap.recentActivity.length === 0 ? (
                  <p className="py-8 text-center text-sm text-astra-text-muted">
                    Aucune activité récente.
                  </p>
                ) : (
                  snap.recentActivity.map((r) => (
                    <div
                      key={r.at + r.label}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <span className="text-sm text-astra-text">{r.label}</span>
                      <span className="text-xs text-astra-text-muted">
                        {formatRelativeTime(r.at)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-astra-text-muted">
            Priorités
          </h2>
          <Card className="border-astra-border bg-astra-card">
            <CardContent className="space-y-3 pt-5">
              {snap.prioritiesOpen.length === 0 ? (
                <p className="text-sm text-astra-text-muted">
                  Aucune priorité ouverte. Ajoutez-en dans{" "}
                  <Link href="/admin/priorities" className="text-astra-gold">
                    Priorités
                  </Link>
                  .
                </p>
              ) : (
                snap.prioritiesOpen.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-white">{p.title}</p>
                    {p.due_date && (
                      <p className="mt-1 text-xs text-astra-text-muted">
                        Échéance {p.due_date}
                      </p>
                    )}
                  </div>
                ))
              )}
              <Link
                href="/admin/priorities"
                className="inline-flex items-center gap-1 text-xs text-astra-gold"
              >
                Gérer les priorités <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          <div className="mt-6 rounded-xl border border-dashed border-astra-border p-4 text-xs text-astra-text-secondary">
            <p className="font-medium text-astra-text-secondary">
              Assistant pilotage
            </p>
            <p className="mt-2 leading-relaxed">
              Les alertes et projections utilisent vos écritures comptables
              internes et vos objectifs. Complétez les transactions et
              actualisez l&apos;objectif mensuel pour un pilotage fiable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
