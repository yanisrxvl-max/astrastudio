'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Edit, FileDown, Send, Copy, Trash2, Eye, Download, CheckCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  formatEurosFromCents,
  formatDate,
  generateQuoteNumber,
  nextSequenceFromQuoteNumbers,
} from '@/lib/utils';
import type { Quote } from '@/types/database';

const STATUS_CONFIG: Record<Quote['status'], { label: string; variant: 'muted' | 'gold' | 'warning' | 'success' | 'danger' }> = {
  draft: { label: 'Brouillon', variant: 'muted' },
  sent: { label: 'Envoyé', variant: 'gold' },
  viewed: { label: 'Vu', variant: 'warning' },
  accepted: { label: 'Accepté', variant: 'success' },
  rejected: { label: 'Refusé', variant: 'danger' },
  expired: { label: 'Expiré', variant: 'muted' },
};

export default function AdminQuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    const { data } = await supabase.from('quotes').select('*').eq('id', quoteId).single();
    setQuote(data);
    setLoading(false);
  }, [supabase, quoteId]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  async function handleGeneratePdf() {
    setActionLoading('pdf');
    await fetch('/api/quotes/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote_id: quoteId }),
    });
    await fetchQuote();
    setActionLoading(null);
  }

  async function handleSend() {
    setActionLoading('send');
    await fetch('/api/quotes/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote_id: quoteId }),
    });
    await fetchQuote();
    setActionLoading(null);
  }

  async function handleMarkViewed() {
    setActionLoading('viewed');
    await supabase.from('quotes').update({ status: 'viewed' }).eq('id', quoteId);
    await fetchQuote();
    setActionLoading(null);
  }

  async function handleDuplicate() {
    if (!quote) return;
    setActionLoading('duplicate');

    const { data: rows } = await supabase.from('quotes').select('quote_number');
    const nextNum = nextSequenceFromQuoteNumbers(
      (rows ?? []).map((r) => r.quote_number)
    );

    const { data: newQuote } = await supabase
      .from('quotes')
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
        valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'draft',
        notes: quote.notes,
      })
      .select()
      .single();

    setActionLoading(null);
    if (newQuote) router.push(`/admin/quotes/${newQuote.id}`);
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce devis ? Cette action est irréversible.')) return;
    setActionLoading('delete');
    await supabase.from('quotes').delete().eq('id', quoteId);
    router.push('/admin/quotes');
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
        <Link href="/admin/quotes" className="mt-4">
          <Button variant="secondary" size="sm">Retour aux devis</Button>
        </Link>
      </div>
    );
  }

  const config = STATUS_CONFIG[quote.status];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/quotes">
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
            {quote.accepted_at && ` • Accepté le ${formatDate(quote.accepted_at)}`}
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

      <div className="flex flex-wrap items-center gap-3">
        {quote.status === 'draft' && (
          <>
            <Link href={`/admin/quotes/new?edit=${quote.id}`}>
              <Button variant="secondary">
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
            </Link>
            <Button variant="secondary" onClick={handleGeneratePdf} loading={actionLoading === 'pdf'}>
              <FileDown className="h-4 w-4" />
              Générer PDF
            </Button>
            <Button onClick={handleSend} loading={actionLoading === 'send'}>
              <Send className="h-4 w-4" />
              Envoyer
            </Button>
          </>
        )}

        {quote.status === 'sent' && (
          <>
            <Button onClick={handleSend} loading={actionLoading === 'send'}>
              <Send className="h-4 w-4" />
              Renvoyer
            </Button>
            <Button variant="secondary" onClick={handleMarkViewed} loading={actionLoading === 'viewed'}>
              <Eye className="h-4 w-4" />
              Marquer comme vu
            </Button>
          </>
        )}

        {quote.pdf_url && (
          <a href={`/api/quotes/${quote.id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">
              <Download className="h-4 w-4" />
              Télécharger le PDF
            </Button>
          </a>
        )}

        <Button variant="secondary" onClick={handleDuplicate} loading={actionLoading === 'duplicate'}>
          <Copy className="h-4 w-4" />
          Dupliquer
        </Button>

        <Button variant="danger" onClick={handleDelete} loading={actionLoading === 'delete'}>
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>

        {quote.status === 'accepted' && (
          <div className="flex items-center gap-2 rounded-xl bg-astra-success/10 px-4 py-2 text-sm text-astra-success">
            <CheckCircle className="h-4 w-4" />
            Devis accepté le {formatDate(quote.accepted_at!)}
          </div>
        )}
      </div>
    </div>
  );
}
