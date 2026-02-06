import { useMemo, useState } from "react";

function monthNow() {
  const d = new Date();
  const m = String(d.getMonth()+1).padStart(2,"0");
  return `${d.getFullYear()}-${m}`;
}

export default function ExportPage() {
  const [month, setMonth] = useState(monthNow());

  const pres = useMemo(()=>`/api/export_presenze?month=${encodeURIComponent(month)}`, [month]);
  const cant = useMemo(()=>`/api/export_cantiere?month=${encodeURIComponent(month)}`, [month]);
  const cpm  = useMemo(()=>`/api/export_cpm?month=${encodeURIComponent(month)}`, [month]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Export</h1>
          <p className="text-sm text-black/60">Scarica CSV per presenze / cantiere / CPM</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-black/60">Mese:</div>
          <input className="border border-black/15 rounded-lg px-3 py-2"
            value={month}
            onChange={(e)=>setMonth(e.target.value)}
            placeholder="YYYY-MM"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Presenze per Operaio" desc="Somma giornate per dipendente" href={pres} />
        <Card title="Report per Cantiere" desc="Totali per riga/cantiere" href={cant} />
        <Card title="Export CPM (CSV)" desc="Base import CPM (v1)" href={cpm} />
      </div>

      <div className="text-sm text-black/60">
        Nota: l’export CPM identico al template XLSX lo finalizziamo dopo usando il file di riferimento, ma già ora puoi esportare e verificare la struttura.
      </div>
    </div>
  );
}

function Card({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <div className="bg-white border border-black/10 rounded-2xl p-5">
      <div className="font-bold text-lg">{title}</div>
      <div className="text-sm text-black/60 mt-1">{desc}</div>
      <a
        className="inline-block mt-4 px-4 py-2 rounded-lg bg-brand-orange text-white font-bold hover:opacity-90"
        href={href}
      >
        Scarica CSV
      </a>
    </div>
  );
}
