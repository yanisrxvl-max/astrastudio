"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import {
  formatEurosFromCents,
  formatDate,
  formatRelativeTime,
  formatFileSize,
} from "@/lib/utils";
import {
  ArrowLeft,
  Plus,
  Download,
  UserPlus,
  KeyRound,
  Save,
  Trash2,
} from "lucide-react";
import type {
  Client,
  Quote,
  ContentPack,
  ClientUpload,
} from "@/types/database";

type Tab = "infos" | "devis" | "contenus" | "fichiers" | "notes";

const TABS: { key: Tab; label: string }[] = [
  { key: "infos", label: "Infos" },
  { key: "devis", label: "Devis" },
  { key: "contenus", label: "Contenus livrés" },
  { key: "fichiers", label: "Fichiers reçus" },
  { key: "notes", label: "Notes & historique" },
];

const QUOTE_STATUS_MAP: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "gold" | "muted" }> = {
  draft: { label: "Brouillon", variant: "muted" },
  sent: { label: "Envoyé", variant: "warning" },
  viewed: { label: "Consulté", variant: "default" },
  accepted: { label: "Accepté", variant: "success" },
  rejected: { label: "Refusé", variant: "danger" },
  expired: { label: "Expiré", variant: "muted" },
};

const PACK_STATUS_MAP: Record<string, { label: string; variant: "default" | "success" | "warning" | "muted" }> = {
  preparing: { label: "En préparation", variant: "warning" },
  delivered: { label: "Livré", variant: "success" },
  downloaded: { label: "Téléchargé", variant: "muted" },
};

const FILE_TYPE_MAP: Record<string, { label: string; variant: "default" | "success" | "warning" | "gold" | "muted" }> = {
  brief: { label: "Brief", variant: "gold" },
  asset: { label: "Asset", variant: "success" },
  photo: { label: "Photo", variant: "default" },
  document: { label: "Document", variant: "warning" },
  other: { label: "Autre", variant: "muted" },
};

