export interface CompteRenduEquip {
  label: string;
  statut: string;
  obs: string;
}

export interface CompteRenduExport {
  date: string;
  poste: string;
  heureDebut: string;
  heureFin: string;
  sortant: string;
  entrant: string;
  trafic: string;
  meteo: string;
  accidents: string;
  bouchons: string;
  incendies: string;
  autres: string;
  details: string;
  pmv: string;
  tickets: string;
  valides: string;
  devalides: string;
  equipements: CompteRenduEquip[];
  reporting: string;
  sensibles: string;
  consignes: string;
  difficultes: string;
  signature: string;
}

const NAV: [number, number, number] = [15, 23, 42];
const ROSE: [number, number, number] = [225, 29, 72];
const INK: [number, number, number] = [15, 23, 42];
const SOFT: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];
const GREEN: [number, number, number] = [22, 163, 74];
const AMBER: [number, number, number] = [234, 88, 12];
const RED: [number, number, number] = [220, 38, 38];
const REDBG: [number, number, number] = [254, 242, 242];

const or = (v: string | undefined | null, fallback = "—") =>
  v && String(v).trim() ? String(v).trim() : fallback;

function statutColor(statut: string): [number, number, number] {
  const s = (statut ?? "").trim().toLowerCase();
  if (s === "normale") return GREEN;
  if (s === "perturbé" || s === "perturbe" || s === "anomalie") return AMBER;
  if (s === "hors service") return RED;
  return SOFT;
}

