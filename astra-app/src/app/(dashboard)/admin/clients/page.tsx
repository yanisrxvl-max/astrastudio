"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  formatEurosFromCents,
  formatDate,
  firstNameFromFullName,
} from "@/lib/utils";
import { Plus, X, ArrowRight, Building2 } from "lucide-react";
import type { Client } from "@/types/database";

const STATUS_MAP: Record<
  Client["status"],
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  active: { label: "Actif", variant: "success" },
  paused: { label: "Pausé", variant: "warning" },
  ended: { label: "Terminé", variant: "danger" },
};

const OFFER_MAP: Record<
  Client["offer_type"],
  { label: string; variant: "gold" | "success" | "default" }
> = {
  audit: { label: "Audit", variant: "gold" },
  monthly: { label: "Mensuel", variant: "success" },
  custom: { label: "Custom", variant: "default" },
};

type ClientWithPacks = Client & { delivered_packs: number };

function NewClientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (client: Client) => void;
}) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    brand_url: "",
    offer_type: "custom" as Client["offer_type"],
    monthly_price: "",
    start_date: "",
    notes: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.company_name.trim() || !form.contact_name.trim() || !form.email.trim()) {
      setError("Nom de l'entreprise, contact et email sont requis.");
      return;
    }

    setSaving(true);
    const { data, error: insertError } = await supabase
      .from("clients")
      .insert({
        company_name: form.company_name.trim(),
        contact_name: form.contact_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        brand_url: form.brand_url.trim() || null,
        offer_type: form.offer_type,
        monthly_price:
          form.offer_type === "monthly" && form.monthly_price
            ? Math.round(parseFloat(form.monthly_price.replace(",", ".")) * 100)
            : null,
        start_date: form.start_date || null,
        notes: form.notes.trim() || null,
      })
      .select()
      .single();

    setSaving(false);

    if (insertError) {
      setError("Erreur lors de la création du client.");
      return;
    }

    if (data) onCreated(data);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-astra-border bg-astra-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-astra-border px-6 py-4">
            <h2 className="text-lg font-semibold text-astra-text">
              Nouveau client
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-astra-text-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Entreprise"
                  value={form.company_name}
                  onChange={(e) => update("company_name", e.target.value)}
                  required
                />
                <Input
                  label="Nom du contact"
                  value={form.contact_name}
                  onChange={(e) => update("contact_name", e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
                <Input
                  label="Téléphone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
              <Input
                label="URL de la marque"
                type="url"
                value={form.brand_url}
                onChange={(e) => update("brand_url", e.target.value)}
                placeholder="https://"
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Type d'offre"
                  value={form.offer_type}
                  onChange={(e) =>
                    update("offer_type", e.target.value)
                  }
                >
                  <option value="audit">Audit</option>
                  <option value="monthly">Mensuel</option>
                  <option value="custom">Custom</option>
                </Select>
                {form.offer_type === "monthly" && (
                  <Input
                    label="Prix mensuel (centimes)"
                    type="number"
                    value={form.monthly_price}
                    onChange={(e) => update("monthly_price", e.target.value)}
                    placeholder="ex: 150000"
                  />
                )}
              </div>
              <Input
                label="Date de début"
                type="date"
                value={form.start_date}
                onChange={(e) => update("start_date", e.target.value)}
              />
              <Textarea
                label="Notes"
                rows={3}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Notes internes..."
              />
            </div>

            {error && (
              <p className="mt-4 text-sm text-astra-danger">{error}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" loading={saving}>
                Créer le client
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function ClientsPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<ClientWithPacks[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [offerFilter, setOfferFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("clients")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (statusFilter) query = query.eq("status", statusFilter);
    if (offerFilter) query = query.eq("offer_type", offerFilter);

    const [{ data, count }, { data: deliveredRows }] = await Promise.all([
      query,
      supabase
        .from("content_packs")
        .select("client_id")
        .not("delivered_at", "is", null),
    ]);

    const delivered = new Map<string, number>();
    deliveredRows?.forEach((r) => {
      delivered.set(
        r.client_id,
        (delivered.get(r.client_id) ?? 0) + 1
      );
    });

    const enriched: ClientWithPacks[] = (data ?? []).map((c) => ({
      ...c,
      delivered_packs: delivered.get(c.id) ?? 0,
    }));

    setClients(enriched);
    setTotal(count ?? 0);
    setLoading(false);
  }, [supabase, statusFilter, offerFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "new") {
      setShowModal(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  function handleCreated(client: Client) {
    const row: ClientWithPacks = { ...client, delivered_packs: 0 };
    setClients((prev) => [row, ...prev]);
    setTotal((prev) => prev + 1);
    setShowModal(false);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-astra-text">Clients</h1>
          <p className="mt-1 text-sm text-astra-text-secondary">
            {total} client{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Select
            label="Statut"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="paused">Pausé</option>
            <option value="ended">Terminé</option>
          </Select>
        </div>
        <div className="w-40">
          <Select
            label="Offre"
            value={offerFilter}
            onChange={(e) => setOfferFilter(e.target.value)}
          >
            <option value="">Toutes</option>
            <option value="audit">Audit</option>
            <option value="monthly">Mensuel</option>
            <option value="custom">Custom</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-astra-text-muted">
          Chargement…
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-astra-text-muted" />
            <p className="text-sm text-astra-text-muted">
              Aucun client trouvé.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => {
            const status = STATUS_MAP[client.status];
            const offer = OFFER_MAP[client.offer_type];
            return (
              <Card key={client.id} hover className="overflow-hidden">
                <CardContent className="pt-6">
                  <p className="text-xl font-bold tracking-tight text-astra-text">
                    {client.company_name}
                  </p>
                  <p className="mt-1.5 text-sm text-astra-text-secondary">
                    {firstNameFromFullName(client.contact_name)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant={offer.variant}>{offer.label}</Badge>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  {client.offer_type === "monthly" && client.monthly_price ? (
                    <p className="mt-4 text-sm font-semibold text-astra-gold">
                      {formatEurosFromCents(client.monthly_price)}
                      <span className="font-normal text-astra-text-muted">
                        {" "}
                        / mois
                      </span>
                    </p>
                  ) : null}
                  {client.start_date ? (
                    <p className="mt-3 text-xs text-astra-text-muted">
                      Début : {formatDate(client.start_date)}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-astra-text-secondary">
                    {client.delivered_packs} pack
                    {client.delivered_packs !== 1 ? "s" : ""} livré
                    {client.delivered_packs !== 1 ? "s" : ""}
                  </p>
                </CardContent>
                <CardFooter className="border-t border-astra-border/60 bg-white/[0.02] py-3">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="inline-flex w-full items-center justify-between text-sm font-medium text-astra-gold transition-colors hover:text-white"
                  >
                    Voir la fiche →
                    <ArrowRight className="h-4 w-4 opacity-70" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <NewClientModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
