"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useDeferredValue,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X, Save, FileDown, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import {
  formatEurosFromCents,
  generateQuoteNumber,
  nextSequenceFromQuoteNumbers,
} from "@/lib/utils";
import type { QuoteItem, Quote } from "@/types/database";
import {
  QuotePdfPreview,
  type QuotePreviewInput,
} from "@/components/quotes/quote-pdf-preview";

const DEFAULT_NOTES =
  "Paiement à réception. Acompte de 50% à la signature, solde à la livraison.";

function defaultValidUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

function emptyItem(): QuoteItem {
  return { label: "", description: null, quantity: 1, unit_price: 0, total: 0 };
}

export default function AdminQuoteNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const editId = searchParams.get("edit");
  const leadId = searchParams.get("lead_id");
  const clientId = searchParams.get("client_id");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [sending, setSending] = useState(false);

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientCompany, setRecipientCompany] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([emptyItem()]);
  const [validUntil, setValidUntil] = useState(defaultValidUntil());
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [existingQuote, setExistingQuote] = useState<Quote | null>(null);
  const [previewQuoteNumber, setPreviewQuoteNumber] = useState(() =>
    generateQuoteNumber(1)
  );
  const [previewCreatedAt, setPreviewCreatedAt] = useState(() =>
    new Date().toISOString()
  );
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  const prefillFromLead = useCallback(
    async (id: string) => {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setRecipientName(data.first_name);
        setRecipientEmail(data.email);
      }
    },
    [supabase]
  );

  const prefillFromClient = useCallback(
    async (id: string) => {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setRecipientName(data.contact_name);
        setRecipientEmail(data.email);
        setRecipientCompany(data.company_name);
      }
    },
    [supabase]
  );

  const loadQuote = useCallback(
    async (id: string) => {
      setLoading(true);
      const { data } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setExistingQuote(data);
        setRecipientName(data.recipient_name);
        setRecipientEmail(data.recipient_email);
        setRecipientCompany(data.recipient_company ?? "");
        setItems(data.items.length > 0 ? data.items : [emptyItem()]);
        setValidUntil(data.valid_until);
        setNotes(data.notes ?? "");
        setPreviewQuoteNumber(data.quote_number);
        setPreviewCreatedAt(data.created_at);
      }
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    if (editId) {
      void loadQuote(editId);
    } else {
      if (leadId) void prefillFromLead(leadId);
      if (clientId) void prefillFromClient(clientId);
    }
  }, [editId, leadId, clientId, loadQuote, prefillFromLead, prefillFromClient]);

  useEffect(() => {
    if (existingQuote || editId) return;
    void (async () => {
      const { data } = await supabase.from("quotes").select("quote_number");
      const next = nextSequenceFromQuoteNumbers(
        (data ?? []).map((r) => r.quote_number)
      );
      setPreviewQuoteNumber(generateQuoteNumber(next));
    })();
  }, [supabase, existingQuote, editId]);

  const previewInput = useMemo(
    (): QuotePreviewInput => ({
      quoteNumber: previewQuoteNumber,
      recipientName,
      recipientEmail,
      recipientCompany,
      items,
      subtotal,
      total: subtotal,
      validUntil,
      notes,
      createdAt: previewCreatedAt,
    }),
    [
      previewQuoteNumber,
      recipientName,
      recipientEmail,
      recipientCompany,
      items,
      subtotal,
      validUntil,
      notes,
      previewCreatedAt,
    ]
  );

  const deferredPreview = useDeferredValue(previewInput);

  function updateItem(
    index: number,
    field: keyof QuoteItem,
    value: string | number
  ) {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === "label") item.label = value as string;
      else if (field === "description")
        item.description = (value as string) || null;
      else if (field === "quantity") item.quantity = Number(value) || 0;
      else if (field === "unit_price")
        item.unit_price = Math.round(Number(value) * 100) || 0;

      item.total = item.quantity * item.unit_price;
      updated[index] = item;
      return updated;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
    );
  }

  async function saveQuote(status: Quote["status"] = "draft"): Promise<string | null> {
    setSaving(true);

    const quoteData = {
      recipient_name: recipientName,
      recipient_email: recipientEmail,
      recipient_company: recipientCompany || null,
      items,
      subtotal,
      tax_rate: 0,
      total: subtotal,
      valid_until: validUntil,
      status,
      notes: notes || null,
      client_id: clientId || existingQuote?.client_id || null,
      lead_id: leadId || existingQuote?.lead_id || null,
    };

    let quoteId: string | null = null;

    if (existingQuote) {
      const { error } = await supabase
        .from("quotes")
        .update(quoteData)
        .eq("id", existingQuote.id);
      if (!error) quoteId = existingQuote.id;
    } else {
      const { data: rows } = await supabase.from("quotes").select("quote_number");
      const nextNum = nextSequenceFromQuoteNumbers(
        (rows ?? []).map((r) => r.quote_number)
      );

      const { data: newQuote, error } = await supabase
        .from("quotes")
        .insert({
          ...quoteData,
          quote_number: generateQuoteNumber(nextNum),
        })
        .select()
        .single();

      if (!error && newQuote) {
        quoteId = newQuote.id;
        setExistingQuote(newQuote);
        setPreviewQuoteNumber(newQuote.quote_number);
        setPreviewCreatedAt(newQuote.created_at);
      }
    }

    setSaving(false);
    return quoteId;
  }

  async function handleSaveDraft() {
    const id = await saveQuote("draft");
    if (id) router.push(`/admin/quotes/${id}`);
  }

  async function handleGeneratePdf() {
    setGeneratingPdf(true);
    const id = await saveQuote(existingQuote?.status ?? "draft");
    if (id) {
      await fetch("/api/quotes/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote_id: id }),
      });
      router.push(`/admin/quotes/${id}`);
    }
    setGeneratingPdf(false);
  }

  async function handleSend() {
    setSending(true);
    const id = await saveQuote(existingQuote?.status ?? "draft");
    if (id) {
      await fetch("/api/quotes/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote_id: id }),
      });
      router.push(`/admin/quotes/${id}`);
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-astra-card" />
        <div className="h-64 animate-pulse rounded-2xl bg-astra-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-astra-text">
        {editId ? "Modifier le devis" : "Nouveau devis"}
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_min(440px,42vw)] xl:grid-cols-[1fr_480px]">
        <div className="min-w-0 space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-medium text-astra-text">
              Destinataire
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nom complet"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Nom du destinataire"
              />
              <Input
                label="Email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="email@exemple.com"
              />
              <div className="sm:col-span-2">
                <Input
                  label="Entreprise / Marque (optionnel)"
                  value={recipientCompany}
                  onChange={(e) => setRecipientCompany(e.target.value)}
                  placeholder="Nom de la marque"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-medium text-astra-text">
              Lignes du devis
            </h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl border border-astra-border bg-astra-bg p-4"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap gap-3">
                      <div className="min-w-[140px] flex-1">
                        <Input
                          placeholder="Prestation — ex. Audit de marque Astra"
                          value={item.label}
                          onChange={(e) =>
                            updateItem(index, "label", e.target.value)
                          }
                        />
                      </div>
                      <div className="w-20 shrink-0">
                        <Input
                          type="number"
                          placeholder="Qté"
                          min={1}
                          value={item.quantity || ""}
                          onChange={(e) =>
                            updateItem(index, "quantity", e.target.value)
                          }
                        />
                      </div>
                      <div className="w-32 shrink-0">
                        <Input
                          type="number"
                          placeholder="Prix unit. € HT"
                          min={0}
                          step={0.01}
                          value={
                            item.unit_price
                              ? (item.unit_price / 100).toFixed(2)
                              : ""
                          }
                          onChange={(e) =>
                            updateItem(index, "unit_price", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex w-28 shrink-0 items-center justify-end text-sm font-medium text-astra-text">
                        {formatEurosFromCents(item.total)}
                      </div>
                    </div>
                    <Input
                      placeholder="Description (optionnel)"
                      value={item.description ?? ""}
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      className="text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="mt-1 rounded-lg p-1.5 text-astra-text-muted transition-colors hover:bg-white/5 hover:text-astra-danger"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <Button variant="ghost" size="sm" onClick={addItem} className="mt-3">
              <Plus className="h-4 w-4" />
              Ajouter une ligne
            </Button>

            <div className="mt-6 flex flex-col items-end gap-2 border-t border-astra-border pt-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-astra-text-secondary">Sous-total HT</span>
                <span className="font-medium text-astra-text">
                  {formatEurosFromCents(subtotal)}
                </span>
              </div>
              <p className="max-w-md text-right text-xs text-astra-text-muted">
                TVA non applicable, art. 293 B du CGI — Total TTC = sous-total
                (0&nbsp;% TVA)
              </p>
              <div className="flex items-center gap-4 text-base">
                <span className="font-medium text-astra-text-secondary">
                  Total TTC
                </span>
                <span className="text-lg font-semibold text-astra-gold">
                  {formatEurosFromCents(subtotal)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-medium text-astra-text">
              Conditions
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Date de validité"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Notes / conditions particulières"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={handleSaveDraft} loading={saving}>
              <Save className="h-4 w-4" />
              Sauvegarder en brouillon
            </Button>
            <Button
              variant="secondary"
              onClick={handleGeneratePdf}
              loading={generatingPdf}
            >
              <FileDown className="h-4 w-4" />
              Générer le PDF
            </Button>
            <Button onClick={handleSend} loading={sending}>
              <Send className="h-4 w-4" />
              Envoyer par email
            </Button>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-astra-text-muted">
            Aperçu PDF
          </p>
          <QuotePdfPreview {...deferredPreview} />
        </div>
      </div>
    </div>
  );
}
