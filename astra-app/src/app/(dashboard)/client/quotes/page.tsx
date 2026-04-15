'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatEurosFromCents, formatDate } from '@/lib/utils';
import type { Quote } from '@/types/database';

const STATUS_CONFIG: Record<Quote['status'], { label: string; variant: 'muted' | 'gold' | 'warning' | 'success' | 'danger' }> = {
  draft: { label: 'Brouillon', variant: 'muted' },
  sent: { label: 'Envoyé', variant: 'gold' },
  viewed: { label: 'Vu', variant: 'warning' },
  accepted: { label: 'Accepté', variant: 'success' },
  rejected: { label: 'Refusé', variant: 'danger' },
  expired: { label: 'Expiré', variant: 'muted' },
};

export default function ClientQuotesPage() {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
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

    const { data } = await supabase
      .from('quotes')
      .select('*')
      .eq('client_id', client.id)
      .neq('status', 'draft')
      .order('created_at', { ascending: false });

    setQuotes(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-astra-text">Vos devis</h1>
        <p className="mt-1 text-sm text-astra-text-secondary">
          {quotes.length} devis
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-astra-card" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-astra-text-muted" />
          <p className="mt-4 text-sm text-astra-text-secondary">Aucun devis pour le moment.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => {
            const config = STATUS_CONFIG[quote.status];
            return (
              <Card key={quote.id} hover className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium text-astra-text">
                        {quote.quote_number}
                      </span>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-astra-text-secondary">
                      <span className="font-medium text-astra-text">
                        {formatEurosFromCents(quote.total)}
                      </span>
                      <span>{formatDate(quote.created_at)}</span>
                      {quote.valid_until && (
                        <span className="text-astra-text-muted">
                          Valide jusqu&apos;au {formatDate(quote.valid_until)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/client/quotes/${quote.id}`}>
                    <Button variant="secondary" size="sm">
                      Voir le devis
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
