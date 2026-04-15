import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Quote, QuoteItem } from "@/types/database";

const GOLD = "#d4af37";
const BG = "#0a0a0a";
const CARD = "#111111";
const BORDER = "rgba(255,255,255,0.12)";
const MUTED = "#888888";

function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#e8e8e8",
    backgroundColor: BG,
    padding: 40,
    lineHeight: 1.45,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
  },
  logoBlock: {},
  logoTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  logoSub: {
    fontSize: 9,
    color: GOLD,
    fontWeight: "bold",
    letterSpacing: 3,
    marginTop: 2,
    textTransform: "uppercase",
  },
  devisLabel: {
    fontSize: 28,
    fontWeight: "bold",
    color: GOLD,
    letterSpacing: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 10,
    backgroundColor: CARD,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 8, color: MUTED, marginBottom: 2 },
  metaValue: { fontSize: 10, color: "#ffffff", fontWeight: "bold" },
  twoCol: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 20,
  },
  block: {
    flex: 1,
    padding: 12,
    backgroundColor: CARD,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  blockTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  blockLine: { fontSize: 9, color: "#cccccc", marginBottom: 3 },
  blockName: { fontSize: 11, fontWeight: "bold", color: "#ffffff", marginBottom: 4 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  th: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  cellDesignation: { width: "20%" },
  cellDesc: { width: "32%", paddingRight: 6 },
  cellQty: { width: "8%", textAlign: "center" },
  cellUnit: { width: "18%", textAlign: "right" },
  cellTotal: { width: "22%", textAlign: "right", fontWeight: "bold" },
  totals: {
    marginTop: 12,
    alignItems: "flex-end",
    gap: 4,
  },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 24 },
  totalLabel: { fontSize: 9, color: MUTED, width: 100, textAlign: "right" },
  totalValue: { fontSize: 10, color: "#ffffff", fontWeight: "bold", width: 80, textAlign: "right" },
  tvaNote: { fontSize: 8, color: MUTED, fontStyle: "italic" },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#ffffff",
    gap: 24,
  },
  grandLabel: { fontSize: 11, color: "#ffffff", fontWeight: "bold", width: 100, textAlign: "right" },
  grandValue: { fontSize: 16, color: GOLD, fontWeight: "bold", width: 80, textAlign: "right" },
  conditions: {
    marginTop: 20,
    padding: 12,
    backgroundColor: CARD,
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    borderRadius: 2,
  },
  condTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: MUTED,
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 1,
  },
  condText: { fontSize: 9, color: "#bbbbbb", lineHeight: 1.5 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
  },
  footerLine: { fontSize: 8, color: "#555555", marginBottom: 2 },
});

function ItemRow({ item }: { item: QuoteItem }) {
  return (
    <View style={styles.row} wrap={false}>
      <View style={styles.cellDesignation}>
        <Text style={{ color: "#ffffff", fontWeight: "bold" }}>{item.label}</Text>
      </View>
      <View style={styles.cellDesc}>
        <Text style={{ color: MUTED, fontSize: 8 }}>
          {item.description || "—"}
        </Text>
      </View>
      <Text style={styles.cellQty}>{item.quantity}</Text>
      <Text style={styles.cellUnit}>{euros(item.unit_price)} €</Text>
      <Text style={[styles.cellTotal, { color: "#ffffff" }]}>
        {euros(item.total)} €
      </Text>
    </View>
  );
}

export function QuotePdfDocument({ quote }: { quote: Quote }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.logoBlock}>
            <Text style={styles.logoTitle}>ASTRA</Text>
            <Text style={styles.logoSub}>Studio</Text>
          </View>
          <Text style={styles.devisLabel}>DEVIS</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>N° du devis</Text>
            <Text style={styles.metaValue}>{quote.quote_number}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Date d&apos;émission</Text>
            <Text style={styles.metaValue}>{longDate(quote.created_at)}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Valide jusqu&apos;au</Text>
            <Text style={styles.metaValue}>{longDate(quote.valid_until)}</Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Émetteur</Text>
            <Text style={styles.blockName}>Astra Studio</Text>
            <Text style={styles.blockLine}>Yanis Revel — Micro-entreprise</Text>
            <Text style={styles.blockLine}>SIRET : 988 233 979 00018</Text>
            <Text style={styles.blockLine}>23 rue Bardiaux, 03200 Vichy</Text>
            <Text style={styles.blockLine}>bonjour@astrastudio.fr</Text>
          </View>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Destinataire</Text>
            <Text style={styles.blockName}>{quote.recipient_name}</Text>
            {quote.recipient_company ? (
              <Text style={styles.blockLine}>{quote.recipient_company}</Text>
            ) : null}
            <Text style={styles.blockLine}>{quote.recipient_email}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 6 }}>
          <Text style={{ fontSize: 8, color: MUTED, marginBottom: 6, fontWeight: "bold" }}>
            PRESTATIONS
          </Text>
          <View style={styles.tableHead}>
            <Text style={[styles.th, { width: "20%" }]}>Désignation</Text>
            <Text style={[styles.th, { width: "32%" }]}>Description</Text>
            <Text style={[styles.th, { width: "8%", textAlign: "center" }]}>Qté</Text>
            <Text style={[styles.th, { width: "18%", textAlign: "right" }]}>
              Prix unitaire HT
            </Text>
            <Text style={[styles.th, { width: "22%", textAlign: "right" }]}>Total</Text>
          </View>
          {quote.items.map((item, i) => (
            <ItemRow key={i} item={item} />
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>{euros(quote.subtotal)} €</Text>
          </View>
          <Text style={styles.tvaNote}>
            TVA non applicable (art. 293 B du CGI)
          </Text>
          <View style={styles.grandTotal}>
            <Text style={styles.grandLabel}>TOTAL</Text>
            <Text style={styles.grandValue}>{euros(quote.total)} €</Text>
          </View>
        </View>

        {quote.notes ? (
          <View style={styles.conditions}>
            <Text style={styles.condTitle}>Conditions</Text>
            <Text style={styles.condText}>{quote.notes}</Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text style={styles.footerLine}>
            Astra Studio — Direction créative pour marques beauté
          </Text>
          <Text style={styles.footerLine}>
            Méthode 100→10→1 • Humain + IA
          </Text>
        </View>
      </Page>
    </Document>
  );
}
