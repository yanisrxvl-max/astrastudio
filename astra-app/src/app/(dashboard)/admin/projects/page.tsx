import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { cockpitDb } from "@/lib/supabase/cockpit-db";
import type { Project } from "@/types/cockpit";
import { Plus, ArrowRight } from "lucide-react";

const STATUS: Record<string, string> = {
  planned: "Planifié",
  active: "En cours",
  blocked: "Bloqué",
  done: "Terminé",
  cancelled: "Annulé",
};

const PRIORITY: Record<string, string> = {
  low: "Basse",
  medium: "Normale",
  high: "Haute",
  urgent: "Urgente",
};

export default async function AdminProjectsPage() {
  const supabase = await createClient();
  const db = cockpitDb(supabase);
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

  const { data: projects } = await db
    .from("projects")
    .select("*, clients(company_name)")
    .order("updated_at", { ascending: false });

  const list = (projects ?? []) as Array<
    Project & { clients: { company_name: string } | null }
  >;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projets</h1>
          <p className="mt-1 text-sm text-astra-text-secondary">
            Suivi des missions : statut, priorité, échéance.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-xl bg-astra-gold px-4 py-2.5 text-sm font-semibold text-black"
        >
          <Plus className="h-4 w-4" />
          Nouveau projet
        </Link>
      </div>

      <div className="space-y-3">
        {list.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-astra-text-muted">
              Aucun projet. Créez-en un pour suivre livrables et deadlines.
            </CardContent>
          </Card>
        ) : (
          list.map((p) => (
            <Link key={p.id} href={`/admin/projects/${p.id}`}>
              <Card className="transition-colors hover:border-astra-gold/30 hover:bg-astra-card-hover">
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{p.name}</span>
                      <Badge variant="default">{STATUS[p.status] ?? p.status}</Badge>
                      <Badge variant="muted">{PRIORITY[p.priority] ?? p.priority}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-astra-text-secondary">
                      {p.clients?.company_name ?? "Sans client"}
                      {p.deadline && (
                        <> · échéance {formatDate(p.deadline)}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-astra-gold"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-astra-text-muted">
                      {p.progress}%
                    </span>
                    <ArrowRight className="h-4 w-4 text-astra-text-muted" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
