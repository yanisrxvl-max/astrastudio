"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Eye, Copy, Trash2, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import {
  formatEurosFromCents,
  formatDate,
  generateQuoteNumber,
  nextSequenceFromQuoteNumbers,
} from "@/lib/utils";
import type { Quote } from "@/types/database";

const STATUS_CONFIG: Record<
  Quote["status"],
  { label: string; variant: "muted" | "gold" | "warning" | "success" | "danger" }
> = {
  draft: { label: "Brouillon", variant: "muted" },
  sent: { label: "Envoyé", variant: "gold" },
  viewed: { label: "Vu", variant: "warning" },
  accepted: { label: "Accepté", variant: "success" },
  rejected: { label: "Refusé", variant: "danger" },
  expired: { label: "Expiré", variant: "muted" },
};

export default function AdminQuotesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setQuotes(data ?? []);
    setLoading(false);
  }, [supabase, statusFilter]);

  useEffect(() => {
    void fetchQuotes();
  }, [fetchQuotes]);

  async function handleDuplicate(quote: Quote) {
    const { data: rows } = await supabase.from("quotes").select("quote_number");
    const nextNum = nextSequenceFromQuoteNumbers(
      (rows ?? []).map((r) => r.quote_number)
    );

    const { data: newQuote, error } = await supabase
      .from("quotes")
      .insert({
        quote_number: generateQuoteNumber(nextNum),
        client_id: quote.client_id,
        lead_id: quote.lead_id,
        recipient_name: quote.recipient_name,
        recipient_email: quote.recipient_email,
        recipient_company: quote.recipient_company,
        items: quote.items,
        subtotal: quote.subtotal,
        tax_rate: quote.tax_rate,
        total: quote.total,
        valid_until: new Date(Date.now() + 30 * 86400000)
          .toISOString()
          .split("T")[0],
        status: "draft",
        notes: quote.notes,
        pdf_url: null,
      })
      .select()
      .single();

    if (!error && newQuote) {
      router.push(`/admin/quotes/${newQuote.id}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce devis ? Cette action est irréversible.")) return;
    setDeleting(id);
    await supabase.from("quotes").delete().eq("id", id);
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    setDeleting(null);
  }

  function clientLabel(q: Quote): string {
    const name = q.recipient_name?.trim() || "—";
    if (q.recipient_company?.trim()) {
      return `${name} — ${q.recipient_company.trim()}`;
    }
    return name;
  }

  const columns = [
    { key: "num", label: "N°" },
    { key: "who", label: "Client / Prospect" },
    { key: "amount", label: "Montant" },
    { key: "status", label: "Statut" },
    { key: "created", label: "Création" },
    { key: "valid", label: "Valide jusqu'au" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-astra-text">Devis</h1>
          <p className="mt-1 text-sm text-astra-text-secondary">
            {quotes.length} devis
          </p>
        </div>
        <Link href="/admin/quotes/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nouveau devis
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Select
          label="Filtrer par statut"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-56"
        >
          <option value="all">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="sent">Envoyé</option>
          <option value="viewed">Vu</option>
          <option value="accepted">Accepté</option>
          <option value="rejected">Refusé</option>
          <option value="expired">Expiré</option>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-astra-card"
            />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-astra-text-muted" />
          <p className="mt-4 text-sm text-astra-text-secondary">
            Aucun devis trouvé.
          </p>
          <Link href="/admin/quotes/new" className="mt-4">
            <Button size="sm">Créer un devis</Button>
          </Link>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <div className="min-w-[960px]">
            <div className="grid grid-cols-[minmax(140px,1.1fr)_minmax(160px,1.4fr)_100px_110px_120px_120px_200px] gap-2 border-b border-astra-border bg-astra-card/80 px-4 py-3 text-xs font-medium uppercase tracking-wider text-astra-text-muted">
              {columns.map((c) => (
                <div key={c.key}>{c.label}</div>
              ))}
            </div>
            {quotes.map((quote) => {
              const config = STATUS_CONFIG[quote.status];
              return (
                <div
                  key={quote.id}
                  className="grid grid-cols-[minmax(140px,1.1fr)_minmax(160px,1.4fr)_100px_110px_120px_120px_200px] items-center gap-2 border-b border-astra-border/50 px-4 py-3 text-sm transition-colors hover:bg-white/[0.02] last:border-0"
                >
                  <div className="font-mono text-xs font-medium text-astra-text">
                    {quote.quote_number}
                  </div>
                  <div className="min-w-0 text-astra-text-secondary">
                    <span className="line-clamp-2">{clientLabel(quote)}</span>
                  </div>
                  <div className="font-medium text-astra-text">
                    {formatEurosFromCents(quote.total)}
                  </div>
                  <div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  <div className="text-xs text-astra-text-muted">
                    {formatDate(quote.created_at)}
                  </div>
                  <div className="text-xs text-astra-text-muted">
                    {quote.valid_until ? formatDate(quote.valid_until) : "—"}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Link href={`/admin/quotes/${quote.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3.5 w-3.5" />
                        Voir
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDuplicate(quote)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Dupliquer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDelete(quote.id)}
                      loading={deleting === quote.id}
                      className="text-astra-danger hover:text-astra-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
