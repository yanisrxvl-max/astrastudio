"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea, Select } from "@/components/ui/input";
import { formatDate, truncate } from "@/lib/utils";
import {
  Search,
  X,
  Eye,
  ArrowRightCircle,
  UserCheck,
  Ban,
  PhoneForwarded,
} from "lucide-react";
import type { Client, Lead, LeadStatusHistory } from "@/types/database";

const STATUS_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "new", label: "Nouveau" },
  { value: "contacted", label: "Contacté" },
  { value: "call_scheduled", label: "Call planifié" },
  { value: "quoted", label: "Devis envoyé" },
  { value: "converted", label: "Converti" },
  { value: "lost", label: "Perdu" },
] as const;

const SOURCE_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "referral", label: "Bouche-à-oreille" },
  { value: "other", label: "Autre" },
] as const;

const STATUS_MAP: Record<
  Lead["status"],
  { label: string; variant: "default" | "success" | "warning" | "danger" | "gold" | "muted" }
> = {
  new: { label: "Nouveau", variant: "gold" },
  contacted: { label: "Contacté", variant: "default" },
  call_scheduled: { label: "Call planifié", variant: "warning" },
  quoted: { label: "Devis envoyé", variant: "warning" },
  converted: { label: "Converti", variant: "success" },
  lost: { label: "Perdu", variant: "danger" },
};

const ALL_STATUSES: Lead["status"][] = [
  "new",
  "contacted",
  "call_scheduled",
  "quoted",
  "converted",
  "lost",
];

function formatSourceLabel(raw: string | null): string {
  if (!raw?.trim()) return "—";
  const s = raw.trim().toLowerCase();
  if (s.includes("instagram")) return "Instagram";
  if (s.includes("tiktok")) return "TikTok";
  if (s.includes("linkedin")) return "LinkedIn";
  if (s.includes("referral") || s.includes("bouche")) return "Bouche-à-oreille";
  if (s === "other" || s.includes("autre")) return "Autre";
  return raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1);
}

function formatOfferLabel(raw: string | null): string {
  if (!raw?.trim()) return "—";
  const o = raw.toLowerCase();
  if (o.includes("audit")) return "Audit";
  if (o.includes("direction")) return "Direction";
  if (o.includes("custom") || o.includes("sur-mesure") || o.includes("sur mesure"))
    return "Custom";
  return raw.trim();
}

function mapOfferToClientType(offer: string | null): Client["offer_type"] {
  const o = (offer || "").toLowerCase();
  if (o.includes("audit")) return "audit";
  if (o.includes("direction")) return "monthly";
  return "custom";
}

function companyNameFromLead(lead: Lead): string {
  const domain = lead.email.split("@")[1];
  const site = domain?.split(".")[0];
  if (site && site.length > 1) {
    const label = site.charAt(0).toUpperCase() + site.slice(1);
    return `${lead.first_name} — ${label}`;
  }
  return `${lead.first_name} — Prospect`;
}

