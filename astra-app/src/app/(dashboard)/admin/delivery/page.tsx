"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Package, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { formatDate, formatFileSize } from "@/lib/utils";
import type { ContentPack, Client } from "@/types/database";

const STATUS_CONFIG: Record<
  ContentPack["status"],
  { label: string; variant: "warning" | "success" | "gold" }
> = {
  preparing: { label: "En préparation", variant: "warning" },
  delivered: { label: "Livré", variant: "success" },
  downloaded: { label: "Téléchargé", variant: "gold" },
};

type PackWithStats = ContentPack & {
  client_name: string;
  file_count: number;
  total_size: number;
};

export default function AdminDeliveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [packs, setPacks] = useState<PackWithStats[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const actionNewDone = useRef(false);

  useEffect(() => {
    const cid = searchParams.get("client_id");
    if (cid) setClientFilter(cid);
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: clientsData } = await supabase
      .from("clients")
      .select("*")
      .order("company_name");
    setClients(clientsData ?? []);

    let query = supabase
      .from("content_packs")
      .select("*")
      .order("created_at", { ascending: false });

    if (clientFilter !== "all") query = query.eq("client_id", clientFilter);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (monthFilter !== "all") query = query.eq("month", monthFilter);

    const { data: packsData } = await query;
    const clientMap = new Map(
      (clientsData ?? []).map((c) => [c.id, c.company_name])
    );

    const enriched: PackWithStats[] = [];
    for (const pack of packsData ?? []) {
      const { data: files } = await supabase
        .from("content_files")
        .select("file_size")
        .eq("pack_id", pack.id);

      enriched.push({
        ...pack,
        client_name: clientMap.get(pack.client_id) ?? "Client inconnu",
        file_count: files?.length ?? 0,
        total_size:
          files?.reduce((sum, f) => sum + f.file_size, 0) ?? 0,
      });
    }

    setPacks(enriched);
    setLoading(false);
  }, [supabase, clientFilter, statusFilter, monthFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const months = [...new Set(packs.map((p) => p.month))].sort().reverse();

  useEffect(() => {
    if (loading || clients.length === 0 || actionNewDone.current) return;
    const action = searchParams.get("action");
    if (action !== "new") return;

    const paramCid = searchParams.get("client_id");
    if (paramCid && !clients.some((c) => c.id === paramCid)) return;

    actionNewDone.current = true;
    window.history.replaceState({}, "", window.location.pathname);
    const q = paramCid ? `?client_id=${encodeURIComponent(paramCid)}` : "";
    router.replace(`/admin/delivery/new${q}`);
  }, [loading, clients, searchParams, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-astra-text">Livraisons</h1>
          <p className="mt-1 text-sm text-astra-text-secondary">
            {packs.length} pack{packs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/delivery/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-astra-gold px-4 text-sm font-medium text-black transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nouveau pack
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="w-48"
        >
          <option value="all">Tous les clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company_name}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        >
          <option value="all">Tous les statuts</option>
          <option value="preparing">En préparation</option>
          <option value="delivered">Livré</option>
          <option value="downloaded">Téléchargé</option>
        </Select>
        <Select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="w-40"
        >
          <option value="all">Tous les mois</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl bg-astra-card"
            />
          ))}
        </div>
      ) : packs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Package className="h-12 w-12 text-astra-text-muted" />
          <p className="mt-4 text-sm text-astra-text-secondary">
            Aucun pack de contenu.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => {
            const config = STATUS_CONFIG[pack.status];
            return (
              <Card key={pack.id} hover className="p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-astra-text">
                      {pack.title}
                    </h3>
                    <p className="mt-1 text-sm text-astra-text-secondary">
                      {pack.client_name}
                    </p>
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>

                <div className="mt-4 flex items-center gap-3 text-xs text-astra-text-muted">
                  <span>{pack.month}</span>
                  <span>•</span>
                  <span>
                    {pack.file_count} fichier{pack.file_count !== 1 ? "s" : ""}
                  </span>
                  {pack.total_size > 0 && (
                    <>
                      <span>•</span>
                      <span>{formatFileSize(pack.total_size)}</span>
                    </>
                  )}
                </div>

                {pack.delivered_at && (
                  <p className="mt-2 text-xs text-astra-text-muted">
                    Livré le {formatDate(pack.delivered_at)}
                  </p>
                )}

                <Link href={`/admin/delivery/${pack.id}`} className="mt-4 block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between"
                  >
                    Gérer
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
