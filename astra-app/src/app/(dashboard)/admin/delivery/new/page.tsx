"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea, Select } from "@/components/ui/input";
import type { Client } from "@/types/database";

function defaultMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminDeliveryNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState(defaultMonth);
  const [description, setDescription] = useState("");

  const loadClients = useCallback(async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("status", "active")
      .order("company_name");
    setClients(data ?? []);
    setClientId((prev) => prev || data?.[0]?.id || "");
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  useEffect(() => {
    const cid = searchParams.get("client_id");
    if (cid) setClientId(cid);
  }, [searchParams]);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !title.trim()) return;
    setSaving(true);

    const { data: pack, error } = await supabase
      .from("content_packs")
      .insert({
        client_id: clientId,
        title: title.trim(),
        month,
        description: description.trim() || null,
        status: "preparing",
      })
      .select()
      .single();

    setSaving(false);
    if (!error && pack) {
      router.push(`/admin/delivery/${pack.id}`);
    }
  }

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl bg-astra-card" />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/admin/delivery">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Livraisons
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-astra-text">
          Nouveau pack de contenu
        </h1>
        <p className="mt-1 text-sm text-astra-text-secondary">
          Étape 1 — Infos du pack, puis vous pourrez uploader les fichiers.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleContinue} className="space-y-5">
          <Select
            label="Client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
          >
            <option value="">Choisir un client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name} — {c.contact_name}
              </option>
            ))}
          </Select>

          <Input
            label="Titre du pack"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Pack Février 2027 — Direction créative"
            required
          />

          <Input
            label="Mois (année-mois)"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
          />

          <Textarea
            label="Description (optionnel)"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes, périmètre, livrables…"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/admin/delivery">
              <Button type="button" variant="ghost">
                Annuler
              </Button>
            </Link>
            <Button type="submit" loading={saving}>
              Continuer vers l’upload
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
