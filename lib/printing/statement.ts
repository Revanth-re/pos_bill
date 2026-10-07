import { toAscii, type Row, paperWidth } from "./escpos";

export interface StatementEntry {
  type: "CREDIT_SALE" | "PAYMENT" | "ADJUSTMENT";
  amount: number;
  balanceAfter: number;
  createdAt: string;
  note: string | null;
  invoiceNumber?: string | null;
  items?: { name: string; qty: number }[];
}

export interface StatementData {
  businessName: string;
  customerName: string;
  phone?: string | null;
  periodLabel: string;
  openingBalance: number;
  entries: StatementEntry[]; // oldest first
  balance: number;
}

const money = (n: number) => n.toFixed(2);
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", weekday: "short" });

/** Udhaari statement as thermal-printer rows (58/80mm). */
export function buildStatementRows(d: StatementData, paper: "58" | "80"): Row[] {
  const W = paperWidth(paper);
  const rows: Row[] = [];
  const t = (text: string, align: "left" | "center" = "left", bold = false, size: 1 | 2 = 1) =>
    rows.push({ kind: "text", text: toAscii(text), align, bold, size });
  const lr = (l: string, r: string, bold = false) => {
    const a = toAscii(l).slice(0, W - r.length - 1);
    t(a + " ".repeat(Math.max(1, W - a.length - r.length)) + r, "left", bold);
  };

  {
    let line = "";
    for (const w of toAscii(d.businessName).split(" ")) {
      if ((line + " " + w).trim().length > Math.floor(W / 2)) {
        if (line) t(line, "center", true, 2);
        line = w;
      } else line = (line + " " + w).trim();
    }
    if (line) t(line, "center", true, 2);
  }
  t("CREDIT STATEMENT", "center", true);
  rows.push({ kind: "rule", ch: "=" });
  t(`Customer: ${d.customerName}`);
  if (d.phone) t(`Phone: ${d.phone}`);
  t(d.periodLabel);
  rows.push({ kind: "rule", ch: "-" });
  if (d.openingBalance > 0) lr("Previous balance", money(d.openingBalance));

  for (const e of d.entries) {
    if (e.type === "CREDIT_SALE") {
      lr(day(e.createdAt), `+${money(e.amount)}`, true);
      const items = (e.items ?? []).map((i) => `${i.qty}x ${i.name}`).join(", ");
      if (items) {
        let line = "  ";
        for (const w of toAscii(items).split(" ")) {
          if ((line + w).length > W) {
            t(line);
            line = "  ";
          }
          line += w + " ";
        }
        if (line.trim()) t(line);
      }
    } else if (e.type === "PAYMENT") {
      lr(`${day(e.createdAt)} PAID`, `-${money(e.amount)}`, true);
      if (e.note) t(`  ${e.note}`);
    } else {
      lr(`${day(e.createdAt)} ADJ`, `-${money(e.amount)}`);
      if (e.note) t(`  ${e.note}`);
    }
  }
  rows.push({ kind: "rule", ch: "=" });
  const bal = `Rs ${money(d.balance)}`;
  const half = Math.floor(W / 2);
  t("DUE" + " ".repeat(Math.max(1, half - 3 - bal.length)) + bal, "left", true, 2);
  rows.push({ kind: "rule", ch: "-" });
  t(`Printed ${new Date().toLocaleString("en-IN")}`, "center");
  rows.push({ kind: "feed" }, { kind: "cut" });
  return rows;
}

/** Same statement as plain text for WhatsApp/SMS. */
export function buildStatementText(d: StatementData): string {
  const lines: string[] = [];
  lines.push(`*${d.businessName}* — Credit statement`);
  lines.push(`${d.customerName}${d.phone ? ` (${d.phone})` : ""}`);
  lines.push(d.periodLabel, "");
  if (d.openingBalance > 0) lines.push(`Previous balance: ₹${money(d.openingBalance)}`);
  for (const e of d.entries) {
    if (e.type === "CREDIT_SALE") {
      const items = (e.items ?? []).map((i) => `${i.qty}× ${i.name}`).join(", ");
      lines.push(`${day(e.createdAt)}: ₹${money(e.amount)}${items ? ` — ${items}` : ""}`);
    } else {
      lines.push(`${day(e.createdAt)}: ${e.type === "PAYMENT" ? "Paid" : "Adjusted"} −₹${money(e.amount)}${e.note ? ` (${e.note})` : ""}`);
    }
  }
  lines.push("", `*Balance due: ₹${money(d.balance)}*`);
  return lines.join("\n");
}
