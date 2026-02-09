import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";

function monthNow() {
  const d = new Date();
  const m = String(d.getMonth()+1).padStart(2,"0");
  return `${d.getFullYear()}-${m}`;
}
function daysInMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const days: string[] = [];
  for (let i=1;i<=last;i++) days.push(`${month}-${String(i).padStart(2,"0")}`);
  return days;
}

type ListItem = { codice: string; descrizione: string };
type ListsResponse = { ok: true; items: ListItem[] };

type Row = {
  id: string;
  type: "DIP" | "MEZZO" | "HOTEL";
  cantiere: string;
  code: string;
  name: string;
  note: string;
  days: Record<string, { ordinario: number; note: string }>;
};

export default function Inserimento() {
  const [month, setMonth] = useState(monthNow());
  const days = useMemo(() => daysInMonth(month), [month]);

  const [cantieri, setCantieri] = useState<ListItem[]>([]);
  const [dip, setDip] = useState<ListItem[]>([]);
  const [mezzi, setMezzi] = useState<ListItem[]>([]);

  useEffect(() => {
    Promise.all([
      apiGet<ListsResponse>("/api/lists/cantieri"),
      apiGet<ListsResponse>("/api/lists/dipendenti"),
      apiGet<ListsResponse>("/api/lists/mezzi"),
    ]).then(([c,d,m]) => { setCantieri(c.items || []); setDip(d.items || []); setMezzi(m.items || []); }).catch(()=>{});
  }, []);

  const [rows, setRows] = useState<Row[]>([
    { id: crypto.randomUUID(), type:"DIP", cantiere:"", code:"", name:"", note:"", days:{} }
  ]);

  function addRow(type: Row["type"]) {
    setRows(r => [...r, { id: crypto.randomUUID(), type, cantiere:"", code:"", name:"", note:"", days:{} }]);
  }

  function setRow(id:string, patch: Partial<Row>) {
    setRows(r => r.map(x => x.id===id ? {...x, ...patch} : x));
  }

  function setDay(id:string, day:string, patch: Partial<{ordinario:number; note:string}>) {
    setRows(r => r.map(x => {
      if (x.id!==id) return x;
      const cur = x.days[day] ?? { ordinario:0, note:"" };
      return { ...x, days: { ...x.days, [day]: { ...cur, ...patch } } };
    }));
  }

  async function save() {
    // regole:
    // - valore 1 = 1 giornata (può essere 0.33 ecc.)
    // - MEZZO: se usato quel giorno, ordinario=1 e in note metti autista (user lo inserisce in note day)
    // - HOTEL: code H01/H02, ordinario = persone, note = nome hotel
    const payload = { month, days, rows };
    await apiPost("/api/rapportini", { month, payload });
    alert("Rapportino salvato ✅");
  }

  const cantiereOptions = cantieri.map((c) => ({ code: c.codice || "", desc: c.descrizione || "" })).filter((x) => x.desc);
  const dipOptions = dip.map((d) => ({ code: d.codice || "", desc: d.descrizione || "" })).filter((x) => x.desc);
  const mezziOptions = mezzi.map((m) => ({ code: m.codice || "", desc: m.descrizione || "" })).filter((x) => x.desc);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Nuovo Rapportino</h1>
          <p className="text-sm text-black/60">Inserimento per mese con colonne giorno</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-black/60">Mese:</div>
          <input className="border border-black/15 rounded-lg px-3 py-2"
            value={month}
            onChange={(e)=>setMonth(e.target.value)}
            placeholder="YYYY-MM"
          />
          <button onClick={save} className="px-4 py-2 rounded-lg bg-brand-orange text-white font-bold hover:opacity-90">
            Salva
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={()=>addRow("DIP")} className="px-4 py-2 rounded-lg border border-black/10 bg-white">+ Operaio</button>
        <button onClick={()=>addRow("MEZZO")} className="px-4 py-2 rounded-lg border border-black/10 bg-white">+ Mezzo</button>
        <button onClick={()=>addRow("HOTEL")} className="px-4 py-2 rounded-lg border border-black/10 bg-white">+ Hotel</button>
      </div>

      <datalist id="dl-cantieri">{cantiereOptions.map((x,i)=><option key={i} value={x.desc} />)}</datalist>
      <datalist id="dl-dip">{dipOptions.map((x,i)=><option key={i} value={x.desc} />)}</datalist>
      <datalist id="dl-mezzi">{mezziOptions.map((x,i)=><option key={i} value={x.desc} />)}</datalist>

      <div className="bg-white border border-black/10 rounded-2xl p-4 overflow-auto">
        <table className="min-w-[1200px] w-full text-xs">
          <thead>
            <tr className="border-b border-black/10 text-left">
              <th className="py-2">Tipo</th>
              <th>Cantiere</th>
              <th>Codice</th>
              <th>Descrizione</th>
              <th>Note Riga</th>
              {days.map(d => <th key={d} className="px-2">{d.slice(8,10)}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-b border-black/5 align-top">
                <td className="py-2 font-bold">{row.type}</td>
                <td>
                  <input list="dl-cantieri" className="border border-black/10 rounded px-2 py-1 w-48"
                    value={row.cantiere} onChange={(e)=>{ const cantiere=e.target.value; const found=cantiereOptions.find((x)=>x.desc===cantiere); setRow(row.id,{cantiere, code: found?.code ?? row.code}); }}/>
                </td>
                <td>
                  <input className="border border-black/10 rounded px-2 py-1 w-28"
                    value={row.code} onChange={(e)=>setRow(row.id,{code:e.target.value})}/>
                </td>
                <td>
                  <input
                    list={row.type==="DIP" ? "dl-dip" : row.type==="MEZZO" ? "dl-mezzi" : undefined}
                    className="border border-black/10 rounded px-2 py-1 w-64"
                    value={row.name}
                    onChange={(e)=>{
                      const name = e.target.value;
                      if (row.type === "DIP") {
                        const found = dipOptions.find((x) => x.desc === name);
                        setRow(row.id,{name, code: found?.code ?? row.code});
                        return;
                      }
                      if (row.type === "MEZZO") {
                        const found = mezziOptions.find((x) => x.desc === name);
                        setRow(row.id,{name, code: found?.code ?? row.code});
                        return;
                      }
                      setRow(row.id,{name});
                    }}
                    placeholder={row.type==="HOTEL" ? 'HOTEL 01 / HOTEL 02 (note=nome hotel)' : ''}
                  />
                </td>
                <td>
                  <input className="border border-black/10 rounded px-2 py-1 w-56"
                    value={row.note} onChange={(e)=>setRow(row.id,{note:e.target.value})}/>
                </td>

                {days.map(d => (
                  <td key={d} className="px-2">
                    <input
                      className="border border-black/10 rounded px-2 py-1 w-16"
                      value={row.days?.[d]?.ordinario ?? ""}
                      onChange={(e)=>setDay(row.id,d,{ordinario: Number(e.target.value.replace(",", ".")) || 0})}
                      placeholder="0"
                    />
                    <input
                      className="border border-black/10 rounded px-2 py-1 w-28 mt-1"
                      value={row.days?.[d]?.note ?? ""}
                      onChange={(e)=>setDay(row.id,d,{note:e.target.value})}
                      placeholder="note"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-black/60">
        Regole: <b>1</b> = 1 giornata (puoi usare <b>0,33</b>). Mezzo: se usato metti <b>ordinario=1</b> e nelle note giorno l’autista. Hotel: ordinario = persone, note giorno = nome hotel, codice H01/H02.
      </div>
    </div>
  );
}
