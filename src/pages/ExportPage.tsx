import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import pdfMake from "pdfmake/build/pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";

// ✅ FIX robusto: compatibilità Vite/ESM
const vfs =
  (vfsFonts as any)?.pdfMake?.vfs ||
  (vfsFonts as any)?.vfs ||
  (vfsFonts as any);

(pdfMake as any).vfs = vfs;

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

async function fetchLogoDataUrl(): Promise<string> {
  const res = await fetch("/logo.png");
  const blob = await res.blob();
  return await new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(blob);
  });
}

export default function ExportPage() {
  const [date, setDate] = useState(todayISO());
  const [active, setActive] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const r = await apiGet<any[]>(`/api/day/active?date=${encodeURIComponent(date)}`);
      setActive(r);
    })();
  }, [date]);

  async function buildPDFPresenze() {
    const logo = await fetchLogoDataUrl();

    const presMap: Record<string, number> = {};

    for (const c of active) {
      const sheet = await apiGet<any>(
        `/api/day/sheet?date=${encodeURIComponent(date)}&cantiere_code=${encodeURIComponent(c.cantiere_code)}`
      );
      const rows = sheet.payload?.rows ?? [];
      for (const r of rows) {
        if (r.type !== "DIP") continue;
        const key = r.desc || r.code || "SENZA_NOME";
        presMap[key] = (presMap[key] ?? 0) + (Number(r.ordinario) || 0);
      }
    }

    const body = [
      [{ text: "Operaio", bold: true }, { text: "Giornate (Ordinario)", bold: true }],
      ...Object.entries(presMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => [k, v.toFixed(2)]),
    ];

    const doc: any = {
      content: [
        { image: logo, width: 120 },
        { text: "Presenze per Operaio", style: "h1" },
        { text: `Data: ${date}\n\n` },
        {
          table: { headerRows: 1, widths: ["*", 140], body },
          layout: "lightHorizontalLines",
        },
      ],
      styles: {
        h1: { fontSize: 18, bold: true, margin: [0, 10, 0, 10] },
      },
      defaultStyle: { fontSize: 10 },
    };

    (pdfMake as any).createPdf(doc).download(`presenze_${date}.pdf`);
  }

  async function buildPDFCantiere() {
    const logo = await fetchLogoDataUrl();

    const body: any[] = [
      [{ text: "Cantiere", bold: true }, { text: "Totale Ordinario", bold: true }],
    ];

    for (const c of active) {
      const sheet = await apiGet<any>(
        `/api/day/sheet?date=${encodeURIComponent(date)}&cantiere_code=${encodeURIComponent(c.cantiere_code)}`
      );
      const rows = sheet.payload?.rows ?? [];
      let sum = 0;
      for (const r of rows) sum += Number(r.ordinario) || 0;
      body.push([`${c.cantiere_code} - ${c.cantiere_desc}`, sum.toFixed(2)]);
    }

    const doc: any = {
      content: [
        { image: logo, width: 120 },
        { text: "Report Cantieri", style: "h1" },
        { text: `Data: ${date}\n\n` },
        {
          table: { headerRows: 1, widths: ["*", 140], body },
          layout: "lightHorizontalLines",
        },
      ],
      styles: {
        h1: { fontSize: 18, bold: true, margin: [0, 10, 0, 10] },
      },
      defaultStyle: { fontSize: 10 },
    };

    (pdfMake as any).createPdf(doc).download(`cantieri_${date}.pdf`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold">Export PDF</h1>
          <p className="text-sm text-black/60">PDF con logo + tabelle</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">Data</div>
          <input
            type="date"
            className="border rounded-lg px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <div className="font-bold text-lg">Presenze per Operaio</div>
          <div className="text-sm text-black/60 mt-1">
            Somma Ordinario (giornate) su tutti i cantieri del giorno
          </div>
          <button
            onClick={buildPDFPresenze}
            className="mt-4 px-4 py-2 rounded-lg bg-brand-orange text-white font-bold hover:opacity-90"
          >
            Scarica PDF
          </button>
        </div>

        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <div className="font-bold text-lg">Report Cantieri</div>
          <div className="text-sm text-black/60 mt-1">Totale Ordinario per cantiere (giornata)</div>
          <button
            onClick={buildPDFCantiere}
            className="mt-4 px-4 py-2 rounded-lg bg-brand-orange text-white font-bold hover:opacity-90"
          >
            Scarica PDF
          </button>
        </div>
      </div>

      <div className="text-sm text-black/60">
        CPM: lo renderemo identico al tuo template XLSX appena agganciamo le colonne fisse e i codici finali.
      </div>
    </div>
  );
}
