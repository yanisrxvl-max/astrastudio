"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cockpitDb } from "@/lib/supabase/cockpit-db";
import type { Invoice, InvoiceStatus } from "@/types/cockpit";
import { ArrowLeft } from "lucide-react";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const db = useMemo(() => cockpitDb(supabase), [supabase]);
  const [inv, setInv] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await db.from("invoices").select("*").eq("id", id).single();
    setInv(data as Invoice);
    setLoading(false);
  }, [db, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveStatus(status: InvoiceStatus) {
    if (!inv) return;
    setSaving(true);
    const patch: Partial<Invoice> = { status };
    if (status === "paid") {
      patch.paid_at = new Date().toISOString().slice(0, 10);
    }
    await db.from("invoices").update(patch).eq("id", id);
    setSaving(false);
    void load();
    router.refresh();
  }

  if (loading || !inv) {
    return (
      <p className="text-sm text-astra-text-muted">
        {loading ? "Chargement…" : "Introuvable."}
      </p>
    );
  }

  const items = Array.isArray(inv.items) ? inv.items : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-2 text-sm text-astra-text-muted hover:text-astra-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        Factures
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{inv.invoice_number}</h1>
          <p className="mt-1 text-sm text-astra-text-secondary">
            {inv.issued_at ? formatDate(inv.issued_at) : "Sans date"} · TTC{" "}
            {formatCurrency(inv.total)}
          </p>
        </div>
        <Select
          value={inv.status}
          onChange={(e) =>
            void saveStatus(e.target.value as InvoiceStatus)
          }
          disabled={saving}
        >
          <option value="draft">Brouillon</option>
          <option value="sent">Envoyée</option>
          <option value="paid">Payée</option>
          <option value="overdue">En retard</option>
          <option value="cancelled">Annulée</option>
        </Select>
      </div>

      <Card>
        <CardContent className="divide-y divide-white/[0.06] py-0">
          {items.map((row: { label?: string; total?: number }, i: number) => (
            <div
              key={i}
              className="flex justify-between py-3 text-sm"
            >
              <span className="text-astra-text">{row.label}</span>
              <span className="tabular-nums text-white">
                {formatCurrency(Number(row.total ?? 0))}
              </span>
            </div>
          ))}
          <div className="flex justify-between py-4 font-semibold text-white">
            <span>Total TTC</span>
            <span>{formatCurrency(inv.total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => void saveStatus("sent")}
          disabled={saving}
        >
          Marquer envoyée
        </Button>
        <Button onClick={() => void saveStatus("paid")} disabled={saving}>
          Marquer payée
        </Button>
      </div>
    </div>
  );
}
