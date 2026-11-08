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
  const value = (hex || "#000000").replace("#", "");
  const int = Number.parseInt(value, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "—";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function exportBilanPdf(input: BilanPdfInput): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const generatedAt = fmtDate(new Date().toISOString());

  doc.setFillColor(...ADM_BLUE);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setFillColor(...ADM_MID);
  doc.rect(0, 28, pageW, 1.2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("BILAN D'ÉVÉNEMENT", margin, 11.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Exploitation du réseau autoroutier · ADM", margin, 17);
  doc.text(`Généré le ${generatedAt}`, margin, 22.5);
  doc.text(`Réf. ${input.refCode ?? "SANS-REF"}`, pageW - margin, 11.5, { align: "right" });
  doc.text(fmtDate(input.at), pageW - margin, 17, { align: "right" });

  let y = 38;

  function section(title: string) {
    y += 5;
    doc.setFillColor(...ADM_BLUE);
    doc.rect(margin, y, pageW - 2 * margin, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title.toUpperCase(), margin + 3, y + 5.4);
    y += 11;
  }

  function ensureSpace(need: number) {
    if (y + need > pageH - 30) {
      doc.addPage();
      y = 18;
    }
  }

  section("Localisation de l'événement");

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2, textColor: INK, lineColor: LINE },
    headStyles: { fillColor: ADM_BLUE, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 44, fontStyle: "bold", textColor: SOFT },
    },
    head: [["Paramètre", "Valeur"]],
    body: [
      ["Axe", `${input.highwayId ?? "—"}${input.highwayName ? ` · ${input.highwayName}` : ""}`],
      ["PK", input.pk ?? "—"],
      ["Sens", input.direction ?? "—"],
      ["Couleur", input.colorLabel ?? "—"],
    ],
  });

  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 6;
  ensureSpace(14);

  section("Détails du bilan");

  const details = [
    ["Type de bilan", input.typeLabel ?? "—"],
    ["Voies concernées", input.lanes.length ? input.lanes.join(", ") : "—"],
    ["Impact circulation", input.impacts.length ? input.impacts.join(", ") : "—"],
    ["Dégâts", input.damages.length ? input.damages.join(", ") : "—"],
    ["Bilan provisoire", input.victimesLabel ?? "—"],
    ["Intervenants", input.actors.length ? input.actors.join(", ") : "—"],
    ["Statut", input.statusLabel ?? "—"],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2, textColor: INK, lineColor: LINE },
    headStyles: { fillColor: ADM_BLUE, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 44, fontStyle: "bold", textColor: SOFT },
    },
    head: [["Paramètre", "Valeur"]],
    body: details,
  });

  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 8;
  ensureSpace(24);

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
  ensureSpace(30);

  doc.setTextColor(...SOFT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("MESSAGE ADM (ÉVÉNEMENT INITIAL)", margin, y);
  y += 2;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const admLines = doc.splitTextToSize(
    input.admMessage || "—",
    pageW - margin * 2,
  );
  doc.text(admLines, margin, y + 4);
  y += admLines.length * 4.2 + 8;
  ensureSpace(30);

  doc.setTextColor(...SOFT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("MESSAGE BILAN", margin, y);
  y += 2;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const bilLines = doc.splitTextToSize(
    input.bilanMessage || "—",
    pageW - margin * 2,
  );
  doc.text(bilLines, margin, y + 4);
  y += bilLines.length * 4.2 + 8;

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 16, pageW - margin, pageH - 16);
    doc.setTextColor(...SOFT);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Confidentiel — Usage interne CIT · ADM", margin, pageH - 11.5);
    doc.text(`Généré le ${generatedAt}`, pageW / 2, pageH - 11.5, {
      align: "center",
    });
    doc.text(`Page ${i} / ${total}`, pageW - margin, pageH - 11.5, {
      align: "right",
    });
  }

  doc.save(`bilan-${(input.refCode ?? "sans-ref").replace(/[^A-Za-z0-9._-]+/g, "_")}.pdf`);
}
