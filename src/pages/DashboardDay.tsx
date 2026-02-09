import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

type Cantiere = any;
type ListsResponse<T> = { ok: true; items: T[] };

export default function DashboardDay() {
  const [date, setDate] = useState(todayISO());
  const [active, setActive] = useState<any[]>([]);
  const [cantieri, setCantieri] = useState<Cantiere[]>([]);
  const [addCode, setAddCode] = useState("");
  const [addDesc, setAddDesc] = useState("");

  const cantieriOptions = useMemo(
    () =>
      cantieri
        .map((c) => ({
          code: c.Codice ?? c.codice ?? c.code ?? "",
          desc: c.Descrizione ?? c.descrizione ?? c.desc ?? "",
        }))
        .filter((x) => x.code && x.desc),
    [cantieri]
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet<ListsResponse<Cantiere>>("/api/lists/cantieri");
        setCantieri(Array.isArray(res?.items) ? res.items : []);
      } catch (e) {
        console.error(e);
        setCantieri([]);
      }
    })();
  }, []);

  async function loadActive() {
    try {
      const r = await apiGet<any[]>(`/api/day/active?date=${encodeURIComponent(date)}`);
      setActive(Array.isArray(r) ? r : []);
    } catch (e) {
      console.error(e);
      setActive([]);
    }
  }

  useEffect(() => {
    loadActive();
  }, [date]);

  function onPickCantiere(v: string) {
    // v = "CODICE - DESCR"
    const m = v.match(/^(.+?)\s-\s(.*)$/);
    if (m) {
      setAddCode(m[1]);
      setAddDesc(m[2]);
    } else {
      setAddCode("");
      setAddDesc(v);
    }
  }

  async function addCantiereToDay() {
    if (!addCode || !addDesc) {
      alert("Seleziona un cantiere");
      return;
    }

    // creo uno sheet vuoto (payload standard)
    const payload = { rows: [] };
    await apiPost("/api/day/sheet", { work_date: date, cantiere_code: addCode, cantiere_desc: addDesc, payload });
    setAddCode("");
    setAddDesc("");
    await loadActive();
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Dashboard Giornaliera</h1>
          <p className="text-sm text-black/60">Seleziona la data e compila i cantieri attivi</p>
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

      <div className="bg-white border border-black/10 rounded-2xl p-5 space-y-3">
        <div className="font-bold text-lg">Aggiungi cantiere alla giornata</div>

        <datalist id="dl-cantieri">
          {cantieriOptions.map((c, i) => (
            <option key={i} value={`${c.code} - ${c.desc}`} />
          ))}
        </datalist>

        <input
          className="border rounded-lg px-3 py-2 w-full"
          placeholder="Cerca cantiere (autocomplete)..."
          list="dl-cantieri"
          onChange={(e) => onPickCantiere(e.target.value)}
        />

        <button className="px-4 py-2 rounded-lg bg-brand-orange text-white font-bold hover:opacity-90" onClick={addCantiereToDay}>
          Crea / Aggiungi
        </button>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl p-5">
        <div className="font-bold text-lg mb-3">Cantieri attivi ({active.length})</div>

        <div className="grid gap-3 md:grid-cols-2">
          {active.map((c: any) => (
            <a
              key={c.cantiere_code}
              className="border border-black/10 rounded-xl p-4 hover:bg-black/5 transition block"
              href={`/day/edit?date=${encodeURIComponent(date)}&cantiere_code=${encodeURIComponent(c.cantiere_code)}`}
            >
              <div className="font-extrabold">{c.cantiere_code}</div>
              <div className="text-sm text-black/70">{c.cantiere_desc}</div>
              <div className="text-xs text-black/50 mt-1">Aggiornato: {c.updated_at}</div>
            </a>
          ))}
          {active.length === 0 && <div className="text-sm text-black/60">Nessun cantiere per questa data.</div>}
        </div>
      </div>
    </div>
  );
}
