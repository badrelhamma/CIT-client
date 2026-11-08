export interface EventReportTimelineItem {
  at: string;
  kind?: "alerte" | "action" | "moyen" | "message" | "autre";
  label: string;
  message: string;
  author?: string;
}

export interface EventReportBilan {
  label?: string;
  vehicles?: string;
  lanes?: string;
  impacts?: string;
  damages?: string;
  actors?: string;
  victimes?: string;
}

export interface EventReportInput {
  refCode: string;
  at: string;
  status: "encours" | "resolu" | "cloture" | string;
  statusLabel?: string;
  highwayId: string;
  highwayName?: string;
  pk: string;
  direction: string;
  troncon?: string;
  location?: string;
  detection?: string[];
  typeLabel?: string;
  colorLabel?: string;
  colorHex?: string;
  timeline: EventReportTimelineItem[];
  bilan?: EventReportBilan;
  admMessage?: string;
}

const NAV: [number, number, number] = [8, 43, 78];
const MID: [number, number, number] = [22, 120, 203];
const INK: [number, number, number] = [34, 40, 49];
const SOFT: [number, number, number] = [85, 95, 110];
const LINE: [number, number, number] = [219, 227, 238];
const OK: [number, number, number] = [30, 122, 69];
const WARN: [number, number, number] = [184, 96, 0];
const CLOSED: [number, number, number] = [13, 148, 136];

const or = (v: string | undefined | null, fallback = "—") =>
  v && String(v).trim() ? String(v).trim() : fallback;

function statusStyle(
  status: string,
): { label: string; bg: [number, number, number] } {
  const s = (status ?? "").toLowerCase();
  if (s === "cloture" || s === "retour à la normale")
    return { label: "Clôture", bg: CLOSED };
  if (s === "resolu" || s === "résolu")
    return { label: "Résolu", bg: OK };
  return { label: "En cours", bg: WARN };
}

function fmtDateTime(iso: string): string {
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

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "—";
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function kindLabel(kind?: string): string {
  switch ((kind ?? "").toLowerCase()) {
    case "alerte":
      return "Alerte";
    case "action":
      return "Action";
    case "moyen":
      return "Moyen mobilisé";
    case "message":
      return "Diffusion";
    default:
      return "Étape";
  }
}

/**
 * Génère un compte rendu d'événement autoroutier A4 professionnel.
 * Import dynamique de jsPDF : non chargé dans le bundle initial.
 */
export async function exportEventReportPdf(
  input: EventReportInput,
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const right = pageW - margin;
  const generatedAt = fmtDateTime(new Date().toISOString());
  const st = statusStyle(input.status);
  const statusLabel = input.statusLabel ?? st.label;
  const statusBg = st.bg;

  doc.setFillColor(...NAV);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setFillColor(...MID);
  doc.rect(0, 28, pageW, 1.2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("COMPTE RENDU D'ÉVÉNEMENT", margin, 11.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Centre Info Trafic — Exploitation du réseau autoroutier · ADM", margin, 17);
  doc.text(`Réf. ${input.refCode ?? "SANS-REF"}`, margin, 22.5);

  doc.text(`Généré le ${generatedAt}`, right, 11.5, { align: "right" });
  doc.text(`Date événement : ${fmtDateTime(input.at)}`, right, 17, { align: "right" });

  const badgeW = 32;
  const badgeH = 6;
  const badgeX = right - badgeW;
  const badgeY = 19.5;
  doc.setFillColor(...statusBg);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(statusLabel.toUpperCase(), badgeX + badgeW / 2, badgeY + 4.2, {
    align: "center",
  });

  let y = 36;

  function section(title: string) {
    y += 5;
    doc.setFillColor(...NAV);
    doc.rect(margin, y, pageW - 2 * margin, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title.toUpperCase(), margin + 3, y + 5.4);
    y += 11;
  }

  function kv(rows: [string, string][]) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 2, textColor: INK, lineColor: LINE },
      headStyles: { fillColor: NAV, textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 44, fontStyle: "bold", textColor: SOFT },
        1: {},
      },
      head: [["Rubrique", "Détail"]],
      body: rows,
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 4;
    if (y > pageH - 30) {
      doc.addPage();
      y = 18;
    }
  }

  section("1 · Informations clés");
  const detection =
    input.detection && input.detection.length
      ? input.detection.join(", ")
      : "—";
  kv([
    ["Axe autoroutier", `${or(input.highwayId)}${input.highwayName ? ` · ${input.highwayName}` : ""}`],
    ["Point kilométrique", or(input.pk)],
    ["Sens / Direction", or(input.direction)],
    ["Tronçon / Localisation", or(input.location ?? input.troncon)],
    ["Type d'événement", or(input.typeLabel)],
    ["Détection", detection],
    ["Criticité / Couleur", or(input.colorLabel)],
    ["Statut", `${statusLabel}${input.refCode ? ` · Réf. ${input.refCode}` : ""}`],
  ]);

  if (input.bilan && (input.bilan.label || input.bilan.vehicles)) {
    section("2 · Bilan");
    kv([
      ["Type de bilan", or(input.bilan.label)],
      ["Véhicules", or(input.bilan.vehicles)],
      ["Voies", or(input.bilan.lanes)],
      ["Impact circulation", or(input.bilan.impacts)],
      ["Dégâts", or(input.bilan.damages)],
      ["Intervenants / Moyens", or(input.bilan.actors)],
      ["Bilan victimes", or(input.bilan.victimes)],
    ]);
  }

  section("3 · Chronologie & actions");
  const timeline = [...(input.timeline ?? [])].sort((a, b) =>
    a.at.localeCompare(b.at),
  );
  const rows = timeline.length
    ? timeline.map(
        (t) =>
          [
            fmtTime(t.at),
            kindLabel(t.kind),
            `${or(t.label)}${t.author ? ` — ${t.author}` : ""}`,
            or(t.message),
          ] as [string, string, string, string],
      )
    : [
        ["—", "—", "Aucune étape enregistrée", "—"] as [
          string,
          string,
          string,
          string,
        ],
      ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2, textColor: INK, lineColor: LINE },
    headStyles: { fillColor: NAV, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: "bold", textColor: SOFT },
      1: { cellWidth: 30, fontStyle: "bold", textColor: SOFT },
      2: { cellWidth: 48, fontStyle: "bold" },
      3: {},
    },
    head: [["Heure", "Type", "Étape / Intervenant", "Message"]],
    body: rows as unknown as never[][],
  });
  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 4;
  if (y > pageH - 30) {
    doc.addPage();
    y = 18;
  }

  if (input.admMessage) {
    section("4 · Message diffusé (ADM)");
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(input.admMessage, pageW - margin * 2);
    doc.text(lines, margin, y + 3);
    y += lines.length * 4.2 + 8;
    if (y > pageH - 30) {
      doc.addPage();
      y = 18;
    }
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 16, right, pageH - 16);
    doc.setTextColor(...SOFT);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Confidentiel — Usage interne CIT · ADM", margin, pageH - 11.5);
    doc.text(`Généré le ${generatedAt}`, pageW / 2, pageH - 11.5, {
      align: "center",
    });
    doc.text(`Page ${i} / ${total}`, right, pageH - 11.5, { align: "right" });
  }

  doc.save(
    `CR-event-${(input.refCode ?? "sans-ref").replace(/[^A-Za-z0-9._-]+/g, "_")}.pdf`,
  );
}