export async function exportCompteRenduPdf(r: CompteRenduExport): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const right = pageW - margin;
  const generatedAt = new Date().toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.setFillColor(...NAV);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setFillColor(...ROSE);
  doc.rect(0, 22, pageW, 1.4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text("COMPTE RENDU DE POSTE DES MANAGERS", margin, 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text("Centre Info Trafic — CIT | Autoroutes du Maroc", margin, 14);
  doc.setFontSize(6.5);
  doc.text(`Date : ${or(r.date)}  ·  Généré le ${generatedAt}  ·  Poste : ${or(r.poste)}`, right, 9, { align: "right" });
  doc.text("Confidentiel — Usage interne CIT ADM", right, 14, { align: "right" });

  let y = 27;

  function section(title: string) {
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text(title.toUpperCase(), margin, y);
    y += 2.5;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(margin, y, right, y);
    y += 3.5;
  }

  function kpis() {
    const boxes: [string, string][] = [
      ["ACCIDENTS", or(r.accidents, "0")],
      ["BOUCHONS", or(r.bouchons, "0")],
      ["INCENDIES", or(r.incendies, "0")],
      ["PMV", or(r.pmv, "0")],
      ["TICKETS", or(r.tickets, "0")],
      ["AUTRES", or(r.autres, "0")],
    ];
    const totalW = pageW - margin * 2;
    const gap = 2;
    const w = (totalW - gap * (boxes.length - 1)) / boxes.length;
    const h = 14;
    boxes.forEach(([label, value], i) => {
      const x = margin + i * (w + gap);
      const n = Number(value) || 0;
      const isAlert = n > 0 && ["ACCIDENTS", "BOUCHONS", "INCENDIES"].includes(label);
      doc.setFillColor(isAlert ? REDBG[0] : 248, isAlert ? REDBG[1] : 250, isAlert ? REDBG[2] : 252);
      doc.setDrawColor(isAlert ? 254 : LINE[0], isAlert ? 202 : LINE[1], isAlert ? 202 : LINE[2]);
      doc.roundedRect(x, y, w, h, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(isAlert ? 153 : 15, isAlert ? 27 : 23, isAlert ? 27 : 42);
      doc.text(value, x + w / 2, y + 6.5, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(...SOFT);
      doc.text(label, x + w / 2, y + 11, { align: "center" });
    });
    y += h + 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...SOFT);
    const line1 = `Validés : ${or(r.valides, "0")}  ·  Dévalidés : ${or(r.devalides, "0")}  ·  Faits marquants : ${or(r.details)}`;
    const lines = doc.splitTextToSize(line1, totalW);
    doc.text(lines, margin, y + 2);
    y += lines.length * 3.4 + 3;
  }

  section("1 · Ouverture de poste & relève");
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 1.6, textColor: INK, lineColor: LINE, overflow: "linebreak" },
    headStyles: { fillColor: NAV, textColor: 255, fontStyle: "bold", fontSize: 6.5 },
    columnStyles: { 0: { cellWidth: 42, fontStyle: "bold", textColor: SOFT } },
    head: [["Rubrique", "Détail"]],
    body: [
      ["Heure début / fin", `${or(r.heureDebut)} → ${or(r.heureFin)}`],
      ["Manager sortant / entrant", `${or(r.sortant)}  →  ${or(r.entrant)}`],
      ["Situation trafic / météo", `${or(r.trafic)}  ·  ${or(r.meteo)}`],
      ["Date / poste", `${or(r.date)}  ·  ${or(r.poste)}`],
    ],
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 1;

  section("2 · Chiffres clés & événements");
  kpis();

  section("3 · Passation & état des équipements du CIT");
  const eqRows = (r.equipements?.length ? r.equipements : []).map((e) => {
    return [
      or(e.label),
      `${or(e.statut)}${e.obs ? ` — ${or(e.obs)}` : ""}`,
    ] as [string, string];
  });
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 6.8, cellPadding: 1.4, textColor: INK, lineColor: LINE, overflow: "linebreak" },
    headStyles: { fillColor: NAV, textColor: 255, fontStyle: "bold", fontSize: 6.5 },
    columnStyles: {
      0: { cellWidth: 78, fontStyle: "bold", textColor: INK },
      1: {},
    },
    head: [["Équipement", "Statut / Observation"]],
    body: eqRows,
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 1) {
        const eq = r.equipements[data.row.index];
        if (eq) {
          (data.cell.styles as { textColor: [number, number, number]; fontStyle: string }).textColor =
            statutColor(eq.statut);
          (data.cell.styles as { fontStyle: string }).fontStyle = "bold";
        }
      }
    },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 1;

  section("4 · Consignes, reporting & validation");
  const colW = (pageW - margin * 2 - 2) / 2;
  const boxH = 20;
  doc.setDrawColor(...LINE);
  doc.roundedRect(margin, y, colW, boxH, 1.5, 1.5, "S");
  doc.roundedRect(margin + colW + 2, y, colW, boxH, 1.5, 1.5, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...SOFT);
  doc.text("SENSIBLES & CONSIGNES", margin + 2, y + 4);
  doc.text("DIFFICULTÉS & REPORTING", margin + colW + 4, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...INK);
  const leftText = `Sensibles : ${or(r.sensibles)} | Consignes : ${or(r.consignes)}`;
  const rightText = `Difficultés : ${or(r.difficultes)} | Reporting : ${or(r.reporting)}`;
  doc.text(doc.splitTextToSize(leftText, colW - 4), margin + 2, y + 7.5);
  doc.text(doc.splitTextToSize(rightText, colW - 4), margin + colW + 4, y + 7.5);
  y += boxH + 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text(
    `Signé électroniquement par : ${or(r.signature)} — ${or(r.date)} · ${or(r.heureDebut)} → ${or(r.heureFin)}`,
    right,
    y,
    { align: "right" },
  );
  y += 5;

  if (y > pageH - 26) {
    doc.addPage();
    y = 18;
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 16, right, pageH - 16);
    doc.setTextColor(...SOFT);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text("Confidentiel — Usage interne CIT ADM", pageW / 2, pageH - 8, {
      align: "center",
    });
    doc.text(`Page ${i} / ${total}`, right, pageH - 8, { align: "right" });
  }

  const safe = (r.date || "sans-date").replace(/[^0-9-]/g, "");
  const manager = (r.signature || r.sortant || "Manager")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_");
  doc.save(`CR-${manager}-${safe}.pdf`);
}