function SlideOver({
  lead,
  onClose,
  onUpdate,
  onStatusChange,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdate: (updated: Lead) => void;
  onStatusChange: (current: Lead, next: Lead["status"]) => Promise<void>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [history, setHistory] = useState<LeadStatusHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const lastSavedNotes = useRef(lead.notes ?? "");

  // Reset local notes only when opening a different lead (avoid clobbering while typing).
  useEffect(() => {
    setNotes(lead.notes ?? "");
    lastSavedNotes.current = lead.notes ?? "";
  }, [lead.id]); // eslint-disable-line react-hooks/exhaustive-deps -- lead.id only

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from("lead_status_history")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        if (!error && data) setHistory(data);
        else setHistory([]);
        setHistoryLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [lead.id, lead.status, supabase]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (notes === lastSavedNotes.current) return;
      void (async () => {
        const { data } = await supabase
          .from("leads")
          .update({ notes })
          .eq("id", lead.id)
          .select()
          .single();
        if (data) {
          lastSavedNotes.current = notes;
          onUpdate(data);
        }
      })();
    }, 650);
    return () => clearTimeout(t);
  }, [notes, lead.id, supabase, onUpdate]);

  async function updateStatus(next: Lead["status"]) {
    await onStatusChange(lead, next);
  }

  async function convertToClient() {
    setConverting(true);
    const { data: newClient, error: insErr } = await supabase
      .from("clients")
      .insert({
        company_name: companyNameFromLead(lead),
        contact_name: lead.first_name,
        email: lead.email,
        phone: lead.phone,
        offer_type: mapOfferToClientType(lead.offer_interest),
        status: "active",
        notes: lead.notes,
      })
      .select()
      .single();

    if (insErr || !newClient) {
      setConverting(false);
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const { error: hErr } = await supabase.from("lead_status_history").insert({
      lead_id: lead.id,
      previous_status: lead.status,
      new_status: "converted",
      created_by: auth.user?.id ?? null,
    });
    if (hErr) console.warn("lead_status_history:", hErr.message);

    const { data: updated } = await supabase
      .from("leads")
      .update({
        status: "converted",
        converted_client_id: newClient.id,
      })
      .eq("id", lead.id)
      .select()
      .single();

    if (updated) onUpdate(updated);
    setConverting(false);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-astra-border bg-astra-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-astra-border px-6 py-4">
          <h2 className="text-lg font-semibold text-astra-text">
            {lead.first_name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-astra-text-muted transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-astra-text-muted">Prénom</p>
                <p className="mt-1 text-sm text-astra-text">{lead.first_name}</p>
              </div>
              <div>
                <p className="text-xs text-astra-text-muted">Email</p>
                <p className="mt-1 text-sm text-astra-text">{lead.email}</p>
              </div>
              <div>
                <p className="text-xs text-astra-text-muted">Téléphone</p>
                <p className="mt-1 text-sm text-astra-text">
                  {lead.phone || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-astra-text-muted">Source</p>
                <p className="mt-1 text-sm text-astra-text">
                  {formatSourceLabel(lead.source)}
                </p>
              </div>
              <div>
                <p className="text-xs text-astra-text-muted">Budget</p>
                <p className="mt-1 text-sm text-astra-text">
                  {lead.budget_range || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-astra-text-muted">Offre</p>
                <p className="mt-1 text-sm text-astra-text">
                  {formatOfferLabel(lead.offer_interest)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-astra-text-muted">
                  Date de réception
                </p>
                <p className="mt-1 text-sm text-astra-text">
                  {formatDate(lead.created_at)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-astra-text-muted">Message</p>
              <p className="mt-1 text-sm leading-relaxed text-astra-text-secondary">
                {lead.message}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-astra-text-muted">
                Statut
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((s) => {
                  const info = STATUS_MAP[s];
                  const isActive = lead.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void updateStatus(s)}
                      disabled={isActive}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-astra-gold/20 text-astra-gold ring-1 ring-astra-gold/30"
                          : "bg-white/5 text-astra-text-secondary hover:bg-white/10 hover:text-white"
                      } disabled:opacity-50`}
                    >
                      {info.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Textarea
                label="Notes (sauvegarde automatique)"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajouter des notes internes…"
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-astra-text-muted">
                Historique des statuts
              </p>
              {historyLoading ? (
                <p className="text-sm text-astra-text-muted">Chargement…</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-astra-text-muted">
                  Aucun changement enregistré (exécutez{" "}
                  <code className="text-xs text-astra-gold">
                    supabase/lead_status_history.sql
                  </code>{" "}
                  si la table est absente).
                </p>
              ) : (
                <ul className="space-y-2 border-l border-astra-border pl-3">
                  {history.map((h) => (
                    <li key={h.id} className="text-sm text-astra-text-secondary">
                      <span className="text-astra-text-muted">
                        {formatDate(h.created_at)}
                      </span>
                      {" · "}
                      {h.previous_status ? (
                        <>
                          <span className="text-astra-text-muted">
                            {STATUS_MAP[h.previous_status as Lead["status"]]
                              ?.label ?? h.previous_status}
                          </span>
                          {" → "}
                        </>
                      ) : null}
                      <span className="text-astra-text">
                        {STATUS_MAP[h.new_status as Lead["status"]]?.label ??
                          h.new_status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-astra-border p-6">
          <div className="flex flex-col gap-2">
            {lead.status === "new" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void updateStatus("contacted")}
              >
                <PhoneForwarded className="h-4 w-4" />
                Marquer comme contacté
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                router.push(`/admin/quotes/new?lead_id=${lead.id}`)
              }
            >
              <ArrowRightCircle className="h-4 w-4" />
              Créer un devis pour ce prospect
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={converting}
              onClick={() => void convertToClient()}
              disabled={lead.status === "converted"}
            >
              <UserCheck className="h-4 w-4" />
              Convertir en client
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => void updateStatus("lost")}
              disabled={lead.status === "lost"}
            >
              <Ban className="h-4 w-4" />
              Marquer comme perdu
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LeadsPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadIdFromUrl = searchParams.get("lead");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (statusFilter) query = query.eq("status", statusFilter);
    if (sourceFilter) query = query.eq("source", sourceFilter);
    if (search.trim()) {
      const q = search.trim();
      query = query.or(`first_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data, count } = await query;
    setLeads(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [statusFilter, sourceFilter, search, supabase]);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  const handleLeadUpdate = useCallback((updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setSelectedLead((sel) => (sel?.id === updated.id ? updated : sel));
  }, []);

  const changeLeadStatus = useCallback(
    async (current: Lead, next: Lead["status"]) => {
      if (current.status === next) return;
      const prev = current.status;
      const { data: auth } = await supabase.auth.getUser();
      const { error: hErr } = await supabase.from("lead_status_history").insert({
        lead_id: current.id,
        previous_status: prev,
        new_status: next,
        created_by: auth.user?.id ?? null,
      });
      if (hErr) console.warn("lead_status_history:", hErr.message);

      const { data, error } = await supabase
        .from("leads")
        .update({ status: next })
        .eq("id", current.id)
        .select()
        .single();
      if (!error && data) handleLeadUpdate(data);
    },
    [supabase, handleLeadUpdate]
  );

  function openLead(lead: Lead) {
    setSelectedLead(lead);
    const p = new URLSearchParams(searchParams.toString());
    p.set("lead", lead.id);
    router.replace(`/admin/leads?${p.toString()}`, { scroll: false });
  }

  function closeLead() {
    setSelectedLead(null);
    const p = new URLSearchParams(searchParams.toString());
    p.delete("lead");
    const qs = p.toString();
    router.replace(qs ? `/admin/leads?${qs}` : "/admin/leads", {
      scroll: false,
    });
  }

  useEffect(() => {
    if (!leadIdFromUrl || loading) return;
    const found = leads.find((l) => l.id === leadIdFromUrl);
    if (found) {
      setSelectedLead((s) => (s?.id === found.id ? s : found));
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadIdFromUrl)
        .single();
      if (data) setSelectedLead(data);
    })();
  }, [leadIdFromUrl, leads, loading, supabase]);

  const columns = [
    { key: "first_name", label: "Prénom", width: "w-[120px]" },
    { key: "email", label: "Email", width: "w-[180px]" },
    { key: "message", label: "Message", width: "flex-1" },
    { key: "source", label: "Source", width: "w-[110px]" },
    { key: "offer_interest", label: "Offre", width: "w-[100px]" },
    { key: "budget_range", label: "Budget", width: "w-[100px]" },
    { key: "status", label: "Statut", width: "w-[120px]" },
    { key: "created_at", label: "Réception", width: "w-[110px]" },
    { key: "actions", label: "Actions", width: "w-[220px]" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-astra-text">Prospects</h1>
        <p className="mt-1 text-sm text-astra-text-secondary">
          {total} prospect{total !== 1 ? "s" : ""} au total — tri par date (plus
          récent en premier)
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Select
            label="Statut"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-44">
          <Select
            label="Source"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[220px] flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-astra-text-muted" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-astra-border bg-astra-bg py-2.5 pl-10 pr-4 text-sm text-astra-text placeholder:text-astra-text-muted transition-colors focus:border-astra-gold focus:outline-none focus:ring-2 focus:ring-astra-gold-soft"
            />
          </div>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <div className="min-w-[1020px]">
            <div className="sticky top-0 z-10 flex items-center border-b border-astra-border bg-astra-card px-5 py-3">
              {columns.map((col) => (
                <div
                  key={col.key}
                  className={`${col.width} shrink-0 px-2 text-xs font-medium uppercase tracking-wider text-astra-text-muted`}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="px-5 py-12 text-center text-sm text-astra-text-muted">
                Chargement…
              </div>
            ) : leads.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-astra-text-muted">
                Aucun prospect trouvé.
              </div>
            ) : (
              leads.map((lead) => {
                const status = STATUS_MAP[lead.status];
                const src = formatSourceLabel(lead.source);
                const off = formatOfferLabel(lead.offer_interest);
                return (
                  <div
                    key={lead.id}
                    className="flex items-center border-b border-astra-border/50 px-5 py-3 transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="w-[120px] shrink-0 px-2 text-sm font-medium text-astra-text">
                      {lead.first_name}
                    </div>
                    <div className="w-[180px] shrink-0 px-2 text-sm text-astra-text-secondary">
                      {truncate(lead.email, 28)}
                    </div>
                    <div className="min-w-0 flex-1 px-2 text-sm text-astra-text-muted">
                      {truncate(lead.message, 60)}
                    </div>
                    <div className="w-[110px] shrink-0 px-2">
                      {src !== "—" ? (
                        <Badge variant="muted">{src}</Badge>
                      ) : (
                        <span className="text-sm text-astra-text-muted">—</span>
                      )}
                    </div>
                    <div className="w-[100px] shrink-0 px-2">
                      {off !== "—" ? (
                        <Badge variant="default">{off}</Badge>
                      ) : (
                        <span className="text-sm text-astra-text-muted">—</span>
                      )}
                    </div>
                    <div className="w-[100px] shrink-0 px-2 text-sm text-astra-text-secondary">
                      {lead.budget_range || "—"}
                    </div>
                    <div className="w-[120px] shrink-0 px-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="w-[110px] shrink-0 px-2 text-xs text-astra-text-muted">
                      {formatDate(lead.created_at)}
                    </div>
                    <div
                      className="flex w-[220px] shrink-0 items-center gap-2 px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openLead(lead)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Voir
                      </Button>
                      <div className="min-w-0 flex-1">
                        <Select
                          aria-label="Changer le statut"
                          value={lead.status}
                          onChange={(e) => {
                            const v = e.target.value as Lead["status"];
                            void changeLeadStatus(lead, v);
                          }}
                          className="h-9 min-h-0 text-xs"
                        >
                          {STATUS_OPTIONS.filter((o) => o.value !== "").map(
                            (o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            )
                          )}
                        </Select>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {selectedLead && (
        <SlideOver
          lead={selectedLead}
          onClose={closeLead}
          onUpdate={handleLeadUpdate}
          onStatusChange={changeLeadStatus}
        />
      )}
    </div>
  );
}
