"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea, Select } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { cockpitDb } from "@/lib/supabase/cockpit-db";
import type { QuoteItem, Tables } from "@/types/database";
import { ArrowLeft } from "lucide-react";

function emptyItem(): QuoteItem {
  return { label: "", description: null, quantity: 1, unit_price: 0, total: 0 };
}

export default function NewInvoicePage() {
  const router = useRouter();
  const supabase = createClient();
  const db = useMemo(() => cockpitDb(supabase), [supabase]);
  const [clients, setClients] = useState<Tables<"clients">[]>([]);
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([emptyItem()]);
  const [taxRate, setTaxRate] = useState("20");
  const [notes, setNotes] = useState("");
  const [issuedAt, setIssuedAt] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tr = Number(taxRate.replace(",", ".")) || 0;
  const total = subtotal * (1 + tr / 100);

  useEffect(() => {
    void supabase
      .from("clients")
      .select("*")
      .order("company_name")
      .then(({ data }) => setClients((data as Tables<"clients">[]) ?? []));
  }, [supabase]);

  const updateItem = useCallback((index: number, field: keyof QuoteItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (field === "label") item.label = value as string;
      else if (field === "description") item.description = (value as string) || null;
      else if (field === "quantity") item.quantity = Number(value) || 0;
      else if (field === "unit_price") item.unit_price = Math.round(Number(value) * 100) / 100;
      item.total = item.quantity * item.unit_price;
      next[index] = item;
      return next;
    });
  }, []);

  async function save() {
    if (!clientId) {
      alert("Choisissez un client.");
      return;
    }
    setSaving(true);

    const { data: settings } = await db
      .from("business_settings")
      .select("invoice_prefix, invoice_seq")
      .eq("id", 1)
      .single();

    const seq = (settings?.invoice_seq ?? 0) + 1;
    const prefix = settings?.invoice_prefix ?? "FAC";
    const y = new Date().getFullYear();
    const invoiceNumber = `${prefix}-${y}-${String(seq).padStart(4, "0")}`;

    const { data: inv, error } = await db
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        client_id: clientId,
        items,
        subtotal,
        tax_rate: tr,
        total,
        status: "draft",
        issued_at: issuedAt,
        due_at: dueAt || null,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (!error) {
      await db
        .from("business_settings")
        .update({ invoice_seq: seq })
        .eq("id", 1);
      router.push(`/admin/invoices/${inv!.id}`);
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-2 text-sm text-astra-text-muted hover:text-astra-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        Factures
      </Link>
      <h1 className="text-2xl font-semibold text-white">Nouvelle facture</h1>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <Select
            label="Client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">— Sélectionner —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </Select>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Date d'émission"
              type="date"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
            />
            <Input
              label="Date d'échéance"
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase text-astra-text-muted">
              Lignes
            </label>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-end gap-2 rounded-xl border border-astra-border p-3"
                >
                  <Input
                    placeholder="Prestation"
                    value={item.label}
                    onChange={(e) =>
                      updateItem(index, "label", e.target.value)
                    }
                    className="min-w-[160px] flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Qté"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", e.target.value)
                    }
                    className="w-20"
                  />
                  <Input
                    type="number"
                    placeholder="PU HT"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateItem(index, "unit_price", e.target.value)
                    }
                    className="w-28"
                  />
                  <span className="text-sm text-astra-text-secondary">
                    {formatCurrency(item.total)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) =>
                        prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
                      )
                    }
                    className="p-2 text-astra-text-muted hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => setItems((prev) => [...prev, emptyItem()])}
            >
              <Plus className="mr-1 h-4 w-4" />
              Ligne
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="TVA (%)"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
            <div className="flex flex-col justify-end">
              <p className="text-xs text-astra-text-muted">Total TTC</p>
              <p className="text-xl font-semibold text-white">
                {formatCurrency(total)}
              </p>
            </div>
          </div>

          <Textarea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Button onClick={() => void save()} loading={saving}>
            <Save className="mr-2 h-4 w-4" />
            Enregistrer la facture
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
