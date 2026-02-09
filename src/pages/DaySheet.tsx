import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../lib/api";
import Autocomplete from "../components/Autocomplete";

type Sheet = {
  work_date: string;
  cantiere_code: string;
  cantiere_desc: string;
  payload: any;
  updated_at: string;
};

function useQuery() {
  return new URLSearchParams(window.location.search);
}

type Row = {
  tipo: "MEZZO" | "DIPENDENTE";
  codice: string;
  descrizione: string;
  days: Record<string, { ordinario: number; notturno: number; pioggia: number; malattia: number; trasferta: number; note?: string }>;
  note?: string;
};

export default function DaySheet() {
  const q = useQuery();
  const date = q.get("date") || "";
  const code = q.get("cantiere") || "";
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const r = await apiGet<Sheet>(`/api/day/sheet?date=${encodeURIComponent(date)}&code=${encodeURIComponent(code)}`);
    setSheet(r);
    const p = r.payload || { rows: [], days: [date] };
    setRows(p.rows || []);
  };

  useEffect(() => { load(); }, [date, code]);

  const dayKey = date;

  const addRow = (tipo: "MEZZO" | "DIPENDENTE", it: { codice: string; descrizione: string }) => {
    setRows((prev) => [
      ...prev,
      {
        tipo,
        codice: it.codice,
        descrizione: it.descrizione,
        days: { [dayKey]: { ordinario: 0, notturno: 0, pioggia: 0, malattia: 0, trasferta: 0, note: "" } },
        note: "",
      },
    ]);
  };

  const updateCell = (idx: number, field: keyof Row["days"][string], value: any) => {
    setRows((prev) => {
      const cp = [...prev];
      const r = { ...cp[idx] };
      const d = { ...(r.days?.[dayKey] || { ordinario: 0, notturno: 0, pioggia: 0, malattia: 0, trasferta: 0, note: "" }) };
      (d as any)[field] = value;
      r.days = { ...(r.days || {}), [dayKey]: d };
      cp[idx] = r;
      return cp;
    });
  };

  const save = async () => {
    if (!sheet) return;
    setSaving(true);
    try {
      await apiPost("/api/day/sheet", {
        work_date: sheet.work_date,
        cantiere_code: sheet.cantiere_code,
        cantiere_desc: sheet.cantiere_desc,
        payload: { rows, days: [dayKey] },
      });
      await load();
      alert("Salvato!");
    } finally {
      setSaving(false);
    }
  };

  if (!sheet) return <div className="p-4">Caricamento...</div>;

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-gray-600">{sheet.work_date}</div>
          <h1 className="text-2xl font-bold">{sheet.cantiere_code} — {sheet.cantiere_desc}</h1>
          <div className="text-sm text-gray-600">Ultimo aggiornamento: {sheet.updated_at}</div>
        </div>
        <div className="flex gap-2">
          <a className="rounded-xl border px-4 py-2" href="/">← Dashboard</a>
          <button className="rounded-xl bg-black px-4 py-2 text-white" disabled={saving} onClick={save}>
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <div className="mb-2 font-semibold">Aggiungi Mezzo</div>
          <Autocomplete type="mezzi" onSelect={(it) => addRow("MEZZO", it)} />
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="mb-2 font-semibold">Aggiungi Dipendente</div>
          <Autocomplete type="dipendenti" onSelect={(it) => addRow("DIPENDENTE", it)} />
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border bg-white">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-left">Codice</th>
              <th className="p-2 text-left">Descrizione</th>
              <th className="p-2 text-right">Ordinario</th>
              <th className="p-2 text-right">Notturno</th>
              <th className="p-2 text-right">Pioggia</th>
              <th className="p-2 text-right">Malattia</th>
              <th className="p-2 text-right">Trasferta</th>
              <th className="p-2 text-left">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const d = r.days?.[dayKey] || { ordinario: 0, notturno: 0, pioggia: 0, malattia: 0, trasferta: 0, note: "" };
              return (
                <tr key={`${r.tipo}-${r.codice}-${idx}`} className="border-b">
                  <td className="p-2">{r.tipo}</td>
                  <td className="p-2 font-medium">{r.codice}</td>
                  <td className="p-2">{r.descrizione}</td>
                  {(["ordinario","notturno","pioggia","malattia","trasferta"] as const).map((f) => (
                    <td key={f} className="p-2 text-right">
                      <input
                        className="w-20 rounded-lg border px-2 py-1 text-right"
                        type="number"
                        value={(d as any)[f] ?? 0}
                        onChange={(e) => updateCell(idx, f, Number(e.target.value))}
                      />
                    </td>
                  ))}
                  <td className="p-2">
                    <input
                      className="w-full rounded-lg border px-2 py-1"
                      value={d.note || ""}
                      onChange={(e) => updateCell(idx, "note", e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td className="p-4 text-gray-600" colSpan={9}>Aggiungi almeno un mezzo o un dipendente.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
