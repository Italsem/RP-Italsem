import { useMemo, useState } from "react";
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

function monthNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function isOperaioType(v: any) {
  const t = String(v || "").trim().toUpperCase();
  return t === "DIP" || t === "DIPENDENTE";
}

function toNum(v: any) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default function ExportPage() {
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [month, setMonth] = useState(monthNow());
  const [weekFrom, setWeekFrom] = useState(todayISO());
  const [loading, setLoading] = useState(false);

  const exportCpmUrl = useMemo(() => `/api/export_cpm?month=${encodeURIComponent(month)}`, [month]);
  const exportCpmWeekUrl = useMemo(() => `/api/export_cpm?period=week&from=${encodeURIComponent(weekFrom)}`, [weekFrom]);

  const exportRangePdf = async () => {
    if (!from || !to) return alert("Seleziona un range valido");
    if (from > to) return alert("La data 'Da' non può essere dopo 'A'");

    setLoading(true);
    try {
      const data = await apiGet<any>(`/api/export_presenze_range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      const logoDataUrl = await toDataUrl("/logo.png");
      const pm = await ensurePdfMake();

      const groups: Record<string, any[]> = {};
      for (const r of data.rows || []) {
        const code = r.cantiere_codice || "(SENZA CANTIERE)";
        const internal = (r.cantiere_internal_desc || "").trim();
        const desc = (r.cantiere_desc || "").trim();
        const key = [code, internal, desc].filter(Boolean).join(" — ");
        groups[key] = groups[key] || [];
        groups[key].push(r);
      }

      const content: any[] = [
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
      ];

      Object.keys(groups).sort().forEach((cantiere, idx) => {
        const body = [[
          { text: "DATA", bold: true },
          { text: "TIPO", bold: true },
          { text: "CODICE", bold: true },
          { text: "DESCR", bold: true },
          { text: "ORD", bold: true, alignment: "right" },
          { text: "NOTT", bold: true, alignment: "right" },
          { text: "PIOG", bold: true, alignment: "right" },
          { text: "MAL", bold: true, alignment: "right" },
          { text: "TRASF", bold: true, alignment: "right" },
          { text: "NOTE", bold: true },
        ]];

        for (const r of groups[cantiere]) {
          body.push([
            r.data || "",
            r.tipo || "",
            r.risorsa_codice || "",
            r.risorsa_descrizione || "",
            { text: String(r.ordinario ?? ""), alignment: "right" },
            { text: String(r.notturno ?? ""), alignment: "right" },
            { text: String(r.pioggia ?? ""), alignment: "right" },
            { text: String(r.malattia ?? ""), alignment: "right" },
            { text: String(r.trasferta ?? ""), alignment: "right" },
            (r.note || "").toString(),
          ]);
        }

        content.push({ text: `Cantiere: ${cantiere}`, bold: true, margin: [0, idx === 0 ? 0 : 12, 0, 6] });
        content.push({
          table: { headerRows: 1, widths: [55, 55, 65, 150, 35, 40, 40, 35, 45, "*"], body },
          layout: "lightHorizontalLines",
          fontSize: 8,
        });
      });

      if (Object.keys(groups).length === 0) {
        content.push({ text: "Nessuna presenza trovata nel periodo selezionato.", italics: true });
      }

      const doc: any = {
        pageOrientation: "landscape",
        pageMargins: [25, 30, 25, 30],
        content,
      };

      pm.createPdf(doc).download(`presenze_${from}_to_${to}.pdf`);
    } catch (e: any) {
      alert(e?.message || "Errore export");
    } finally {
      setLoading(false);
    }
  };

  const exportOperaiRangePdf = async () => {
    if (!from || !to) return alert("Seleziona un range valido");
    if (from > to) return alert("La data 'Da' non può essere dopo 'A'");

    setLoading(true);
    try {
      const data = await apiGet<any>(`/api/export_presenze_range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      const logoDataUrl = await toDataUrl("/logo.png");
      const pm = await ensurePdfMake();

      const byOperaio: Record<string, { codice: string; nome: string; ordinario: number; trasferta: number; notturno: number; malattia: number; pioggia: number; totale: number }> = {};

      for (const r of data.rows || []) {
        if (!isOperaioType(r.tipo)) continue;

        const codice = String(r.risorsa_codice || "").trim();
        const nome = String(r.risorsa_descrizione || "").trim();
        const key = `${codice}||${nome}`;
        if (!byOperaio[key]) {
          byOperaio[key] = {
            codice,
            nome,
            ordinario: 0,
            trasferta: 0,
            notturno: 0,
            malattia: 0,
            pioggia: 0,
            totale: 0,
          };
        }

        byOperaio[key].ordinario += toNum(r.ordinario);
        byOperaio[key].trasferta += toNum(r.trasferta);
        byOperaio[key].notturno += toNum(r.notturno);
        byOperaio[key].malattia += toNum(r.malattia);
        byOperaio[key].pioggia += toNum(r.pioggia);
      }

      const rows = Object.values(byOperaio)
        .map((x) => ({
          ...x,
          totale: x.ordinario + x.trasferta + x.notturno + x.malattia + x.pioggia,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome) || a.codice.localeCompare(b.codice));

      const body: any[] = [[
        { text: "CODICE", bold: true },
        { text: "OPERAIO", bold: true },
        { text: "ORD", bold: true, alignment: "right" },
        { text: "TRASF", bold: true, alignment: "right" },
        { text: "NOTT", bold: true, alignment: "right" },
        { text: "MAL", bold: true, alignment: "right" },
        { text: "PIOG", bold: true, alignment: "right" },
        { text: "TOTALE", bold: true, alignment: "right" },
      ]];

      const fmt = (v: number) => String(Math.round(v * 100) / 100);

      for (const r of rows) {
        body.push([
          r.codice,
          r.nome,
          { text: fmt(r.ordinario), alignment: "right" },
          { text: fmt(r.trasferta), alignment: "right" },
          { text: fmt(r.notturno), alignment: "right" },
          { text: fmt(r.malattia), alignment: "right" },
          { text: fmt(r.pioggia), alignment: "right" },
          { text: fmt(r.totale), alignment: "right", bold: true },
        ]);
      }

      const totals = rows.reduce(
        (acc, r) => {
          acc.ordinario += r.ordinario;
          acc.trasferta += r.trasferta;
          acc.notturno += r.notturno;
          acc.malattia += r.malattia;
          acc.pioggia += r.pioggia;
          acc.totale += r.totale;
          return acc;
        },
        { ordinario: 0, trasferta: 0, notturno: 0, malattia: 0, pioggia: 0, totale: 0 }
      );

      if (rows.length > 0) {
        body.push([
          { text: "", colSpan: 2 },
          {},
          { text: fmt(totals.ordinario), alignment: "right", bold: true },
          { text: fmt(totals.trasferta), alignment: "right", bold: true },
          { text: fmt(totals.notturno), alignment: "right", bold: true },
          { text: fmt(totals.malattia), alignment: "right", bold: true },
          { text: fmt(totals.pioggia), alignment: "right", bold: true },
          { text: fmt(totals.totale), alignment: "right", bold: true },
        ]);
      }

      const content: any[] = [
        {
          columns: [
            { image: logoDataUrl, width: 90 },
            [
              { text: "EXPORT OPERAI - GIORNATE LAVORATE", fontSize: 16, bold: true, margin: [0, 8, 0, 2] },
              { text: `Range: ${from} → ${to}`, fontSize: 10, color: "#666" },
              { text: `Operai trovati: ${rows.length}`, fontSize: 10, color: "#666", margin: [0, 2, 0, 0] },
            ],
          ],
          margin: [0, 0, 0, 12],
        },
      ];

      if (rows.length === 0) {
        content.push({ text: "Nessuna presenza operai trovata nel periodo selezionato.", italics: true });
      } else {
        content.push({
          table: { headerRows: 1, widths: [65, "*", 45, 50, 45, 40, 45, 55], body },
          layout: "lightHorizontalLines",
          fontSize: 9,
        });
      }

      pm.createPdf({ pageMargins: [25, 30, 25, 30], content }).download(`operai_giornate_${from}_to_${to}.pdf`);
    } catch (e: any) {
      alert(e?.message || "Errore export operai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="text-2xl font-bold">Export</h1>
      <div className="mt-4 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-4">
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
        <div className="flex items-end">
          <button className="w-full rounded-xl bg-brand-orange px-4 py-2 text-white" disabled={loading} onClick={exportOperaiRangePdf}>
            {loading ? "Generazione..." : "Export Operai (PDF)"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3">
        <div>
          <div className="mb-1 text-sm text-gray-600">Mese CPM</div>
          <input className="w-full rounded-xl border px-3 py-2" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <div className="md:col-span-2 flex items-end">
          <a className="w-full rounded-xl border px-4 py-2 text-center" href={exportCpmUrl} target="_blank" rel="noreferrer">
            Export CPM Mensile
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3">
        <div>
          <div className="mb-1 text-sm text-gray-600">Partenza settimana CPM</div>
          <input className="w-full rounded-xl border px-3 py-2" type="date" value={weekFrom} onChange={(e) => setWeekFrom(e.target.value)} />
        </div>
        <div className="md:col-span-2 flex items-end">
          <a className="w-full rounded-xl border px-4 py-2 text-center" href={exportCpmWeekUrl} target="_blank" rel="noreferrer">
            Export CPM Settimanale (7 giorni)
          </a>
        </div>
      </div>

    </div>
  );
}
