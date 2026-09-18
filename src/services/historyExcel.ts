import { formatPk } from "./location";
import { resolveBilan } from "./bilanParse";
import type { BilanTypeDef, HistoryEvent } from "@/types";

export interface HistoryExcelContext {
  typeLabel: (typeId: string) => string;
  colorLabel: (colorId: string) => string;
  colorHex: (colorId: string) => string;
  highwayLabel: (highwayId: string) => string;
  sourceLabel: (event: HistoryEvent) => string;
  bilanTemplates: BilanTypeDef[];
}

type EventState = "En cours" | "Résolu" | "Retour à la normale";

const ADM_BLUE = "FF082B4E";
const WHITE = "FFFFFFFF";
const INK = "FF222831";
const LINE = "FFD9E0EC";

const STATE_STYLE: Record<EventState, { fill: string; text: string }> = {
  "En cours": { fill: "FFFDE7C7", text: "FF8A5A00" },
  Résolu: { fill: "FFDDEBFA", text: "FF1E5A96" },
  "Retour à la normale": { fill: "FFDDF3E4", text: "FF1E7A45" },
};

function eventState(e: HistoryEvent): EventState {
  if (e.statusId === "cloture") return "Retour à la normale";
  if (e.resolved) return "Résolu";
  return "En cours";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatImpact(impact: string, meters: number | null): string {
  if (!impact) return "";
  if (meters && meters > 0 && !/\d\s*m\b/i.test(impact)) {
    return `${impact} · ${meters} m`;
  }
  return impact;
}

function toArgb(hex: string): string {
  const value = hex.replace("#", "").trim();
  if (value.length === 6) return `FF${value.toUpperCase()}`;
  if (value.length === 8) return value.toUpperCase();
  return ADM_BLUE;
}

/** Couleur de texte lisible selon la luminance du fond. */
function textColorFor(hex: string): string {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return WHITE;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? INK : WHITE;
}

export async function exportHistoryExcel(
  entries: HistoryEvent[],
  ctx: HistoryExcelContext,
): Promise<void> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CIT — Historique des événements";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Historique", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Date", key: "date", width: 18 },
    { header: "Couleur", key: "color", width: 12 },
    { header: "Type", key: "type", width: 28 },
    { header: "Axe", key: "highway", width: 24 },
    { header: "Sens", key: "direction", width: 20 },
    { header: "PK", key: "pk", width: 12 },
    { header: "État", key: "state", width: 22 },
    { header: "Détection", key: "source", width: 22 },
    { header: "Véhicules", key: "vehicles", width: 16 },
    { header: "Voie impactée", key: "lane", width: 22 },
    { header: "Impact sur la circulation", key: "impact", width: 26 },
    { header: "Dégâts", key: "damages", width: 24 },
    { header: "BL", key: "bl", width: 6 },
    { header: "BG", key: "bg", width: 6 },
    { header: "TUE", key: "tues", width: 6 },
    { header: "Réf.", key: "ref", width: 14 },
    { header: "Message", key: "message", width: 50 },
    { header: "Message Bilan", key: "bilanMessage", width: 60 },
  ];

  const header = sheet.getRow(1);
  header.height = 24;
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ADM_BLUE } };
    cell.font = { bold: true, color: { argb: WHITE }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF1678CB" } },
    };
  });

  const centeredColumns = [2, 6, 7, 13, 14, 15];

  for (const e of entries) {
    const state = eventState(e);
    const bilan = resolveBilan(e, ctx.bilanTemplates);
    const colorHex = ctx.colorHex(e.color);
    const colorArgb = toArgb(colorHex);
    const stateStyle = STATE_STYLE[state];

    const messages = [e.message, ...(e.replies ?? []).map((r) => r.message)]
      .filter(Boolean)
      .join("\n");

    const row = sheet.addRow({
      date: formatDate(e.at),
      color: ctx.colorLabel(e.color),
      type: bilan.label || ctx.typeLabel(e.typeId),
      highway: ctx.highwayLabel(e.highway),
      direction: e.direction,
      pk: formatPk(e.pk),
      state,
      source: ctx.sourceLabel(e),
      vehicles: bilan.vehicles,
      lane: bilan.lane,
      impact: formatImpact(bilan.impact, bilan.trafficJamMeters),
      damages: bilan.damages,
      bl: bilan.hasVictimes ? bilan.bl : "",
      bg: bilan.hasVictimes ? bilan.bg : "",
      tues: bilan.hasVictimes ? bilan.tues : "",
      ref: e.refCode,
      message: e.message,
      bilanMessage: messages,
    });
    row.height = 18;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.alignment = {
        vertical: "middle",
        horizontal: centeredColumns.includes(colNumber) ? "center" : "left",
        wrapText: colNumber === 17 || colNumber === 18,
      };
      cell.border = { bottom: { style: "hair", color: { argb: LINE } } };
      cell.font = { ...(cell.font ?? {}), color: { argb: INK } };
    });

    const colorCell = row.getCell(2);
    colorCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colorArgb } };
    colorCell.font = { bold: true, color: { argb: textColorFor(colorHex) }, size: 11 };

    const stateCell = row.getCell(7);
    stateCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: stateStyle.fill } };
    stateCell.font = { bold: true, color: { argb: stateStyle.text }, size: 11 };

    row.getCell(16).font = { bold: true, color: { argb: ADM_BLUE }, size: 11 };
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columns.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as unknown as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "historique.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}
