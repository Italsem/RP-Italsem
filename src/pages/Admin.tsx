import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../lib/api";
import * as XLSX from "xlsx";

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

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

type U = { id: number; username: string; role: "ADMIN" | "USER"; is_active: number; first_name?: string; last_name?: string; created_at?: string };
type DailyPresence = {
  data: string;
  cantiere_code?: string;
  cantiere_desc?: string;
  tipo: string;
  codice: string;
  descrizione: string;
  note_riga?: string;
  ordinario?: number;
  notturno?: number;
  pioggia?: number;
  malattia?: number;
  trasferta?: number;
};
type BackupResp = {
  ok: true;
  generated_at: string;
  source?: string;
  tables: Record<string, Record<string, any>[]>;
  rapportini_daily: DailyPresence[];
};
type StorageResp = {
  ok: true;
  quota_bytes: number;
  used_bytes: number;
  free_bytes: number;
  used_percent: number;
  rapportini_bytes: number;
  approx: boolean;
  breakdown: { table: string; rows: number; bytes: number }[];
};

export default function Admin() {
  const [users, setUsers] = useState<U[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [first_name, setFirst] = useState("");
  const [last_name, setLast] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");

  const [importType, setImportType] = useState<"cantieri" | "mezzi" | "dipendenti">("cantieri");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [backuping, setBackuping] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storage, setStorage] = useState<StorageResp | null>(null);

  const loadUsers = async () => {
    const r = await apiGet<{ ok: true; users: U[] }>("/api/admin/users");
    setUsers(r.users || []);
  };

  const loadStorage = async () => {
    setStorageLoading(true);
    try {
      const s = await apiGet<StorageResp>(`/api/admin/storage?t=${Date.now()}`);
      setStorage(s);
    } finally {
      setStorageLoading(false);
    }
  };

  const load = async () => {
    setErr(null);
    try {
      await Promise.all([loadUsers(), loadStorage()]);
    } catch (e: any) {
      setErr(e.message || "Errore");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createUser = async () => {
    try {
      await apiPost("/api/admin/users", { first_name, last_name, username, password, role });
      setFirst("");
      setLast("");
      setUsername("");
      setPassword("");
      setRole("USER");
      await loadUsers();
      alert("Utente creato!");
    } catch (e: any) {
      alert(e.message || "Errore");
    }
  };

  const runImport = async () => {
    if (!importFile) return alert("Seleziona un file Excel prima di importare");
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("type", importType);
      fd.append("file", importFile);
      const r = await fetch("/api/admin/import", { method: "POST", credentials: "include", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      alert(`Import completato ✅ Righe aggiornate: ${j.upserted ?? 0}`);
      setImportFile(null);
      await loadStorage();
    } catch (e: any) {
      alert(e.message || "Errore import");
    } finally {
      setImporting(false);
    }
  };

  const getBackupData = async () => apiGet<BackupResp>(`/api/admin/backup?t=${Date.now()}`);

  const runBackupJson = async () => {
    setBackuping(true);
    try {
      const data = await getBackupData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
      downloadBlob(blob, `backup_db_${data.generated_at.slice(0, 10)}.json`);
      await loadStorage();
      return true;
    } catch (e: any) {
      alert(e.message || "Errore backup DB");
      return false;
    } finally {
      setBackuping(false);
    }
  };

  const runBackupExcel = async () => {
    setBackuping(true);
    try {
      const data = await getBackupData();
      const wb = XLSX.utils.book_new();

      const flatRows = data.rapportini_daily || [];
      const wsFlat = XLSX.utils.json_to_sheet(flatRows);
      XLSX.utils.book_append_sheet(wb, wsFlat, "presenze_raw");

      const byDay: Record<string, DailyPresence[]> = {};
      for (const row of flatRows) {
        const day = row.data || "SENZA_DATA";
        byDay[day] = byDay[day] || [];
        byDay[day].push(row);
      }

      Object.keys(byDay)
        .sort()
        .forEach((day) => {
          const rows = [...byDay[day]].sort((a, b) => {
            const ac = `${a.cantiere_code || ""} ${a.cantiere_desc || ""}`;
            const bc = `${b.cantiere_code || ""} ${b.cantiere_desc || ""}`;
            return ac.localeCompare(bc);
          });
          const ws = XLSX.utils.json_to_sheet(rows);
          XLSX.utils.book_append_sheet(wb, ws, day.slice(0, 31));
        });

      Object.entries(data.tables || {}).forEach(([name, rows]) => {
        const ws = XLSX.utils.json_to_sheet(rows || []);
        XLSX.utils.book_append_sheet(wb, ws, `tbl_${name}`.slice(0, 31));
      });

      const arr = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
      downloadBlob(new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `backup_rapportini_${data.generated_at.slice(0, 10)}.xlsx`);
      await loadStorage();
    } catch (e: any) {
      alert(e.message || "Errore backup Excel");
    } finally {
      setBackuping(false);
    }
  };

  const runBackupPdf = async () => {
    setBackuping(true);
    try {
      const data = await getBackupData();
      const byDay: Record<string, DailyPresence[]> = {};
      for (const row of data.rapportini_daily || []) {
        const key = row.data || "SENZA_DATA";
        byDay[key] = byDay[key] || [];
        byDay[key].push(row);
      }

      const content: any[] = [
        { text: "Backup presenze (giorno -> cantiere)", style: "title" },
        { text: `Generato il: ${data.generated_at} • Fonte: ${data.source || "n/d"}`, style: "subtitle", margin: [0, 0, 0, 8] },
      ];

      Object.keys(byDay)
        .sort()
        .forEach((day, idxDay) => {
          content.push({ text: `Data: ${day}`, bold: true, margin: [0, idxDay === 0 ? 0 : 10, 0, 4] });

          const byCantiere: Record<string, DailyPresence[]> = {};
          for (const r of byDay[day]) {
            const k = [r.cantiere_code || "SENZA_CANTIERE", r.cantiere_desc || ""].join(" — ");
            byCantiere[k] = byCantiere[k] || [];
            byCantiere[k].push(r);
          }

          Object.keys(byCantiere)
            .sort()
            .forEach((cant) => {
              const body = [["Tipo", "Codice", "Descrizione", "Ord", "Nott", "Piog", "Mal", "Trasf", "Note"]];
              byCantiere[cant].forEach((r) => {
                body.push([
                  r.tipo || "",
                  r.codice || "",
                  r.descrizione || "",
                  String(r.ordinario ?? 0),
                  String(r.notturno ?? 0),
                  String(r.pioggia ?? 0),
                  String(r.malattia ?? 0),
                  String(r.trasferta ?? 0),
                  String(r.note_riga ?? ""),
                ]);
              });

              content.push({ text: `Cantiere: ${cant}`, margin: [0, 6, 0, 3] });
              content.push({ table: { headerRows: 1, widths: [40, 55, "*", 30, 30, 30, 30, 35, 130], body }, fontSize: 8, layout: "lightHorizontalLines" });
            });
        });

      if (Object.keys(byDay).length === 0) {
        content.push({ text: "Nessuna presenza trovata nel backup.", italics: true });
      }

      const pm = await ensurePdfMake();
      pm.createPdf({ content, pageOrientation: "landscape", styles: { title: { fontSize: 16, bold: true }, subtitle: { fontSize: 10, color: "#666" } } }).download(`backup_rapportini_${data.generated_at.slice(0, 10)}.pdf`);
      await loadStorage();
    } catch (e: any) {
      alert(e.message || "Errore backup PDF");
    } finally {
      setBackuping(false);
    }
  };

  const runCleanupRapportini = async () => {
    if (cleaning || backuping) return;
    const proceedWithBackup = window.confirm("Prima della pulizia dei rapportini vuoi fare un backup? Premi OK per fare backup e continuare. Premi Annulla per fermare la pulizia.");
    if (!proceedWithBackup) return;

    const backupOk = await runBackupJson();
    if (!backupOk) return;

    const confirmDelete = window.confirm("Confermi la pulizia completa dei rapportini/presenze? Questa operazione è irreversibile.");
    if (!confirmDelete) return;

    setCleaning(true);
    try {
      const res = await apiPost<{ ok: true; deleted: number; deleted_rapportini?: number; deleted_day_sheets?: number }>("/api/admin/cleanup_rapportini", {});
      alert(`Pulizia completata ✅ Totale eliminati: ${res.deleted ?? 0} (rapportini: ${res.deleted_rapportini ?? 0}, day_sheets: ${res.deleted_day_sheets ?? 0})`);
      await loadStorage();
    } catch (e: any) {
      alert(e.message || "Errore pulizia rapportini");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pannello Admin</h1>
          <div className="text-sm text-gray-600">Gestione utenti + import liste + configurazioni.</div>
        </div>
        <a className="rounded-xl border px-4 py-2" href="/">
          ← Dashboard
        </a>
      </div>

      {err && <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-red-700">{err}</div>}

      <div className="mt-4 rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold">Spazio database</div>
          <button className="rounded-lg border px-3 py-1 text-sm" onClick={loadStorage} disabled={storageLoading || backuping || cleaning}>
            {storageLoading ? "Aggiornamento..." : "Aggiorna"}
          </button>
        </div>
        <div className="text-sm text-gray-600 mb-3">
          Stima dello spazio occupato (calcolo approssimato dai dati serializzati). Presenze/rapportini: <b>{formatBytes(storage?.rapportini_bytes || 0)}</b>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full bg-brand-orange transition-all" style={{ width: `${storage?.used_percent ?? 0}%` }} />
        </div>
        <div className="mt-2 text-sm text-gray-700">
          {storageLoading ? "Calcolo in corso..." : `${formatBytes(storage?.used_bytes || 0)} usati su ${formatBytes(storage?.quota_bytes || 0)} • liberi: ${formatBytes(storage?.free_bytes || 0)} (${(storage?.used_percent || 0).toFixed(2)}%)`}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {(storage?.breakdown || []).map((row) => (
            <div key={row.table} className="rounded-lg border px-3 py-2 text-sm">
              <b>{row.table}</b> — {row.rows} righe — {formatBytes(row.bytes)}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <div className="mb-2 font-semibold">Crea nuovo utente / admin</div>
          <div className="grid gap-2">
            <input className="rounded-xl border px-3 py-2" placeholder="Nome (es. Luca)" value={first_name} onChange={(e) => setFirst(e.target.value)} />
            <input className="rounded-xl border px-3 py-2" placeholder="Cognome (es. Franceschetti)" value={last_name} onChange={(e) => setLast(e.target.value)} />
            <input className="rounded-xl border px-3 py-2" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input className="rounded-xl border px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <select className="rounded-xl border px-3 py-2" value={role} onChange={(e) => setRole(e.target.value as any)}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <button className="rounded-xl bg-black px-4 py-2 text-white" onClick={createUser}>
              Crea
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="mb-2 font-semibold">Utenti esistenti</div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Username</th>
                  <th className="p-2 text-left">Nome</th>
                  <th className="p-2 text-left">Ruolo</th>
                  <th className="p-2 text-left">Attivo</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="p-2 font-medium">{u.username}</td>
                    <td className="p-2">
                      {(u.first_name || "")} {(u.last_name || "")}
                    </td>
                    <td className="p-2">{u.role}</td>
                    <td className="p-2">{u.is_active ? "SI" : "NO"}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td className="p-4 text-gray-600" colSpan={4}>
                      Nessun utente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border bg-white p-4">
        <div className="font-semibold">Import Excel (cantieri / mezzi / operai)</div>
        <div className="text-sm text-gray-600 mb-3">Importa un file xlsx/xls/csv per aggiornare le anagrafiche. Se il codice esiste, la riga viene aggiornata.</div>

        <div className="grid gap-3 md:grid-cols-4">
          <select className="rounded-xl border px-3 py-2" value={importType} onChange={(e) => setImportType(e.target.value as any)}>
            <option value="cantieri">Cantieri</option>
            <option value="mezzi">Mezzi</option>
            <option value="dipendenti">Operai</option>
          </select>
          <input className="rounded-xl border px-3 py-2 md:col-span-2" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
          <button className="rounded-xl bg-brand-orange px-4 py-2 text-white font-bold" onClick={runImport} disabled={importing}>
            {importing ? "Import in corso..." : "Importa / Aggiorna"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border bg-white p-4">
        <div className="font-semibold">Backup amministratore</div>
        <div className="text-sm text-gray-600 mb-3">Scarica un backup completo del DB e delle presenze divise per giornata e cantiere (JSON, Excel, PDF).</div>
        <div className="grid gap-3 md:grid-cols-3">
          <button className="rounded-xl border px-4 py-2" onClick={runBackupJson} disabled={backuping || cleaning}>
            {backuping ? "Elaborazione..." : "Backup DB (JSON)"}
          </button>
          <button className="rounded-xl bg-brand-orange px-4 py-2 text-white font-bold" onClick={runBackupExcel} disabled={backuping || cleaning}>
            {backuping ? "Elaborazione..." : "Presenze Giorno/Cantiere (Excel)"}
          </button>
          <button className="rounded-xl bg-black px-4 py-2 text-white" onClick={runBackupPdf} disabled={backuping || cleaning}>
            {backuping ? "Elaborazione..." : "Presenze Giorno/Cantiere (PDF)"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="font-semibold text-red-700">Pulizia rapportini</div>
        <div className="text-sm text-red-700/80 mb-3">Elimina tutti i rapportini/presenze per liberare spazio. Prima della cancellazione viene richiesto obbligatoriamente il backup.</div>
        <button className="rounded-xl bg-red-600 px-4 py-2 text-white font-bold" onClick={runCleanupRapportini} disabled={cleaning || backuping}>
          {cleaning ? "Pulizia in corso..." : "Pulisci rapportini"}
        </button>
      </div>
    </div>
  );
}
