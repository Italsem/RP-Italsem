import { useState } from "react";
import { apiGet } from "../lib/api";

let pdfMake: any;

async function ensurePdfMake() {
  if (pdfMake) return pdfMake;

  const pm = await import("pdfmake/build/pdfmake");
  const vf = await import("pdfmake/build/vfs_fonts");

  pdfMake = (pm as any).default || pm;
  const vfs = (vf as any).pdfMake?.vfs || (vf as any).default?.pdfMake?.vfs || (vf as any).vfs;
  pdfMake.vfs = pdfMake.vfs || vfs;

  return pdfMake;
}

async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-cache" });
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ExportPage() {
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [loading, setLoading] = useState(false);

  const exportRangePdf = async () => {
    if (!from || !to) return alert("Seleziona un range valido");
    if (from > to) return alert("La data 'Da' non può essere dopo 'A'");

    setLoading(true);
    try {
      // Qui devi usare un endpoint che ritorna le righe nel range.
      // Se non esiste ancora, dimmelo e lo aggiungo subito nel backend.
      // Io ipotizzo: /api/export_presenze_range?from=YYYY-MM-DD&to=YYYY-MM-DD
      const data = await apiGet<any>(`/api/export_presenze_range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);

      const logoDataUrl = await toDataUrl("/logo.png");
      const pm = await ensurePdfMake();

      const body = [
        [
          { text: "DATA", bold: true },
          { text: "CANTIERE", bold: true },
          { text: "TIPO", bold: true },
          { text: "CODICE", bold: true },
          { text: "DESCR", bold: true },
          { text: "ORD", bold: true, alignment: "right" },
          { text: "NOTT", bold: true, alignment: "right" },
          { text: "PIOG", bold: true, alignment: "right" },
          { text: "MAL", bold: true, alignment: "right" },
          { text: "TRASF", bold: true, alignment: "right" },
          { text: "NOTE", bold: true },
        ],
      ];

      for (const r of data.rows || []) {
        body.push([
          r.data || "",
          `${r.cantiere_codice || ""}`,
          r.tipo || "",
          r.risorsa_codice || "",
          r.risorsa_descrizione || "",
          { text: String(r.ordinario ?? 0), alignment: "right" },
          { text: String(r.notturno ?? 0), alignment: "right" },
          { text: String(r.pioggia ?? 0), alignment: "right" },
          { text: String(r.malattia ?? 0), alignment: "right" },
          { text: String(r.trasferta ?? 0), alignment: "right" },
          (r.note || "").toString(),
        ]);
      }

      const doc: any = {
        pageOrientation: "landscape",
        pageMargins: [25, 30, 25, 30],
        content: [
          {
            columns: [
              { image: logoDataUrl, width: 90 },
              [
                { text: "EXPORT PRESENZE", fontSize: 16, bold: true, margin: [0, 8, 0, 2] },
                { text: `Range: ${from} → ${to}`, fontSize: 10, color: "#666" },
              ],
            ],
            margin: [0, 0, 0, 12],
          },
          {
            table: {
              headerRows: 1,
              widths: [55, 70, 55, 65, 150, 35, 40, 40, 35, 45, "*"],
              body,
            },
            layout: "lightHorizontalLines",
            fontSize: 8,
          },
        ],
      };

      pm.createPdf(doc).download(`presenze_${from}_to_${to}.pdf`);
    } catch (e: any) {
      alert(e?.message || "Errore export");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="text-2xl font-bold">Export</h1>
      <div className="mt-4 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3">
        <div>
          <div className="mb-1 text-sm text-gray-600">Da</div>
          <input className="w-full rounded-xl border px-3 py-2" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <div className="mb-1 text-sm text-gray-600">A</div>
          <input className="w-full rounded-xl border px-3 py-2" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button className="w-full rounded-xl bg-black px-4 py-2 text-white" disabled={loading} onClick={exportRangePdf}>
            {loading ? "Generazione..." : "Export Presenze (PDF)"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <a className="rounded-xl border px-4 py-2" href="/api/export_cpm" target="_blank" rel="noreferrer">
          Export CPM (invariato)
        </a>
      </div>
    </div>
  );
}
