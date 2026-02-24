import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function initialDateFromUrl() {
  const q = new URLSearchParams(window.location.search).get("date");
  return q || todayISO();
}

type Cantiere = any;
type ListsResponse<T> = { ok: true; items: T[] };
type OperaiTotals = {
  ordinario: number;
  trasferta: number;
  notturno: number;
  malattia: number;
  pioggia: number;
};

function fmt(v: number) {
  if (!Number.isFinite(v)) return "0";
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
}

export default function DashboardDay() {
  const [date, setDate] = useState(initialDateFromUrl());
  const [active, setActive] = useState<any[]>([]);
  const [cantieri, setCantieri] = useState<Cantiere[]>([]);
  const [addCode, setAddCode] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addInternalDesc, setAddInternalDesc] = useState("");
  const [cantiereInput, setCantiereInput] = useState("");
  const [copyFromDate, setCopyFromDate] = useState(todayISO());
  const [copyToDate, setCopyToDate] = useState(todayISO());

  const dayTotals = useMemo<OperaiTotals>(() => {
    return active.reduce(
      (acc: OperaiTotals, c: any) => {
        const t = c?.operai_totals || {};
        acc.ordinario += Number(t.ordinario || 0);
        acc.trasferta += Number(t.trasferta || 0);
        acc.notturno += Number(t.notturno || 0);
        acc.malattia += Number(t.malattia || 0);
        acc.pioggia += Number(t.pioggia || 0);
        return acc;
      },
      { ordinario: 0, trasferta: 0, notturno: 0, malattia: 0, pioggia: 0 }
    );
  }, [active]);

  const cantieriOptions = useMemo(
    () =>
      cantieri
        .map((c) => ({
          code: String(c.Codice ?? c.codice ?? c.code ?? "").trim(),
          desc: String(c.Descrizione ?? c.descrizione ?? c.desc ?? "").trim(),
        }))
        .filter((x) => x.code),
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

  useEffect(() => {
    const u = new URL(window.location.href);
    u.searchParams.set("date", date);
    window.history.replaceState(null, "", `${u.pathname}?${u.searchParams.toString()}`);
  }, [date]);

  function resolveCantiere(v: string) {
    const value = String(v || "").trim();
    if (!value) return { code: "", desc: "" };

    const exact = cantieriOptions.find((o) => value === `${o.code} - ${o.desc}` || value === o.code || value === o.desc);
    if (exact) return { code: exact.code, desc: exact.desc || exact.code };

    const m = value.match(/^(.+?)\s-\s(.*)$/);
    if (m) {
      const code = m[1].trim();
      const desc = m[2].trim();
      return { code, desc: desc || code };
    }
    return { code: value, desc: value };
  }

  function onPickCantiere(v: string) {
    setCantiereInput(v);
    const r = resolveCantiere(v);
    setAddCode(r.code);
    setAddDesc(r.desc);
  }

  async function duplicateDay() {
    if (!copyFromDate || !copyToDate) return alert("Seleziona entrambe le date");
    if (copyFromDate === copyToDate) return alert("La data sorgente e destinazione devono essere diverse");
    try {
      const r = await apiPost<{ ok: boolean; copied: number }>("/api/day/duplicate", { from_date: copyFromDate, to_date: copyToDate });
      alert(`Giornata duplicata ✅ Cantieri copiati: ${r.copied ?? 0}`);
      if (copyToDate === date) await loadActive();
    } catch (e: any) {
      alert(e?.message || "Errore duplicazione giornata");
    }
  }




  async function duplicateSingleCantiere(code: string) {
    if (!copyFromDate || !copyToDate) return alert("Seleziona entrambe le date");
    if (copyFromDate === copyToDate) return alert("La data sorgente e destinazione devono essere diverse");
    try {
      const r = await apiPost<{ ok: boolean; copied: number }>("/api/day/duplicate", {
        from_date: copyFromDate,
        to_date: copyToDate,
        cantiere_code: code,
      });
      alert(`Cantiere ${code} copiato ✅ Record copiati: ${r.copied ?? 0}`);
      if (copyToDate === date) await loadActive();
    } catch (e: any) {
      alert(e?.message || "Errore copia cantiere");
    }
  }

  async function removeCantiereFromDay(code: string) {
    if (!confirm(`Confermi eliminazione cantiere ${code} dalla giornata ${date}?`)) return;
    try {
      await apiPost("/api/day/remove_cantiere", { work_date: date, cantiere_code: code });
      await loadActive();
    } catch (e: any) {
      alert(e?.message || "Errore eliminazione cantiere");
    }
  }

  async function addCantiereToDay() {
    const resolved = resolveCantiere(cantiereInput);
    const code = resolved.code || addCode;
    const desc = resolved.desc || addDesc;

    if (!code) {
      alert("Seleziona un cantiere");
      return;
    }

    const payload = { rows: [], internal_desc: addInternalDesc || "" };
    await apiPost("/api/day/sheet", { work_date: date, cantiere_code: code, cantiere_desc: desc || code, payload });

    setAddCode("");
    setAddDesc("");
    setAddInternalDesc("");
    setCantiereInput("");
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
          <input type="date" className="border rounded-lg px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="text-xs text-black/60">Per copiare un singolo cantiere usa il pulsante “Copia cantiere” nella lista sotto.</div>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl p-5 space-y-3">
        <div className="font-bold text-lg">Duplica giornata lavorativa</div>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-sm text-black/60 mb-1">Copia da data</div>
            <input type="date" className="border rounded-lg px-3 py-2 w-full" value={copyFromDate} onChange={(e)=>setCopyFromDate(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-black/60 mb-1">Incolla su data</div>
            <input type="date" className="border rounded-lg px-3 py-2 w-full" value={copyToDate} onChange={(e)=>setCopyToDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 rounded-lg bg-black text-white font-bold hover:opacity-90 w-full" onClick={duplicateDay}>Duplica giornata</button>
          </div>
        </div>
        <div className="text-xs text-black/60">Per copiare un singolo cantiere usa il pulsante “Copia cantiere” nella lista sotto.</div>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl p-5 space-y-3">
        <div className="font-bold text-lg">Aggiungi cantiere alla giornata</div>

        <datalist id="dl-cantieri">
          {cantieriOptions.map((c, i) => <option key={i} value={`${c.code} - ${c.desc || c.code}`} />)}
        </datalist>

        <input
          className="border rounded-lg px-3 py-2 w-full"
          placeholder="Cerca cantiere (autocomplete)..."
          list="dl-cantieri"
          value={cantiereInput}
          onChange={(e) => onPickCantiere(e.target.value)}
        />

        <input
          className="border rounded-lg px-3 py-2 w-full"
          placeholder="Piccola descrizione interna (es. SS36 LAGO DI COMO E DELLO SPLUGA)"
          value={addInternalDesc}
          onChange={(e) => setAddInternalDesc(e.target.value)}
        />

        <button className="px-4 py-2 rounded-lg bg-brand-orange text-white font-bold hover:opacity-90" onClick={addCantiereToDay}>
          Crea / Aggiungi
        </button>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl p-5">
        <div className="mb-4 rounded-xl border border-brand-orange/30 bg-brand-orange/5 px-4 py-3">
          <div className="text-xs font-semibold text-brand-orange">TOTALE PRESENZE CANTIERI ({date}) — SOLO OPERAI</div>
          <div className="mt-1 text-sm font-bold text-black/80">
            {fmt(dayTotals.ordinario)} Ordinario · {fmt(dayTotals.trasferta)} Trasferte · {fmt(dayTotals.notturno)} Notturni · {fmt(dayTotals.malattia)} Malattia · {fmt(dayTotals.pioggia)} Pioggia
          </div>
        </div>

        <div className="font-bold text-lg mb-3">Cantieri attivi ({active.length})</div>

        <div className="grid gap-3 md:grid-cols-2">
          {active.map((c: any) => (
            <div key={c.cantiere_code} className="border border-black/10 rounded-xl p-4 hover:bg-black/5 transition">
              <div className="flex items-start justify-between gap-3">
                <a
                  className="block flex-1"
                  href={`/day/edit?date=${encodeURIComponent(date)}&cantiere_code=${encodeURIComponent(c.cantiere_code)}&returnDate=${encodeURIComponent(date)}`}
                >
                  <div className="font-extrabold">{c.cantiere_code}</div>
                  {c.internal_desc ? <div className="text-sm text-black/80 font-semibold">{c.internal_desc}</div> : null}
                  <div className="text-sm text-black/70">{c.cantiere_desc}</div>
                  <div className="text-xs font-semibold text-black/70 mt-1">
                    Operai: {fmt(c?.operai_totals?.ordinario || 0)} Ordinario · {fmt(c?.operai_totals?.trasferta || 0)} Trasferte · {fmt(c?.operai_totals?.notturno || 0)} Notturni · {fmt(c?.operai_totals?.malattia || 0)} Malattia · {fmt(c?.operai_totals?.pioggia || 0)} Pioggia
                  </div>
                  <div className="text-xs text-black/50 mt-1">Aggiornato: {c.updated_at}</div>
                </a>
                <div className="flex flex-col gap-2">
                  <button
                    className="px-3 py-1 rounded-lg border border-black/20 text-xs font-bold hover:bg-black/5"
                    onClick={() => duplicateSingleCantiere(c.cantiere_code)}
                    title={`Copia ${c.cantiere_code} da ${copyFromDate} a ${copyToDate}`}
                  >
                    Copia cantiere
                  </button>
                  <button
                    className="px-3 py-1 rounded-lg border border-red-300 text-red-700 text-xs font-bold hover:bg-red-50"
                    onClick={() => removeCantiereFromDay(c.cantiere_code)}
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          ))}
          {active.length === 0 && <div className="text-sm text-black/60">Nessun cantiere per questa data.</div>}
        </div>
      </div>
    </div>
  );
}
