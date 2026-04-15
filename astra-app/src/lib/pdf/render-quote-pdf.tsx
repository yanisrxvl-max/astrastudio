import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { Quote } from "@/types/database";
import { QuotePdfDocument } from "./quote-pdf-document";

export async function renderQuotePdfBuffer(quote: Quote): Promise<Buffer> {
  const element = React.createElement(QuotePdfDocument, { quote });
  const buf = await renderToBuffer(
    element as Parameters<typeof renderToBuffer>[0]
  );
  return Buffer.from(buf);
}
