import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";

type RowType = "DIP" | "MEZZO" | "HOTEL";

type DayRow = {
  id: string;
  type: RowType;
  code: string;      // es: Codice dipendente / mezzo / H01/H02
  desc: string;      // descrizione / nominativo / mezzo
  note: string;      // note riga
  ordinario: number; // (giornate) o persone hotel
  notturno: number;
  pioggia: number;
  malattia: number;
  trasferta: number;
};

function qparam(name: string) {
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

export default function DayCantiere() {
  const date = qparam("date");
  const cantiere_code = qparam("cantiere_code");

  const [cantiere_desc, setDesc] = useState("");
  const [rows, setRows] = useState<DayRow[]>([]);
  const [dip, setDip] = useState<any[]>([]);
  const [mezzi, setMezzi] = useState<any[]>([]);

  const dipOpt = useMemo(() => dip.map(d => ({
    code: d.Codice ?? "",
    label: `${d.Codice} - ${d.Nome ?? ""} ${d.Cognome ?? ""} - ${d.Descrizione ?? ""}`.trim()
  })).filter(x=>x.code && x.label), [dip]);

  const mezziOpt = useMemo(() => mezzi.map(m => ({
    code: m.Codice ?? "",
    label: `${m.Codice} - ${m.Descrizione ?? ""}`.trim()
  })).filter(x=>x.code && x.label), [mezzi]);

  useEffect(() => {
    (async () => {
      const [d, m] = await Promise.all([
        apiGet<any[]>("/api/lists/dipendenti"),
        apiGet<any[]>("/api/lists/mezzi"),
      ]);
      setDip(d); setMezzi(m);
    })();
  }, []);

  async function load() {
    const r = await apiGet<any>(`/api/day/sheet?date=${encodeURIComponent(date)}&cantiere_code=${encodeURIComponent(cantiere_code)}`);
    setDesc(r.cantiere_desc);
    setRows(r.payload?.rows ?? []);
  }

  useEffect(() => {
    if (!date || !cantiere_code) return;
    load();
  }, []);

  function addRow(type: RowType) {
    setRows(prev => [...prev, {
      id: crypto.randomUUID(),
      type,
      code: "",
      desc: "",
      note: "",
      ordinario: 0,
      notturno: 0,
      pioggia: 0,
      malattia: 0,
      trasferta: 0,
    }]);
  }

  function updateRow(id: string, patch: Partial<DayRow>) {
    setRows(prev => prev.map(r => r.id===id ? { ...r, ...patch } : r));
  }

  async function save() {
    // regole speciali:
    // - DIP: ordinario=giornate (0.33 ecc)
    // - MEZZO: se usato, ordinario=1; note deve includere AUTISTA
    // - HOTEL: code=H01/H02; ordinario=numero persone; note = nome hotel
    await apiPost("/api/day/sheet", {
      work_date: date,
      cantiere_code,
      cantiere_desc,
      payload: { rows }
    });
    alert("Salvato ✅");
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold">Compilazione Giornata</h1>
          <p className="text-sm text-black/60">{date} — {cantiere_code} — {cantiere_desc}</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg border border-black/10 font-bold" onClick={()=>history.back()}>
            Indietro
          </button>
          <button className="px-4 py-2 rounded-lg bg-brand-orange text-white font-bold hover:opacity-90" onClick={save}>
            Salva
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button className="px-4 py-2 rounded-lg border border-black/10 bg-white font-bold" onClick={()=>addRow("DIP")}>+ Operaio</button>
        <button className="px-4 py-2 rounded-lg border border-black/10 bg-white font-bold" onClick={()=>addRow("MEZZO")}>+ Mezzo</button>
        <button className="px-4 py-2 rounded-lg border border-black/10 bg-white font-bold" onClick={()=>addRow("HOTEL")}>+ Hotel</button>
      </div>

      <datalist id="dl-dip">{dipOpt.map((x,i)=><option key={i} value={x.label} />)}</datalist>
      <datalist id="dl-mezzi">{mezziOpt.map((x,i)=><option key={i} value={x.label} />)}</datalist>

      <div className="bg-white border border-black/10 rounded-2xl p-4 overflow-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead>
            <tr className="text-left border-b border-black/10">
              <th className="py-2">Tipo</th>
              <th>Codice</th>
              <th>Descrizione</th>
              <th>Note</th>
              <th>Ordinario</th>
              <th>Notturno</th>
              <th>Pioggia</th>
              <th>Malattia</th>
              <th>Trasferta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="border-b border-black/5 align-top">
                <td className="py-2 font-extrabold">{r.type}</td>
                <td>
                  <input className="border rounded px-2 py-1 w-24"
                    value={r.code}
                    onChange={(e)=>updateRow(r.id,{code:e.target.value})}
                    placeholder={r.type==="HOTEL"?"H01/H02":""}
                  />
                </td>
                <td>
                  <input
                    className="border rounded px-2 py-1 w-96"
                    list={r.type==="DIP" ? "dl-dip" : r.type==="MEZZO" ? "dl-mezzi" : undefined}
                    value={r.desc}
                    onChange={(e)=>updateRow(r.id,{desc:e.target.value})}
                    placeholder={r.type==="HOTEL" ? "HOTEL 01/02 (descr)" : "autocomplete..."}
                  />
                </td>
                <td>
                  <input className="border rounded px-2 py-1 w-72"
                    value={r.note}
                    onChange={(e)=>updateRow(r.id,{note:e.target.value})}
                    placeholder={r.type==="MEZZO" ? "AUTISTA: Nome" : r.type==="HOTEL" ? "Nome hotel" : ""}
                  />
                </td>
                <td><Num v={r.ordinario} onChange={(v)=>updateRow(r.id,{ordinario:v})} /></td>
                <td><Num v={r.notturno} onChange={(v)=>updateRow(r.id,{notturno:v})} /></td>
                <td><Num v={r.pioggia} onChange={(v)=>updateRow(r.id,{pioggia:v})} /></td>
                <td><Num v={r.malattia} onChange={(v)=>updateRow(r.id,{malattia:v})} /></td>
                <td><Num v={r.trasferta} onChange={(v)=>updateRow(r.id,{trasferta:v})} /></td>
              </tr>
            ))}
            {rows.length===0 && <tr><td colSpan={9} className="py-4 text-black/60">Nessuna riga. Aggiungi Operaio/Mezzo/Hotel.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-black/60">
        Regole: <b>Ordinario</b> per operai è “giornate” (0.33 ecc). Mezzo: se usato metti <b>Ordinario=1</b> e in note scrivi <b>AUTISTA: ...</b>. Hotel: <b>code H01/H02</b>, ordinario = persone, note = nome hotel.
      </div>
    </div>
  );
}

function Num({ v, onChange }: { v: number; onChange: (n:number)=>void }) {
  return (
    <input
      className="border rounded px-2 py-1 w-20"
      value={String(v ?? 0)}
      onChange={(e)=>onChange(Number(String(e.target.value).replace(",", ".")) || 0)}
    />
  );
}