function InfosTab({
  client,
  onSave,
}: {
  client: Client;
  onSave: (updated: Client) => void;
}) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [creatingAccess, setCreatingAccess] = useState(false);
  const [resettingPw, setResettingPw] = useState(false);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [form, setForm] = useState({
    company_name: client.company_name,
    contact_name: client.contact_name,
    email: client.email,
    phone: client.phone ?? "",
    brand_url: client.brand_url ?? "",
    offer_type: client.offer_type,
    monthly_price:
      client.monthly_price != null
        ? (client.monthly_price / 100).toFixed(2)
        : "",
    start_date: client.start_date ?? "",
    status: client.status,
    notes: client.notes ?? "",
  });

  useEffect(() => {
    setForm({
      company_name: client.company_name,
      contact_name: client.contact_name,
      email: client.email,
      phone: client.phone ?? "",
      brand_url: client.brand_url ?? "",
      offer_type: client.offer_type,
      monthly_price:
        client.monthly_price != null
          ? (client.monthly_price / 100).toFixed(2)
          : "",
      start_date: client.start_date ?? "",
      status: client.status,
      notes: client.notes ?? "",
    });
  }, [client]);

  useEffect(() => {
    let cancelled = false;
    async function loadAccount() {
      const res = await fetch(`/api/admin/clients/${client.id}/account`);
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as {
        last_sign_in_at?: string | null;
      };
      if (!cancelled) setLastSignIn(data.last_sign_in_at ?? null);
    }
    void loadAccount();
    return () => {
      cancelled = true;
    };
  }, [client.id, client.user_id]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const { data } = await supabase
      .from("clients")
      .update({
        company_name: form.company_name,
        contact_name: form.contact_name,
        email: form.email,
        phone: form.phone || null,
        brand_url: form.brand_url || null,
        offer_type: form.offer_type as Client["offer_type"],
        monthly_price:
          form.offer_type === "monthly" && form.monthly_price
            ? Math.round(
                parseFloat(form.monthly_price.replace(",", ".")) * 100,
              )
            : null,
        start_date: form.start_date || null,
        status: form.status as Client["status"],
        notes: form.notes.trim() || null,
      })
      .eq("id", client.id)
      .select()
      .single();
    setSaving(false);
    if (data) onSave(data);
  }

  async function createClientAccess() {
    setCreatingAccess(true);
    try {
      const res = await fetch("/api/auth/create-client-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: client.id }),
      });
      if (res.ok) {
        const { data: updated } = await supabase
          .from("clients")
          .select("*")
          .eq("id", client.id)
          .single();
        if (updated) onSave(updated);
      }
    } catch {
      // handled silently
    }
    setCreatingAccess(false);
  }

  async function sendPasswordReset() {
    setResettingPw(true);
    try {
      await fetch("/api/auth/client-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: client.id }),
      });
    } catch {
      /* empty */
    }
    setResettingPw(false);
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Marque / Entreprise"
          value={form.company_name}
          onChange={(e) => update("company_name", e.target.value)}
        />
        <Input
          label="Contact (nom complet)"
          value={form.contact_name}
          onChange={(e) => update("contact_name", e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
        <Input
          label="Téléphone"
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
        <Input
          label="URL de la marque"
          value={form.brand_url}
          onChange={(e) => update("brand_url", e.target.value)}
          placeholder="https://"
        />
        <Select
          label="Offre"
          value={form.offer_type}
          onChange={(e) => update("offer_type", e.target.value)}
        >
          <option value="audit">Audit</option>
          <option value="monthly">Mensuel</option>
          <option value="custom">Custom</option>
        </Select>
        {form.offer_type === "monthly" && (
          <Input
            label="Prix mensuel (€ HT)"
            type="number"
            value={form.monthly_price}
            onChange={(e) => update("monthly_price", e.target.value)}
          />
        )}
        <Input
          label="Date de début"
          type="date"
          value={form.start_date}
          onChange={(e) => update("start_date", e.target.value)}
        />
        <Select
          label="Statut"
          value={form.status}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="active">Actif</option>
          <option value="paused">Pausé</option>
          <option value="ended">Terminé</option>
        </Select>
        <div className="sm:col-span-2">
          <Textarea
            label="Notes internes"
            rows={4}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Notes visibles aussi dans l’onglet Notes & historique…"
          />
        </div>
      </div>

      <Button loading={saving} onClick={handleSave}>
        <Save className="h-4 w-4" />
        Sauvegarder
      </Button>

      <div className="border-t border-astra-border pt-6">
        <h3 className="mb-3 text-sm font-semibold text-astra-text">
          Compte client
        </h3>
        {client.user_id ? (
          <div className="space-y-3 rounded-xl border border-astra-border bg-astra-card/40 p-4">
            <p className="text-sm text-astra-text-secondary">
              <span className="text-astra-text-muted">Email du compte :</span>{" "}
              {client.email}
            </p>
            <p className="text-sm text-astra-text-secondary">
              <span className="text-astra-text-muted">
                Dernière connexion :
              </span>{" "}
              {lastSignIn ? formatDate(lastSignIn) : "—"}
            </p>
            <Button
              variant="secondary"
              size="sm"
              loading={resettingPw}
              onClick={sendPasswordReset}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Réinitialiser le mot de passe
            </Button>
            <p className="text-xs text-astra-text-muted">
              Un email avec un lien sécurisé est envoyé au client.
            </p>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            loading={creatingAccess}
            onClick={createClientAccess}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Créer un accès client
          </Button>
        )}
      </div>
    </div>
  );
}

