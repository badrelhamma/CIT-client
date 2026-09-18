import { jsPDF } from "jspdf";
import autoTable, { type Styles } from "jspdf-autotable";
import { formatPk } from "./location";
import type { HistoryEvent } from "@/types";

export type PdfGroupMode = "date" | "axe" | "date-axe";

export interface HistoryPdfContext {
  typeLabel: (typeId: string) => string;
  statusLabel: (statusId: string) => string;
  colorHex: (colorId: string) => string;
  highwayLabel: (highwayId: string) => string;
}

const ADM_BLUE: [number, number, number] = [8, 43, 78];
const ADM_MID: [number, number, number] = [22, 120, 203];
const INK: [number, number, number] = [34, 40, 49];
const SOFT: [number, number, number] = [85, 95, 110];
const LINE: [number, number, number] = [219, 227, 238];
const GROUP_BG: [number, number, number] = [238, 245, 252];

const PAGE_H = 297;
const MARGIN = 14;
const BOTTOM = 20;

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const int = Number.parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/** Caractères non encodables en WinAnsi (emojis, flèches, symboles…) rendus par la police standard. */
const PDF_UNSUPPORTED_CHARS =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{20E3}\u{00A9}\u{00AE}\u{2122}\u{FE0F}\u{200D}\u{200B}]/gu;

function sanitizeMessage(text: string): string {
  return text
    .replace(PDF_UNSUPPORTED_CHARS, "")
    .replace(/\*+/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^\s+|\s+$/g, "");
}

function formatDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupEntries(
  entries: HistoryEvent[],
  mode: PdfGroupMode,
): { label: string; entries: HistoryEvent[] }[] {
  if (mode === "date") {
    const map = new Map<string, HistoryEvent[]>();
    for (const e of entries) {
      const key = formatDateKey(e.at);
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => {
        const da = new Date(a[1][0]?.at ?? 0).getTime();
        const db = new Date(b[1][0]?.at ?? 0).getTime();
        return db - da;
      })
      .map(([label, items]) => ({
        label,
        entries: items.sort((a, b) => b.at.localeCompare(a.at)),
      }));
  }

  if (mode === "axe") {
    const map = new Map<string, HistoryEvent[]>();
    for (const e of entries) {
      const arr = map.get(e.highway) ?? [];
      arr.push(e);
      map.set(e.highway, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([hwId, items]) => ({
        label: hwId,
        entries: items.sort((a, b) => b.at.localeCompare(a.at)),
      }));
  }

  const dateMap = new Map<string, Map<string, HistoryEvent[]>>();
  for (const e of entries) {
    const dateKey = formatDateKey(e.at);
    if (!dateMap.has(dateKey)) dateMap.set(dateKey, new Map());
    const axeMap = dateMap.get(dateKey)!;
    const arr = axeMap.get(e.highway) ?? [];
    arr.push(e);
    axeMap.set(e.highway, arr);
  }
  const result: { label: string; entries: HistoryEvent[] }[] = [];
  const sortedDates = Array.from(dateMap.entries()).sort((a, b) => {
    const da = new Date(a[1].values().next().value?.[0]?.at ?? 0).getTime();
    const db = new Date(b[1].values().next().value?.[0]?.at ?? 0).getTime();
    return db - da;
  });
  for (const [dateLabel, axeMap] of sortedDates) {
    const sortedAxes = Array.from(axeMap.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    for (const [hwId, items] of sortedAxes) {
      result.push({
        label: `${dateLabel} — ${hwId}`,
        entries: items.sort((a, b) => b.at.localeCompare(a.at)),
      });
    }
  }
  return result;
}

function renderReportHeader(doc: jsPDF): void {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...ADM_BLUE);
  doc.rect(0, 0, pageW, 24, "F");
  doc.setFillColor(...ADM_MID);
  doc.rect(0, 24, pageW, 1.2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("HISTORIQUE DES ÉVÉNEMENTS", MARGIN, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Exploitation du réseau autoroutier · ADM",
    MARGIN,
    17,
  );
  doc.text(
    `Généré le ${formatDateTime(new Date().toISOString())}`,
    pageW - MARGIN,
    11,
    { align: "right" },
  );
}

function renderGroupTitle(
  doc: jsPDF,
  y: number,
  label: string,
  count: number,
): number {
  doc.setFillColor(...GROUP_BG);
  doc.rect(MARGIN, y, doc.internal.pageSize.getWidth() - MARGIN * 2, 9, "F");
  doc.setTextColor(...ADM_BLUE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`${label}`, MARGIN + 3, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SOFT);
  doc.text(`(${count})`, doc.internal.pageSize.getWidth() - MARGIN - 3, y + 6, {
    align: "right",
  });
  return y + 11;
}

function renderGroup(
  doc: jsPDF,
  y: number,
  group: { label: string; entries: HistoryEvent[] },
  ctx: HistoryPdfContext,
  opts: { showAxe: boolean; showTime: boolean },
): number {
  if (group.entries.length === 0) return y;
  y = renderGroupTitle(doc, y, group.label, group.entries.length);

  const colCount = opts.showAxe ? 7 : 6;

  const head = ["", "Type", "PK", "Date", "Statut", "Réf."];
  if (opts.showAxe) head.splice(2, 0, "Axe");

  const columnStyles: Record<string, Partial<Styles>> = {
    0: { cellWidth: 9 },
    1: { fontStyle: "bold", fontSize: 8.5 },
    [opts.showAxe ? "2" : "1"]: { fontStyle: "bold", textColor: ADM_BLUE },
  };

  const body: unknown[][] = [];
  for (const e of group.entries) {
    const row = [
      { content: "", styles: { fillColor: hexToRgb(ctx.colorHex(e.color)) } },
      { content: ctx.typeLabel(e.typeId), styles: { fontStyle: "bold" } },
      { content: opts.showAxe ? ctx.highwayLabel(e.highway) : "—" },
      { content: formatPk(e.pk), styles: { fontStyle: "bold" } },
      {
        content: opts.showTime ? formatTime(e.at) : formatDateTime(e.at),
        styles: { textColor: SOFT },
      },
      {
        content:
          ctx.statusLabel(e.statusId) + (e.resolved ? " · Résolu" : ""),
      },
      { content: e.refCode, styles: { textColor: ADM_BLUE, fontStyle: "bold" } },
    ];
    if (!opts.showAxe) row.splice(2, 1);
    const message = e.replyTo
      ? `↳ réponse à ${e.replyTo}\n${sanitizeMessage(e.message)}`
      : sanitizeMessage(e.message);
    const msg = {
      content: message,
      colSpan: colCount,
      styles: {
        textColor: INK,
        fontSize: 7.5,
        fontStyle: "italic",
        cellPadding: { top: 2, bottom: 3, left: 3, right: 3 },
      },
    };
    body.push(row, [msg]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2, textColor: INK, lineColor: LINE, lineWidth: 0.2 },
    headStyles: { fillColor: ADM_BLUE, textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    columnStyles,
    head: [head],
    body: body as never[][],
    didDrawPage: () => undefined,
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;
}

export function exportHistoryPdf(
  entries: HistoryEvent[],
  mode: PdfGroupMode,
  ctx: HistoryPdfContext,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  renderReportHeader(doc);

  const groups = groupEntries(entries, mode);
  const showAxe = mode !== "axe";
  const showTime = mode !== "axe";

  let y = 34;

  for (const group of groups) {
    if (y > PAGE_H - BOTTOM - 20) {
      doc.addPage();
      y = 24;
    }
    y = renderGroup(doc, y, group, ctx, { showAxe, showTime });
    y += 7;
  }

  const pageW = doc.internal.pageSize.getWidth();
  y = PAGE_H - 12;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y - 6, pageW - MARGIN, y - 6);
  doc.setTextColor(...SOFT);
  doc.setFontSize(7.5);
  doc.text(
    `CIT · Historique des événements (${entries.length})`,
    pageW / 2,
    y,
    { align: "center" },
  );

  doc.save(`historique-${mode}.pdf`);
}