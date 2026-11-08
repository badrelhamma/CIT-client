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

const NAV: [number, number, number] = [18, 59, 89];
const BLUE: [number, number, number] = [22, 113, 163];
const INK: [number, number, number] = [23, 33, 43];
const SOFT: [number, number, number] = [102, 120, 137];
const LINE: [number, number, number] = [213, 224, 232];

const or = (v: string, fallback = "—") =>
  v && String(v).trim() ? String(v).trim() : fallback;

export async function exportCompteRenduPdf(r: CompteRenduExport): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const right = pageW - margin;
  const generatedAt = new Date().toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.setFillColor(...NAV);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setFillColor(...BLUE);
  doc.rect(0, 28, pageW, 1.2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("COMPTE RENDU DE POSTE DES MANAGERS", margin, 11.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Centre Info Trafic — CIT", margin, 17);
  doc.text(`Généré le ${generatedAt}`, margin, 22.5);
  doc.setFontSize(9);
  doc.text(`Date : ${or(r.date)}`, right, 11.5, { align: "right" });
  doc.text(`Poste : ${or(r.poste)}`, right, 17, { align: "right" });

  let y = 36;

  function section(title: string) {
    y += 5;
    doc.setFillColor(...NAV);
    doc.rect(margin, y, pageW - 2 * margin, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title, margin + 3, y + 5.4);
    y += 11;
  }

  function kvTable(rows: [string, string][]) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: { fontSize: 8.5, cellPadding: 2, textColor: INK, lineColor: LINE },
      headStyles: { fillColor: NAV, textColor: 255, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 48, fontStyle: "bold", textColor: SOFT } },
      head: [["Rubrique", "Contenu"]],
      body: rows.map(([k, v]) => [k, v]),
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 4;
    if (y > pageH - 30) {
      doc.addPage();
      y = 18;
    }
  }

  section("1. Ouverture du poste");
  kvTable([
    ["Date", or(r.date)],
    ["Poste", or(r.poste)],
    ["Heure début de poste", or(r.heureDebut)],
    ["Heure fin de poste", or(r.heureFin)],
    ["Manager sortant", or(r.sortant)],
    ["Manager entrant", or(r.entrant)],
    ["Situation trafic", or(r.trafic)],
    ["Météo", or(r.meteo)],
  ]);

  section("2. Événements et accidents");
  kvTable([
    ["Accidents", or(r.accidents, "0")],
    ["Bouchons / Ralentissements", or(r.bouchons, "0")],
    ["Incendies", or(r.incendies, "0")],
    ["Autres événements", or(r.autres, "0")],
    ["Détails des événements importants", or(r.details)],
    ["Messages PMV publiés", or(r.pmv, "0")],
    ["Tickets créés", or(r.tickets, "0")],
    ["Accidents validés", or(r.valides, "0")],
    ["Accidents dévalidés", or(r.devalides, "0")],
  ]);

  section("3. Passation des équipements du CIT");
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2, textColor: INK, lineColor: LINE },
    headStyles: { fillColor: NAV, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 62, fontStyle: "bold", textColor: SOFT },
      1: { cellWidth: 30, halign: "center" },
    },
    head: [["Équipement", "État", "Observation / anomalie"]],
    body: (r.equipements.length
      ? r.equipements
      : [{ label: "", statut: "", obs: "" }]
    ).map((e) => [or(e.label), or(e.statut), or(e.obs)]),
  });
  y =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 4;
  if (y > pageH - 30) {
    doc.addPage();
    y = 18;
  }

  section("4. Reporting et consignes");
  kvTable([
    ["Reporting transmis", or(r.reporting)],
    ["Points sensibles à surveiller", or(r.sensibles)],
    ["Consignes pour le prochain poste", or(r.consignes)],
    ["Difficultés / actions proposées", or(r.difficultes)],
    ["Signé par", or(r.signature)],
  ]);

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 16, right, pageH - 16);
    doc.setTextColor(...SOFT);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Confidentiel — Usage interne CIT · ADM", margin, pageH - 11.5);
    doc.text(`Généré le ${generatedAt}`, pageW / 2, pageH - 11.5, {
      align: "center",
    });
    doc.text(`Page ${i} / ${total}`, right, pageH - 11.5, { align: "right" });
  }

  const safe = (r.date || "sans-date").replace(/[^0-9-]/g, "");
  const manager = (r.signature || r.sortant || "Manager")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_");
  doc.save(`CR-${manager}-${safe}.pdf`);
}