function DevisTab({ clientId }: { clientId: string }) {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("quotes")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      setQuotes(data ?? []);
      setLoading(false);
    }
    void fetch();
  }, [clientId, supabase]);

  if (loading) {
    return <p className="py-8 text-center text-sm text-astra-text-muted">Chargement…</p>;
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link href={`/admin/quotes/new?client_id=${clientId}`}>
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" />
            Créer un devis
          </Button>
        </Link>
      </div>
      {quotes.length === 0 ? (
        <p className="py-8 text-center text-sm text-astra-text-muted">
          Aucun devis pour ce client.
        </p>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => {
            const status = QUOTE_STATUS_MAP[q.status] ?? {
              label: q.status,
              variant: "muted" as const,
            };
            return (
              <Link key={q.id} href={`/admin/quotes/${q.id}`}>
                <Card hover className="transition-colors hover:border-astra-gold/30">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium text-astra-text">
                        {q.quote_number}
                      </p>
                      <p className="mt-0.5 text-xs text-astra-text-muted">
                        {formatDate(q.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-astra-text">
                        {formatEurosFromCents(q.total)}
                      </p>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContenusTab({ clientId }: { clientId: string }) {
  const supabase = createClient();
  const [packs, setPacks] = useState<
    (ContentPack & { file_count: number; total_size: number })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: packsData } = await supabase
        .from("content_packs")
        .select("*")
        .eq("client_id", clientId)
        .not("delivered_at", "is", null)
        .order("delivered_at", { ascending: false });

      if (!packsData || packsData.length === 0) {
        setPacks([]);
        setLoading(false);
        return;
      }

      const packIds = packsData.map((p) => p.id);
      const { data: files } = await supabase
        .from("content_files")
        .select("pack_id, file_size")
        .in("pack_id", packIds);

      const countMap: Record<string, number> = {};
      const sizeMap: Record<string, number> = {};
      files?.forEach((f) => {
        countMap[f.pack_id] = (countMap[f.pack_id] || 0) + 1;
        sizeMap[f.pack_id] = (sizeMap[f.pack_id] || 0) + f.file_size;
      });

      setPacks(
        packsData.map((p) => ({
          ...p,
          file_count: countMap[p.id] || 0,
          total_size: sizeMap[p.id] || 0,
        }))
      );
      setLoading(false);
    }
    void fetch();
  }, [clientId, supabase]);

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-astra-text-muted">
        Chargement…
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Link
          href={`/admin/delivery?client_id=${clientId}&action=new`}
        >
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" />
            Préparer un pack
          </Button>
        </Link>
      </div>
      {packs.length === 0 ? (
        <p className="py-8 text-center text-sm text-astra-text-muted">
          Aucun pack livré pour l’instant.
        </p>
      ) : (
        <div className="space-y-3">
          {packs.map((pack) => {
            const status = PACK_STATUS_MAP[pack.status] ?? {
              label: pack.status,
              variant: "muted" as const,
            };
            return (
              <Link key={pack.id} href={`/admin/delivery/${pack.id}`}>
                <Card
                  hover
                  className="transition-colors hover:border-astra-gold/30"
                >
                  <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-astra-text">
                        {pack.title}
                      </p>
                      <p className="mt-0.5 text-xs text-astra-text-muted">
                        {pack.month} · {pack.file_count} fichier
                        {pack.file_count !== 1 ? "s" : ""}
                        {pack.total_size > 0
                          ? ` · ${formatFileSize(pack.total_size)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {pack.delivered_at ? (
                        <span className="text-xs text-astra-text-muted">
                          Livré le {formatDate(pack.delivered_at)}
                        </span>
                      ) : null}
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FichiersTab({ clientId }: { clientId: string }) {
  const supabase = createClient();
  const [uploads, setUploads] = useState<ClientUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    const { data } = await supabase
      .from("client_uploads")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setUploads(data ?? []);
  }, [supabase, clientId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchList();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchList]);

  async function handleDownload(upload: ClientUpload) {
    const { data } = await supabase.storage
      .from("client-uploads")
      .createSignedUrl(upload.file_url, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function handleDelete(upload: ClientUpload) {
    if (!confirm(`Supprimer « ${upload.file_name} » ?`)) return;
    setDeleting(upload.id);
    const res = await fetch("/api/client-uploads/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: upload.id }),
    });
    setDeleting(null);
    if (res.ok) {
      setUploads((prev) => prev.filter((u) => u.id !== upload.id));
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-astra-text-muted">Chargement…</p>;
  }

  return (
    <div>
      {uploads.length === 0 ? (
        <p className="py-8 text-center text-sm text-astra-text-muted">
          Aucun fichier reçu.
        </p>
      ) : (
        <div className="space-y-3">
          {uploads.map((file) => {
            const ft = FILE_TYPE_MAP[file.file_type] ?? {
              label: file.file_type,
              variant: "muted" as const,
            };
            return (
              <Card key={file.id} hover>
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-astra-text">
                      {file.file_name}
                    </p>
                    {file.notes ? (
                      <p className="mt-1 text-xs text-astra-text-secondary">
                        {file.notes}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={ft.variant}>{ft.label}</Badge>
                      <span className="text-xs text-astra-text-muted">
                        {formatFileSize(file.file_size)}
                      </span>
                      <span className="text-xs text-astra-text-muted">
                        {formatDate(file.created_at)} ·{" "}
                        {formatRelativeTime(file.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDownload(file)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-astra-text-muted hover:text-red-400"
                      onClick={() => void handleDelete(file)}
                      disabled={deleting === file.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

type TimelineEvent = {
  date: string;
  label: string;
  type: "lead" | "client" | "quote" | "pack";
};

const LEAD_STATUS_FR: Record<string, string> = {
  new: "Nouveau prospect",
  contacted: "Prospect contacté",
  call_scheduled: "Call planifié",
  quoted: "Devis envoyé (prospect)",
  converted: "Conversion en client",
  lost: "Prospect perdu",
};

function NotesTab({
  client,
  onSave,
}: {
  client: Client;
  onSave: (c: Client) => void;
}) {
  const supabase = createClient();
  const [notes, setNotes] = useState(client.notes ?? "");
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const lastSaved = useRef(client.notes ?? "");

  useEffect(() => {
    setNotes(client.notes ?? "");
    lastSaved.current = client.notes ?? "";
  }, [client.id, client.notes]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (notes === lastSaved.current) return;
      void (async () => {
        const { data } = await supabase
          .from("clients")
          .update({ notes })
          .eq("id", client.id)
          .select()
          .single();
        if (data) {
          lastSaved.current = notes;
          onSave(data);
        }
      })();
    }, 650);
    return () => clearTimeout(t);
  }, [notes, client.id, supabase, onSave]);

  useEffect(() => {
    async function fetchTimeline() {
      const events: TimelineEvent[] = [];

      const { data: lead } = await supabase
        .from("leads")
        .select("id, first_name, created_at")
        .eq("converted_client_id", client.id)
        .maybeSingle();

      if (lead) {
        events.push({
          date: lead.created_at,
          label: `Lead reçu — ${lead.first_name}`,
          type: "lead",
        });

        const { data: hist, error: histErr } = await supabase
          .from("lead_status_history")
          .select("created_at, new_status")
          .eq("lead_id", lead.id)
          .order("created_at", { ascending: true });

        if (!histErr && hist?.length) {
          hist.forEach((h) => {
            events.push({
              date: h.created_at,
              label: `Prospect : ${LEAD_STATUS_FR[h.new_status] ?? h.new_status}`,
              type: "lead",
            });
          });
        }
      }

      events.push({
        date: client.created_at,
        label: "Client actif — fiche créée",
        type: "client",
      });

      const { data: quotes } = await supabase
        .from("quotes")
        .select("quote_number, created_at, accepted_at")
        .eq("client_id", client.id);

      quotes?.forEach((q) => {
        events.push({
          date: q.created_at,
          label: `Devis ${q.quote_number} créé`,
          type: "quote",
        });
        if (q.accepted_at) {
          events.push({
            date: q.accepted_at,
            label: `Devis ${q.quote_number} accepté`,
            type: "quote",
          });
        }
      });

      const { data: packs } = await supabase
        .from("content_packs")
        .select("title, created_at, delivered_at")
        .eq("client_id", client.id);

      packs?.forEach((p) => {
        if (p.delivered_at) {
          events.push({
            date: p.delivered_at,
            label: `Pack livré : ${p.title}`,
            type: "pack",
          });
        }
      });

      events.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTimeline(events);
    }
    void fetchTimeline();
  }, [client.id, supabase]);

  const dotColor: Record<TimelineEvent["type"], string> = {
    lead: "bg-astra-gold",
    client: "bg-emerald-500",
    quote: "bg-astra-warning",
    pack: "bg-sky-400",
  };

  return (
    <div className="space-y-8">
      <div>
        <Textarea
          label="Notes (sauvegarde automatique)"
          rows={10}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes internes, brief, suivi…"
        />
        <p className="mt-1.5 text-xs text-astra-text-muted">
          Les mêmes notes sont éditables dans l’onglet Infos.
        </p>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold text-astra-text">
          Timeline
        </h3>
        {timeline.length === 0 ? (
          <p className="text-xs text-astra-text-muted">Aucun événement.</p>
        ) : (
          <div className="relative space-y-0 border-l border-astra-border pl-4">
            {timeline.map((event, i) => (
              <div key={i} className="relative pb-6 last:pb-0">
                <span
                  className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${dotColor[event.type]}`}
                />
                <p className="text-sm text-astra-text">{event.label}</p>
                <p className="text-xs text-astra-text-muted">
                  {formatDate(event.date)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("infos");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab === "fichiers" ||
      tab === "infos" ||
      tab === "devis" ||
      tab === "contenus" ||
      tab === "notes"
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      setClient(data);
      setLoading(false);
    }
    fetch();
  }, [clientId]);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-astra-text-muted">
        Chargement…
      </div>
    );
  }

  if (!client) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-astra-text-muted">Client introuvable.</p>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => router.push("/admin/clients")}
        >
          Retour aux clients
        </Button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.push("/admin/clients")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-astra-text-muted transition-colors hover:text-astra-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Clients
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-astra-text">
          {client.company_name}
        </h1>
        <p className="mt-1 text-sm text-astra-text-secondary">
          {client.contact_name} · {client.email}
        </p>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-astra-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              router.replace(
                `/admin/clients/${clientId}?tab=${tab.key}`,
                { scroll: false }
              );
            }}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-astra-gold text-astra-gold"
                : "border-transparent text-astra-text-secondary hover:text-astra-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "infos" && (
          <InfosTab client={client} onSave={setClient} />
        )}
        {activeTab === "devis" && <DevisTab clientId={client.id} />}
        {activeTab === "contenus" && <ContenusTab clientId={client.id} />}
        {activeTab === "fichiers" && <FichiersTab clientId={client.id} />}
        {activeTab === "notes" && (
          <NotesTab client={client} onSave={setClient} />
        )}
      </div>
    </div>
  );
}
