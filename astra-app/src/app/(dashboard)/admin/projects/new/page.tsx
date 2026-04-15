"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { cockpitDb } from "@/lib/supabase/cockpit-db";
import type { ProjectPriority } from "@/types/cockpit";
import type { Tables } from "@/types/database";

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const db = cockpitDb(supabase);
  const [clients, setClients] = useState<Tables<"clients">[]>([]);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void supabase
      .from("clients")
      .select("*")
      .eq("status", "active")
      .order("company_name")
      .then(({ data }) => setClients((data as Tables<"clients">[]) ?? []));
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const { data, error } = await db
      .from("projects")
      .insert({
        name: name.trim(),
        client_id: clientId || null,
        priority: priority as ProjectPriority,
        deadline: deadline || null,
        notes: notes || null,
        status: "active",
      })
      .select("id")
      .single();
    setSaving(false);
    if (!error && data) router.push(`/admin/projects/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-2 text-sm text-astra-text-muted hover:text-astra-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        Projets
      </Link>
      <h1 className="text-2xl font-semibold text-white">Nouveau projet</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Nom du projet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Select
              label="Client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">— Optionnel —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </Select>
            <Select
              label="Priorité"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Basse</option>
              <option value="medium">Normale</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </Select>
            <Input
              label="Échéance"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <Textarea
              label="Notes internes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button type="submit" loading={saving}>
              Créer
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
