"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cockpitDb } from "@/lib/supabase/cockpit-db";
import type { WorkPriority } from "@/types/cockpit";
import { ListTodo, CheckCircle2 } from "lucide-react";

export default function AdminPrioritiesPage() {
  const supabase = createClient();
  const db = useMemo(() => cockpitDb(supabase), [supabase]);
  const [rows, setRows] = useState<WorkPriority[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");

  async function load() {
    const { data } = await db
      .from("work_priorities")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setRows((data as WorkPriority[]) ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await db.from("work_priorities").insert({
      title: title.trim(),
      description: description || null,
      due_date: due || null,
      status: "open",
    });
    setTitle("");
    setDescription("");
    setDue("");
    void load();
  }

  async function done(id: string) {
    await db.from("work_priorities").update({ status: "done" }).eq("id", id);
    void load();
  }

  const open = rows.filter((r) => r.status === "open");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Priorités</h1>
        <p className="mt-1 text-sm text-astra-text-secondary">
          Ce qui doit passer en premier cette semaine — alimente le widget du
          cockpit.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-astra-gold" />
            <span className="text-sm font-medium text-white">Ajouter</span>
          </div>
          <form onSubmit={add} className="grid gap-4">
            <Input
              label="Titre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              label="Détail"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label="Échéance"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
            <Button type="submit" className="w-fit">
              Ajouter la priorité
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {open.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="font-medium text-white">{r.title}</p>
                {r.description && (
                  <p className="mt-1 text-sm text-astra-text-secondary">
                    {r.description}
                  </p>
                )}
                {r.due_date && (
                  <p className="mt-1 text-xs text-astra-text-muted">
                    Avant le {r.due_date}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => void done(r.id)}
                className="rounded-lg p-2 text-emerald-400 hover:bg-white/5"
                title="Terminé"
              >
                <CheckCircle2 className="h-5 w-5" />
              </button>
            </CardContent>
          </Card>
        ))}
        {open.length === 0 && (
          <p className="text-sm text-astra-text-muted">Aucune priorité ouverte.</p>
        )}
      </div>
    </div>
  );
}
