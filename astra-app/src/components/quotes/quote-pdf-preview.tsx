"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { QuotePdfDocument } from "@/lib/pdf/quote-pdf-document";
import type { Quote, QuoteItem } from "@/types/database";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[400px] items-center justify-center text-sm text-astra-text-muted">
        Chargement de l&apos;aperçu PDF…
      </div>
    ),
  }
);

const PREVIEW_ID = "00000000-0000-0000-0000-000000000001";

export type QuotePreviewInput = {
  quoteNumber: string;
  recipientName: string;
  recipientEmail: string;
  recipientCompany: string;
  items: QuoteItem[];
  subtotal: number;
  total: number;
  validUntil: string;
  notes: string;
  createdAt: string;
};

export function QuotePdfPreview({
  quoteNumber,
  recipientName,
  recipientEmail,
  recipientCompany,
  items,
  subtotal,
  total,
  validUntil,
  notes,
  createdAt,
}: QuotePreviewInput) {
  const quote = useMemo((): Quote => {
    const lineItems =
      items.length > 0 ? items : [{ ...emptyLine() }];
    return {
      id: PREVIEW_ID,
      quote_number: quoteNumber,
      client_id: null,
      lead_id: null,
      recipient_name: recipientName.trim() || "—",
      recipient_email: recipientEmail.trim() || "—",
      recipient_company: recipientCompany.trim() || null,
      items: lineItems,
      subtotal,
      tax_rate: 0,
      total,
      valid_until: validUntil,
      status: "draft",
      notes: notes.trim() || null,
      pdf_url: null,
      sent_at: null,
      accepted_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    };
  }, [
    quoteNumber,
    recipientName,
    recipientEmail,
    recipientCompany,
    items,
    subtotal,
    total,
    validUntil,
    notes,
    createdAt,
  ]);

  return (
    <div className="flex h-[min(85vh,820px)] min-h-[480px] w-full flex-col overflow-hidden rounded-xl border border-astra-border bg-[#0a0a0a] shadow-inner">
      <PDFViewer width="100%" height="100%" className="min-h-0 flex-1">
        <QuotePdfDocument quote={quote} />
      </PDFViewer>
    </div>
  );
}

function emptyLine(): QuoteItem {
  return {
    label: "—",
    description: null,
    quantity: 1,
    unit_price: 0,
    total: 0,
  };
}
