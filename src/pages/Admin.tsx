import { useState } from "react";
import * as XLSX from "xlsx";
import { apiPost } from "../lib/api";

type ImportKind = "cantieri" | "mezzi" | "dipendenti";

function readFirstSheetRows(file: File) {
  return new Promise<any[]>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Errore lettura file"));
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        resolve(json as any[]);
      } catch (e) {
        reject(e);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export default function Admin() {
  const [status, setStatus] = useState<string>("");

  async function handleImport(kind: ImportKind, file: File | null) {
    if (!file) return;

    try {
      setStatus(`Leggo Excel (${kind})...`);
      const rows = await readFirstSheetRows(file);

      setStatus(`Invio ${rows.length} righe al server (${kind})...`);
      const res = await apiPost<{ ok: boolean; inserted: number }>(
        `/api/admin/import/${kind}`,
        { rows }
      );

      setStatus(`✅ Import ${kind} completato: ${res.inserted} righe inserite/aggiornate`);
    } catch (e: any) {
      console.error(e);
      setStatus(`❌ Errore import ${kind}: ${String(e?.message ?? e)}`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm border">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-slate-600 mt-1">
            Carica gli Excel per popolare il database (cantieri, mezzi, dipendenti).
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ImportCard
              title="Import Cantieri"
              subtitle="Excel con colonne: Codice, Descrizione"
              onImport={(f) => handleImport("cantieri", f)}
            />
            <ImportCard
              title="Import Mezzi"
              subtitle="Excel con colonne: Codice, Descrizione"
              onImport={(f) => handleImport("mezzi", f)}
            />
            <ImportCard
              title="Import Dipendenti"
              subtitle="Excel con colonne: Codice, Nome, Cognome, Descrizione"
              onImport={(f) => handleImport("dipendenti", f)}
            />
          </div>

          <div className="mt-6 rounded-xl border bg-slate-50 p-4 text-sm">
            <div className="font-semibold">Stato</div>
            <div className="mt-1 text-slate-700 whitespace-pre-wrap">{status || "—"}</div>
          </div>

          <div className="mt-6 text-xs text-slate-500">
            Nota: per ora l’auth è disabilitata (tutti admin). La rimettiamo dopo.
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportCard({
  title,
  subtitle,
  onImport,
}: {
  title: string;
  subtitle: string;
  onImport: (file: File | null) => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-slate-600 mt-1">{subtitle}</div>

      <input
        className="mt-3 block w-full text-sm"
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <button
        className="mt-3 w-full rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        onClick={() => onImport(file)}
        disabled={!file}
      >
        Importa
      </button>
    </div>
  );
}
