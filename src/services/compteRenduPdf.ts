import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

const or = (v: string, fallback = "—") => (v && v.trim() ? v.trim() : fallback);

export function exportCompteRenduPdf(r: CompteRenduExport): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const right = pageW - margin;

  doc.setFillColor(...NAV);
  doc.rect(0, 0, pageW, 26, "F");
  doc.setFillColor(...BLUE);
  doc.rect(0, 26, pageW, 1.2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("COMPTE RENDU DE POSTE DES MANAGERS", margin, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("Centre Info Trafic — CIT", margin, 18);
  doc.setFontSize(9);
  doc.text(`Date : ${or(r.date)}`, right, 12, { align: "right" });
  doc.text(`Poste : ${or(r.poste)}`, right, 18, { align: "right" });

  let y = 34;

  function section(title: string) {
    y += 6;
    doc.setFillColor(...NAV);
    doc.rect(margin, y, pageW - 2 * margin, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(title, margin + 3, y + 5.6);
    y += 12;
  }

  function kvTable(rows: [string, string][]) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.2, textColor: INK, lineColor: LINE },
      headStyles: { fillColor: NAV, textColor: 255, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 48, fontStyle: "bold", textColor: SOFT } },
      head: [["Rubrique", "Contenu"]],
      body: rows.map(([k, v]) => [k, v]),
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 4;
    if (y > 250) {
      doc.addPage();
      y = 20;
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
    styles: { fontSize: 9, cellPadding: 2.2, textColor: INK, lineColor: LINE },
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
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 4;
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  section("4. Reporting et consignes");
  kvTable([
    ["Reporting transmis", or(r.reporting)],
    ["Points sensibles à surveiller", or(r.sensibles)],
    ["Consignes pour le prochain poste", or(r.consignes)],
    ["Difficultés / actions proposées", or(r.difficultes)],
    ["Signé par", or(r.signature)],
  ]);

  if (y > 265) {
    doc.addPage();
    y = 20;
  }

  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(margin, 282, right, 282);
  doc.setTextColor(...SOFT);
  doc.setFontSize(7.5);
  doc.text(
    "Document généré automatiquement · CIT · Compte rendu",
    pageW / 2,
    287,
    { align: "center" },
  );

  const safe = (r.date || "sans-date").replace(/[^0-9-]/g, "");
  const manager = (r.signature || r.sortant || "Manager")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_");
  doc.save(`CR-${manager}-${safe}.pdf`);
}