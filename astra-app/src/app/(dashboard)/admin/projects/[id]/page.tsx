"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { cockpitDb } from "@/lib/supabase/cockpit-db";
import type { Tables } from "@/types/database";
import type { Project, ProjectPriority, ProjectStatus } from "@/types/cockpit";
import { ArrowLeft } from "lucide-react";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const db = useMemo(() => cockpitDb(supabase), [supabase]);
  const [project, setProject] = useState<Project | null>(null);
  const [clients, setClients] = useState<Tables<"clients">[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      db.from("projects").select("*").eq("id", id).single(),
      supabase.from("clients").select("*").order("company_name"),
    ]);
    setProject(p as Project);
    setClients((c as Tables<"clients">[]) ?? []);
    setLoading(false);
  }, [db, supabase, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    setSaving(true);
    await db
      .from("projects")
      .update({
        name: project.name,
        client_id: project.client_id,
        status: project.status,
        priority: project.priority,
        deadline: project.deadline,
        progress: project.progress,
        notes: project.notes,
      })
      .eq("id", id);
    setSaving(false);
    router.refresh();
  }

  if (loading || !project) {
    return (
      <p className="text-sm text-astra-text-muted">
        {loading ? "Chargement…" : "Projet introuvable."}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-2 text-sm text-astra-text-muted hover:text-astra-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        Projets
      </Link>
      <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
      <p className="text-xs text-astra-text-muted">
        Mis à jour · {formatDate(project.updated_at.slice(0, 10))}
      </p>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={save} className="space-y-4">
            <Input
              label="Nom"
              value={project.name}
              onChange={(e) =>
                setProject({ ...project, name: e.target.value })
              }
            />
            <Select
              label="Client"
              value={project.client_id ?? ""}
              onChange={(e) =>
                setProject({
                  ...project,
                  client_id: e.target.value || null,
                })
              }
            >
              <option value="">— Aucun —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </Select>
            <Select
              label="Statut"
              value={project.status}
              onChange={(e) =>
                setProject({
                  ...project,
                  status: e.target.value as ProjectStatus,
                })
              }
            >
              <option value="planned">Planifié</option>
              <option value="active">En cours</option>
              <option value="blocked">Bloqué</option>
              <option value="done">Terminé</option>
              <option value="cancelled">Annulé</option>
            </Select>
            <Select
              label="Priorité"
              value={project.priority}
              onChange={(e) =>
                setProject({
                  ...project,
                  priority: e.target.value as ProjectPriority,
                })
              }
            >
              <option value="low">Basse</option>
              <option value="medium">Normale</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </Select>
            <Input
              label="Échéance"
              type="date"
              value={project.deadline ?? ""}
              onChange={(e) =>
                setProject({ ...project, deadline: e.target.value || null })
              }
            />
            <div>
              <label className="mb-1.5 block text-xs uppercase text-astra-text-muted">
                Progression ({project.progress}%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={project.progress}
                onChange={(e) =>
                  setProject({
                    ...project,
                    progress: Number(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>
            <Textarea
              label="Notes"
              value={project.notes ?? ""}
              onChange={(e) =>
                setProject({ ...project, notes: e.target.value || null })
              }
            />
            <Button type="submit" loading={saving}>
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
