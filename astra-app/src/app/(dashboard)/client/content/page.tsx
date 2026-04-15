'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDate, formatFileSize } from '@/lib/utils';
import type { ContentPack } from '@/types/database';

type PackWithStats = ContentPack & {
  file_count: number;
  total_size: number;
};

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function ClientContentPage() {
  const supabase = createClient();
  const [packs, setPacks] = useState<PackWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPacks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      setLoading(false);
      return;
    }

    const { data: packsData } = await supabase
      .from('content_packs')
      .select('*')
      .eq('client_id', client.id)
      .in('status', ['delivered', 'downloaded'])
      .order('delivered_at', { ascending: false });

    const enriched: PackWithStats[] = [];
    for (const pack of packsData ?? []) {
      const { data: files } = await supabase
        .from('content_files')
        .select('file_size')
        .eq('pack_id', pack.id);

      enriched.push({
        ...pack,
        file_count: files?.length ?? 0,
        total_size: files?.reduce((sum, f) => sum + f.file_size, 0) ?? 0,
      });
    }

    setPacks(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchPacks();
  }, [fetchPacks]);

  const grouped = useMemo(() => {
    const map = new Map<string, PackWithStats[]>();
    for (const p of packs) {
      const key = p.month;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    const entries = [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
    return entries;
  }, [packs]);

  function packBadge(pack: PackWithStats) {
    if (pack.status === 'downloaded') {
      return <Badge variant="muted">Téléchargé</Badge>;
    }
    if (!pack.opened_at) {
      return <Badge variant="gold">Nouveau ✨</Badge>;
    }
    return null;
  }

  return (
    <div className="min-h-[60vh] space-y-8 bg-[#0a0a0a] px-0 py-2 text-zinc-100">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mes contenus</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Packs livrés, du plus récent au plus ancien.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-zinc-900" />
          ))}
        </div>
      ) : packs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-zinc-800 bg-zinc-900/50 py-20">
          <Package className="h-12 w-12 text-zinc-600" />
          <p className="mt-4 text-sm text-zinc-500">
            Aucun contenu livré pour le moment.
          </p>
        </Card>
      ) : (
        <div className="space-y-10">
          {grouped.map(([monthKey, monthPacks]) => (
            <section key={monthKey}>
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
                {monthLabel(monthKey)}
              </h2>
              <div className="space-y-4">
                {monthPacks.map((pack) => (
                  <div
                    key={pack.id}
                    className="rounded-2xl border border-zinc-800 bg-[#111] p-6 transition-colors hover:border-amber-500/40"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-medium text-white">{pack.title}</h3>
                          {packBadge(pack)}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
                          <span>
                            {pack.file_count} fichier{pack.file_count !== 1 ? 's' : ''}
                          </span>
                          {pack.total_size > 0 && (
                            <>
                              <span className="text-zinc-600">•</span>
                              <span>{formatFileSize(pack.total_size)}</span>
                            </>
                          )}
                        </div>

                        {pack.delivered_at && (
                          <p className="mt-1 text-xs text-zinc-500">
                            Livré le {formatDate(pack.delivered_at)}
                          </p>
                        )}
                      </div>

                      <Link href={`/client/content/${pack.id}`} className="shrink-0">
                        <Button variant="secondary" className="w-full border-zinc-700 sm:w-auto">
                          Ouvrir le pack
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
