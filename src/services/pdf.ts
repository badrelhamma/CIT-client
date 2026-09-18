import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface BilanPdfInput {
  refCode: string;
  at: string;
  highwayId: string;
  highwayName: string;
  pk: string;
  direction: string;
  colorLabel: string;
  colorHex: string;
  admMessage: string;
  bilanMessage: string;
  typeLabel: string;
  lanes: string[];
  impacts: string[];
  damages: string[];
  actors: string[];
  statusLabel: string;
  victimesLabel?: string | null;
}

const ADM_BLUE: [number, number, number] = [8, 43, 78];
const ADM_MID: [number, number, number] = [22, 120, 203];
const INK: [number, number, number] = [34, 40, 49];
const SOFT: [number, number, number] = [85, 95, 110];
const LINE: [number, number, number] = [219, 227, 238];

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const int = Number.parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function exportBilanPdf(input: BilanPdfInput): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFillColor(...ADM_BLUE);
  doc.rect(0, 0, pageW, 26, "F");
  doc.setFillColor(...ADM_MID);
  doc.rect(0, 26, pageW, 1.2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("BILAN D'ÉVÉNEMENT", margin, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Exploitation du réseau autoroutier · ADM", margin, 17);
  doc.text(`Réf. ${input.refCode}`, pageW - margin, 11, { align: "right" });
  doc.text(fmtDate(input.at), pageW - margin, 17, { align: "right" });

  let y = 36;

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Localisation de l'événement", margin, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2.2, textColor: INK, lineColor: LINE },
    headStyles: { fillColor: ADM_BLUE, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 34, fontStyle: "bold", textColor: SOFT },
    },
    head: [["Paramètre", "Valeur"]],
    body: [
      ["Axe", `${input.highwayId} · ${input.highwayName}`],
      ["PK", input.pk],
      ["Sens", input.direction],
      ["Couleur", input.colorLabel],
    ],
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 6;

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Détails du bilan", margin, y);
  y += 2;

  const details = [
    ["Type de bilan", input.typeLabel],
    ["Voies concernées", input.lanes.length ? input.lanes.join(", ") : "—"],
    ["Impact circulation", input.impacts.length ? input.impacts.join(", ") : "—"],
    ["Dégâts", input.damages.length ? input.damages.join(", ") : "—"],
    ["Bilan provisoire", input.victimesLabel ?? "—"],
    ["Intervenants", input.actors.length ? input.actors.join(", ") : "—"],
    ["Statut", input.statusLabel],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2.2, textColor: INK, lineColor: LINE },
    headStyles: { fillColor: ADM_BLUE, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 34, fontStyle: "bold", textColor: SOFT },
    },
    head: [["Paramètre", "Valeur"]],
    body: details,
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 8;

  doc.setTextColor(...SOFT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("COULEUR DE L'ÉVÉNEMENT", margin, y);
  y += 5;
  const colorBarW = 40;
  const colorBarH = 5;
  doc.setFillColor(...hexToRgb(input.colorHex));
  doc.roundedRect(margin, y, colorBarW, colorBarH, 1, 1, "F");

  y += colorBarH + 8;

  doc.setTextColor(...SOFT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("MESSAGE ADM (ÉVÉNEMENT INITIAL)", margin, y);
  y += 2;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const admLines = doc.splitTextToSize(input.admMessage, pageW - margin * 2);
  doc.text(admLines, margin, y + 4);
  y += admLines.length * 4.2 + 6;

  doc.setTextColor(...SOFT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("MESSAGE BILAN", margin, y);
  y += 2;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const bilLines = doc.splitTextToSize(input.bilanMessage, pageW - margin * 2);
  doc.text(bilLines, margin, y + 4);
  y += bilLines.length * 4.2 + 8;

  if (y > 255) doc.addPage();

  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(margin, 282, pageW - margin, 282);
  doc.setTextColor(...SOFT);
  doc.setFontSize(7.5);
  doc.text(
    `Document généré automatiquement · CIT · ${fmtDate(new Date().toISOString())}`,
    pageW / 2,
    287,
    { align: "center" },
  );

  doc.save(`bilan-${input.refCode}.pdf`);
}