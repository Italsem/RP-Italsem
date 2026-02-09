import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";
import Autocomplete from "../components/Autocomplete";

type Active = { work_date: string; cantiere_code: string; cantiere_desc: string; updated_at: string };

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Dashboard() {
  const [date, setDate] = useState(todayISO());
  const [list, setList] = useState<Active[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useMemo(() => async () => {
    setErr(null);
    try {
      const r = await apiGet<{ rows: Active[] }>(`/api/day/active?date=${encodeURIComponent(date)}`);
      setList(r.rows || []);
    } catch (e: any) {
      setErr(e.message || "Errore");
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard giornaliera</h1>
          <div className="text-sm text-gray-600">Seleziona una data: vedi i cantieri “attivi” quel giorno.</div>
        </div>
        <div className="flex gap-2">
          <input className="rounded-xl border px-3 py-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="rounded-xl border px-4 py-2" onClick={() => setAdding(true)}>+ Aggiungi cantiere</button>
        </div>
      </div>

      {err && <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-red-700">{err}</div>}

      <div className="rounded-2xl border bg-white">
        <div className="border-b p-3 font-semibold">Cantieri del {date}</div>
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";
import Autocomplete from "../components/Autocomplete";

type Active = { work_date: string; cantiere_code: string; cantiere_desc: string; updated_at: string };

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Dashboard() {
  const [date, setDate] = useState(todayISO());
  const [list, setList] = useState<Active[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useMemo(() => async () => {
    setErr(null);
    try {
      const r = await apiGet<{ rows: Active[] }>(`/api/day/active?date=${encodeURIComponent(date)}`);
      setList(r.rows || []);
    } catch (e: any) {
      setErr(e.message || "Errore");
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard giornaliera</h1>
          <div className="text-sm text-gray-600">Seleziona una data: vedi i cantieri “attivi” quel giorno.</div>
        </div>
        <div className="flex gap-2">
          <input className="rounded-xl border px-3 py-2" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="rounded-xl border px-4 py-2" onClick={() => setAdding(true)}>+ Aggiungi cantiere</button>
        </div>
      </div>

      {err && <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-red-700">{err}</div>}

      <div className="rounded-2xl border bg-white">
        <div className="border-b p-3 font-semibold">Cantieri del {date}</div>
        {list.length === 0 ? (
          <div className="p-4 text-gray-600">Nessun cantiere attivo per questa giornata.</div>
        ) : (
          <div className="divide-y">
            {list.map((c) => (
              <a key={c.cantiere_code} className="block p-4 hover:bg-gray-50"
                 href={`/day?date=${encodeURIComponent(date)}&cantiere=${encodeURIComponent(c.cantiere_code)}`}>
                <div className="font-semibold">{c.cantiere_code} — {c.cantiere_desc}</div>
                <div className="text-sm text-gray-600">Ultimo aggiornamento: {c.updated_at}</div>
              </a>
            ))}
          </div>
        )}
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow">
            <div className="mb-2 text-lg font-bold">Aggiungi cantiere alla giornata</div>
            <div className="mb-3 text-sm text-gray-600">Cerca cantiere (autocomplete) e conferma.</div>

            <Autocomplete
              type="cantieri"
              placeholder="Cerca cantiere per codice o descrizione"
              onSelect={async (it) => {
                try {
                  await apiPost("/api/day/add_cantiere", {
                    work_date: date,
                    cantiere_code: it.codice,
                    cantiere_desc: it.descrizione,
                  });
                  setAdding(false);
                  await load();
                } catch (e: any) {
                  alert(e.message || "Errore");
                }
              }}
            />

            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded-xl border px-4 py-2" onClick={() => setAdding(false)}>Chiudi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

