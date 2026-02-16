import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";

type RowType = "DIP" | "MEZZO" | "HOTEL";

type DayRow = {
  id: string;
  type: RowType;
  code: string;
  desc: string;
  note: string;
  ordinario: number;
  notturno: number;
  pioggia: number;
  malattia: number;
  trasferta: number;
};

type ListsResponse<T> = { ok: true; items: T[] };

function qparam(name: string) {
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

function toNum(v: any) {
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isNaN(n) ? 0 : n;
  }
  const n = Number(v ?? 0);
  return Number.isNaN(n) ? 0 : n;
}

function normalizeType(v: any): RowType {
  const t = String(v || "").toUpperCase();
  if (t === "DIP" || t === "DIPENDENTE") return "DIP";
  if (t === "MEZZO") return "MEZZO";
  return "HOTEL";
}

function normalizeRows(input: any[]): DayRow[] {
  return (Array.isArray(input) ? input : []).map((r) => ({
    id: String(r?.id || crypto.randomUUID()),
    type: normalizeType(r?.type),
    code: String(r?.code ?? ""),
    desc: String(r?.desc ?? r?.name ?? ""),
    note: String(r?.note ?? ""),
    ordinario: toNum(r?.ordinario),
    notturno: toNum(r?.notturno),
    pioggia: toNum(r?.pioggia),
    malattia: toNum(r?.malattia),
    trasferta: toNum(r?.trasferta),
  }));
}

