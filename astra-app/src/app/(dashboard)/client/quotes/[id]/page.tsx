'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, CheckCircle, XCircle } from 'lucide-react';
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

export default function ClientQuoteDetailPage() {
  const params = useParams();
  const supabase = createClient();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    const { data } = await supabase.from('quotes').select('*').eq('id', quoteId).single();
    if (data) {
      setQuote(data);

      if (data.status === 'sent') {
        await supabase.from('quotes').update({ status: 'viewed' }).eq('id', quoteId);
      }
    }
    setLoading(false);
  }, [supabase, quoteId]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  async function handleAccept() {
    setActionLoading('accept');

    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('quotes')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (admins && user) {
      for (const admin of admins) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          type: 'quote_accepted',
          title: 'Devis accepté',
          body: `Le devis ${quote?.quote_number} a été accepté.`,
          link: `/admin/quotes/${quoteId}`,
        });
      }
    }

    await fetchQuote();
    setActionLoading(null);
  }

  async function handleReject() {
    if (!confirm('Êtes-vous sûr de vouloir refuser ce devis ?')) return;
    setActionLoading('reject');

    await supabase
      .from('quotes')
      .update({ status: 'rejected' })
      .eq('id', quoteId);

    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    for (const admin of admins ?? []) {
      await supabase.from('notifications').insert({
        user_id: admin.id,
        type: 'message',
        title: 'Devis refusé',
        body: quote
          ? `Le devis ${quote.quote_number} a été refusé par le client.`
          : 'Un devis a été refusé.',
        link: `/admin/quotes/${quoteId}`,
      });
    }

    await fetchQuote();
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-astra-card" />
        <div className="h-96 animate-pulse rounded-2xl bg-astra-card" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-astra-text-secondary">Devis introuvable.</p>
        <Link href="/client/quotes" className="mt-4">
          <Button variant="secondary" size="sm">Retour</Button>
        </Link>
      </div>
    );
  }

  const config = STATUS_CONFIG[quote.status];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/client/quotes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-astra-text">
              {quote.quote_number}
            </h1>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-astra-text-secondary">
            Créé le {formatDate(quote.created_at)}
            {quote.sent_at && ` • Envoyé le ${formatDate(quote.sent_at)}`}
          </p>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-astra-text-muted">
          Destinataire
        </h2>
        <div className="space-y-1 text-sm">
          <p className="font-medium text-astra-text">{quote.recipient_name}</p>
          {quote.recipient_company && (
            <p className="text-astra-text-secondary">{quote.recipient_company}</p>
          )}
          <p className="text-astra-text-secondary">{quote.recipient_email}</p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-astra-text-muted">
          Prestations
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-astra-border text-left text-astra-text-muted">
                <th className="pb-3 font-medium">Prestation</th>
                <th className="pb-3 text-right font-medium">Qté</th>
                <th className="pb-3 text-right font-medium">Prix unit.</th>
                <th className="pb-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, i) => (
                <tr key={i} className="border-b border-astra-border/50">
                  <td className="py-3">
                    <p className="font-medium text-astra-text">{item.label}</p>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-astra-text-muted">{item.description}</p>
                    )}
                  </td>
                  <td className="py-3 text-right text-astra-text-secondary">{item.quantity}</td>
                  <td className="py-3 text-right text-astra-text-secondary">
                    {formatEurosFromCents(item.unit_price)}
                  </td>
                  <td className="py-3 text-right font-medium text-astra-text">
                    {formatEurosFromCents(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col items-end gap-2 border-t border-astra-border pt-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-astra-text-secondary">Sous-total</span>
            <span className="font-medium text-astra-text">{formatEurosFromCents(quote.subtotal)}</span>
          </div>
          <p className="text-xs text-astra-text-muted">TVA non applicable, art. 293 B du CGI</p>
          <div className="flex items-center gap-4 text-base">
            <span className="font-medium text-astra-text-secondary">Total</span>
            <span className="text-lg font-semibold text-astra-gold">
              {formatEurosFromCents(quote.total)}
            </span>
          </div>
        </div>
      </Card>

      {quote.notes && (
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-astra-text-muted">
            Notes & Conditions
          </h2>
          <p className="whitespace-pre-wrap text-sm text-astra-text-secondary">{quote.notes}</p>
          <p className="mt-2 text-sm text-astra-text-muted">
            Valide jusqu&apos;au {formatDate(quote.valid_until)}
          </p>
        </Card>
      )}

      {quote.status === 'accepted' && (
        <div className="flex items-center gap-2 rounded-xl bg-astra-success/10 px-5 py-3 text-sm text-astra-success">
          <CheckCircle className="h-4 w-4" />
          Devis accepté le {formatDate(quote.accepted_at!)}
        </div>
      )}

      {quote.status === 'rejected' && (
        <div className="flex items-center gap-2 rounded-xl bg-astra-danger/10 px-5 py-3 text-sm text-astra-danger">
          <XCircle className="h-4 w-4" />
          Devis refusé
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="border-b border-astra-border px-4 py-2 text-xs font-medium uppercase tracking-wider text-astra-text-muted">
          Document PDF
        </div>
        <iframe
          title={`Devis ${quote.quote_number}`}
          src={`/api/quotes/${quote.id}/pdf`}
          className="h-[min(78vh,900px)] w-full min-h-[520px] bg-[#111]"
        />
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={`/api/quotes/${quote.id}/pdf?download=1`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="secondary">
            <Download className="h-4 w-4" />
            Télécharger le PDF
          </Button>
        </a>

        {(quote.status === 'sent' || quote.status === 'viewed') && (
          <>
            <Button onClick={handleAccept} loading={actionLoading === 'accept'}>
              <CheckCircle className="h-4 w-4" />
              Accepter ce devis
            </Button>
            <Button
              variant="ghost"
              onClick={handleReject}
              loading={actionLoading === 'reject'}
              className="text-astra-danger hover:text-astra-danger"
            >
              Refuser
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
