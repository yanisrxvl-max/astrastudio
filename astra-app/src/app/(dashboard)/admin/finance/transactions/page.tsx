"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cockpitDb } from "@/lib/supabase/cockpit-db";
import type { LedgerCategory, LedgerTransaction } from "@/types/cockpit";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function TransactionsPage() {
  const supabase = createClient();
  const db = useMemo(() => cockpitDb(supabase), [supabase]);
  const [rows, setRows] = useState<LedgerTransaction[]>([]);
  const [cats, setCats] = useState<LedgerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [kind, setKind] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [occurredOn, setOccurredOn] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [start, end] = monthRange(month);
    const { data: t } = await db
      .from("ledger_transactions")
      .select("*")
      .gte("occurred_on", start)
      .lte("occurred_on", end)
      .order("occurred_on", { ascending: false });
    const { data: c } = await db
      .from("ledger_categories")
      .select("*")
      .order("sort_order");
    setRows((t as LedgerTransaction[]) ?? []);
    setCats((c as LedgerCategory[]) ?? []);
    setLoading(false);
  }, [db, month]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return;
    setSaving(true);
    const { error } = await db.from("ledger_transactions").insert({
      kind,
      amount: n,
      category_id: categoryId || null,
      occurred_on: occurredOn,
      description: description || null,
      status: "paid",
    });
    setSaving(false);
    if (!error) {
      setAmount("");
      setDescription("");
      void load();
    }
  }

  async function removeRow(id: string) {
    if (!confirm("Supprimer cette écriture ?")) return;
    await db.from("ledger_transactions").delete().eq("id", id);
    void load();
  }

  const incomeSum = rows
    .filter((r) => r.kind === "income")
    .reduce((s, r) => s + Number(r.amount), 0);
  const expenseSum = rows
    .filter((r) => r.kind === "expense")
    .reduce((s, r) => s + Number(r.amount), 0);

  const filteredCats = cats.filter((c) => c.kind === kind);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/finance"
          className="mb-4 inline-flex items-center gap-2 text-sm text-astra-text-muted hover:text-astra-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Finance
        </Link>
        <h1 className="text-2xl font-semibold text-white">Transactions</h1>
        <p className="mt-1 text-sm text-astra-text-secondary">
          Grand livre opérationnel — recettes et dépenses par mois.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm text-astra-text-secondary">
          Mois
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="ml-2 rounded-xl border border-astra-border bg-[#0a0a0a] px-3 py-2 text-sm"
          />
        </label>
        <div className="flex gap-6 text-sm">
          <span className="text-emerald-400">
            Recettes : {formatCurrency(incomeSum)}
          </span>
          <span className="text-rose-400">
            Dépenses : {formatCurrency(expenseSum)}
          </span>
          <span className="text-white">
            Net : {formatCurrency(incomeSum - expenseSum)}
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-sm font-semibold text-white">Nouvelle écriture</h2>
          <form
            onSubmit={addTransaction}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6"
          >
            <Select
              value={kind}
              onChange={(e) =>
                setKind(e.target.value as "income" | "expense")
              }
            >
              <option value="income">Recette</option>
              <option value="expense">Dépense</option>
            </Select>
            <Input
              placeholder="Montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Catégorie</option>
              {filteredCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              required
            />
            <Input
              placeholder="Libellé"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="lg:col-span-2"
            />
            <Button type="submit" disabled={saving} className="lg:col-span-6 w-fit">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-astra-text-muted">Chargement…</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-astra-text-muted">
              Aucune transaction pour ce mois.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.06] text-xs uppercase text-astra-text-muted">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Libellé</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 text-astra-text-secondary">
                        {formatDate(r.occurred_on)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            r.kind === "income"
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }
                        >
                          {r.kind === "income" ? "Recette" : "Dépense"}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-white">
                        {formatCurrency(Number(r.amount))}
                      </td>
                      <td className="px-4 py-3 text-astra-text-secondary">
                        {r.description ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void removeRow(r.id)}
                          className="text-astra-text-muted hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function monthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const start = `${ym}-01`;
  const last = new Date(y, m, 0).getDate();
  const end = `${ym}-${String(last).padStart(2, "0")}`;
  return [start, end];
}