export default function DayCantiere() {
  const date = qparam("date");
  const cantiere_code = qparam("cantiere_code");

  const [cantiere_desc, setDesc] = useState("");
  const [rows, setRows] = useState<DayRow[]>([]);
  const [dip, setDip] = useState<any[]>([]);
  const [mezzi, setMezzi] = useState<any[]>([]);

  const dipOpt = useMemo(
    () =>
      dip
        .map((d) => ({
          code: d.codice ?? d.Codice ?? "",
          desc: d.descrizione ?? `${d.cognome ?? ""} ${d.nome ?? ""}`.trim(),
        }))
        .map((x) => ({ ...x, label: x.desc }))
        .filter((x) => x.code && x.desc),
    [dip]
  );

  const mezziOpt = useMemo(
    () =>
      mezzi
        .map((m) => ({
          code: m.codice ?? m.Codice ?? "",
          desc: m.descrizione ?? m.Descrizione ?? "",
        }))
        .map((x) => ({ ...x, label: x.desc }))
        .filter((x) => x.code && x.desc),
    [mezzi]
  );

  useEffect(() => {
    (async () => {
      try {
        const [dRes, mRes] = await Promise.all([
          apiGet<ListsResponse<any>>("/api/lists/dipendenti"),
          apiGet<ListsResponse<any>>("/api/lists/mezzi"),
        ]);
        setDip(Array.isArray(dRes?.items) ? dRes.items : []);
        setMezzi(Array.isArray(mRes?.items) ? mRes.items : []);
      } catch (e: any) {
        console.error(e);
        setDip([]);
        setMezzi([]);
      }
    })();
  }, []);

  async function load() {
    try {
      const r = await apiGet<any>(`/api/day/sheet?date=${encodeURIComponent(date)}&cantiere_code=${encodeURIComponent(cantiere_code)}`);
      setDesc(String(r?.cantiere_desc || cantiere_code));
      setRows(normalizeRows(r?.payload?.rows || []));
    } catch (e: any) {
      // Se la scheda non esiste ancora o errore, lasciamo pagina compilabile
      setDesc(cantiere_code);
      setRows([]);
    }
  }

  useEffect(() => {
    if (!date || !cantiere_code) return;
    load();
  }, [date, cantiere_code]);

  function addRow(type: RowType) {
    setRows((prev) => [
      ...prev,
      {
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
      },
    ]);
  }

  function updateRow(id: string, patch: Partial<DayRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function save() {
    await apiPost("/api/day/sheet", {
      work_date: date,
      cantiere_code,
      cantiere_desc: cantiere_desc || cantiere_code,
      payload: { rows },
    });
    alert("Salvato ✅");
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold">Compilazione Giornata</h1>
          <p className="text-sm text-black/60">
            {date} — {cantiere_code} — {cantiere_desc}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg border border-black/10 font-bold" onClick={() => { const ret = new URLSearchParams(window.location.search).get("returnDate") || date; window.location.href = `/dashboard?date=${encodeURIComponent(ret)}`; }}>
            Indietro
          </button>
          <button className="px-4 py-2 rounded-lg bg-brand-orange text-white font-bold hover:opacity-90" onClick={save}>
            Salva
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button className="px-4 py-2 rounded-lg border border-black/10 bg-white font-bold" onClick={() => addRow("DIP")}>
          + Operaio
        </button>
        <button className="px-4 py-2 rounded-lg border border-black/10 bg-white font-bold" onClick={() => addRow("MEZZO")}>
          + Mezzo
        </button>
        <button className="px-4 py-2 rounded-lg border border-black/10 bg-white font-bold" onClick={() => addRow("HOTEL")}>
          + Hotel
        </button>
      </div>

      <datalist id="dl-dip">{dipOpt.map((x, i) => <option key={i} value={x.label} />)}</datalist>
      <datalist id="dl-mezzi">{mezziOpt.map((x, i) => <option key={i} value={x.label} />)}</datalist>

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
              <th className="text-center">X</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-black/5 align-top">
                <td className="py-2 font-extrabold">{r.type}</td>
                <td>
                  <input className="border rounded px-2 py-1 w-24" value={r.code} onChange={(e) => updateRow(r.id, { code: e.target.value })} placeholder={r.type === "HOTEL" ? "H01/H02" : ""} />
                </td>
                <td>
                  <input
                    className="border rounded px-2 py-1 w-96"
                    list={r.type === "DIP" ? "dl-dip" : r.type === "MEZZO" ? "dl-mezzi" : undefined}
                    value={r.desc}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (r.type === "HOTEL") return updateRow(r.id, { desc: val });
                      const opts = r.type === "DIP" ? dipOpt : mezziOpt;
                      const found = opts.find((o) => o.label === val);
                      if (found) return updateRow(r.id, { code: found.code, desc: found.desc });
                      updateRow(r.id, { desc: val });
                    }}
                    placeholder={r.type === "HOTEL" ? "HOTEL 01/02 (descr)" : "autocomplete..."}
                  />
                </td>
                <td>
                  <input className="border rounded px-2 py-1 w-72" value={r.note} onChange={(e) => updateRow(r.id, { note: e.target.value })} placeholder={r.type === "MEZZO" ? "AUTISTA: Nome" : r.type === "HOTEL" ? "Nome hotel" : ""} />
                </td>
                <td><Num v={r.ordinario} onChange={(v) => updateRow(r.id, { ordinario: v })} /></td>
                <td><Num v={r.notturno} onChange={(v) => updateRow(r.id, { notturno: v })} /></td>
                <td><Num v={r.pioggia} onChange={(v) => updateRow(r.id, { pioggia: v })} /></td>
                <td><Num v={r.malattia} onChange={(v) => updateRow(r.id, { malattia: v })} /></td>
                <td><Num v={r.trasferta} onChange={(v) => updateRow(r.id, { trasferta: v })} /></td>
                <td className="text-center">
                  <button className="rounded-full border border-red-300 px-2 py-0.5 text-xs font-bold text-red-600 hover:bg-red-50" onClick={() => removeRow(r.id)} title="Elimina riga">
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-4 text-black/60">
                  Nessuna riga. Aggiungi Operaio/Mezzo/Hotel/Attrezzatura.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-black/60">
        Regole: <b>Ordinario</b> per operai è “giornate” (0.33 ecc). Mezzo: se usato metti <b>Ordinario=1</b> e in
        note scrivi <b>AUTISTA: ...</b>. Hotel: <b>code H01/H02</b>, ordinario = persone, note = nome hotel. Attrezzature: usa la riga <b>ATTREZZATURA</b> con descrizione da lista importata in Admin.
      </div>
    </div>
  );
}

function Num({ v, onChange }: { v: number; onChange: (n: number) => void }) {
  const [draft, setDraft] = useState(String(v ?? 0));

  useEffect(() => {
    setDraft(String(v ?? 0));
  }, [v]);

  const commit = (raw: string) => {
    const normalized = String(raw ?? "").replace(",", ".").trim();
    if (!normalized) {
      onChange(0);
      setDraft("0");
      return;
    }
    const parsed = Number(normalized);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
      setDraft(String(raw));
    }
  };

  return (
    <input
      className="border rounded px-2 py-1 w-20"
      inputMode="decimal"
      value={draft}
      onChange={(e) => {
        const raw = e.target.value;
        if (!/^[-]?[0-9]*([.,][0-9]*)?$/.test(raw) && raw !== "") return;
        setDraft(raw);
        const parsed = Number(raw.replace(",", "."));
        if (!Number.isNaN(parsed)) onChange(parsed);
      }}
      onBlur={() => commit(draft)}
    />
  );
}
