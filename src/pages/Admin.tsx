import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../lib/api";

type UserRow = {
  id: number;
  username: string;
  role: "ADMIN" | "USER";
  is_active: number;
  first_name?: string | null;
  last_name?: string | null;
};

export default function Admin() {
  const [tab, setTab] = useState<"users" | "lists">("lists");

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Admin Panel</h1>
        <p className="text-sm text-black/60">Utenti + Import liste Excel</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 rounded-lg font-bold border ${
            tab === "users" ? "bg-brand-orange text-white border-brand-orange" : "bg-white border-black/10"
          }`}
        >
          Utenti
        </button>
        <button
          onClick={() => setTab("lists")}
          className={`px-4 py-2 rounded-lg font-bold border ${
            tab === "lists" ? "bg-brand-orange text-white border-brand-orange" : "bg-white border-black/10"
          }`}
        >
          Liste (Excel)
        </button>
      </div>

      {tab === "users" ? <UsersPanel /> : <ListsImportPanel />}
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [first_name, setFirst] = useState("");
  const [last_name, setLast] = useState("");
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");

  async function load() {
    const r = await apiGet<UserRow[]>("/api/admin/users");
    setUsers(r);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="bg-white border border-black/10 rounded-2xl p-5">
        <div className="font-bold text-lg mb-3">Crea utente</div>
        <div className="grid gap-3">
          <input className="border rounded-lg px-3 py-2" placeholder="Nome" value={first_name} onChange={(e) => setFirst(e.target.value)} />
          <input className="border rounded-lg px-3 py-2" placeholder="Cognome" value={last_name} onChange={(e) => setLast(e.target.value)} />
          <input className="border rounded-lg px-3 py-2" placeholder="Username" value={username} onChange={(e) => setU(e.target.value)} />
          <input className="border rounded-lg px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setP(e.target.value)} />
          <select className="border rounded-lg px-3 py-2" value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button
            className="bg-brand-orange text-white font-bold rounded-lg py-2 hover:opacity-90"
            onClick={async () => {
              await apiPost("/api/admin/users", { first_name, last_name, username, password, role });
              setFirst(""); setLast(""); setU(""); setP(""); setRole("USER");
              await load();
              alert("Creato ✅");
            }}
          >
            Crea
          </button>
        </div>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl p-5">
        <div className="font-bold text-lg mb-3">Utenti</div>
        <div className="space-y-2 max-h-[420px] overflow-auto">
          {users.map((u) => (
            <div key={u.id} className="border border-black/10 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-bold">
                  {(u.first_name ?? "")} {(u.last_name ?? "")} <span className="text-black/50">({u.username})</span>
                </div>
                <div className="text-xs text-black/60">{u.role} — {u.is_active ? "ATTIVO" : "DISATTIVO"}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-3 px-4 py-2 rounded-lg border border-black/10 font-bold" onClick={load}>Aggiorna</button>
      </div>
    </div>
  );
}

function ListsImportPanel() {
  const [type, setType] = useState<"cantieri" | "mezzi" | "dipendenti">("cantieri");
  const [status, setStatus] = useState<string>("");

  async function importFile(file: File) {
    setStatus("Leggo Excel...");

    const data = await file.arrayBuffer();

    // ✅ import dinamico (più stabile con Vite/Cloudflare)
    const XLSX = await import("xlsx");
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });

    if (type === "dipendenti") {
      const ok = rows.some((r) => "Codice" in r && "Nome" in r && "Cognome" in r);
      if (!ok) { setStatus("Excel dipendenti non valido (mancano Codice/Nome/Cognome)"); return; }
    } else {
      const ok = rows.some((r) => "Codice" in r && "Descrizione" in r);
      if (!ok) { setStatus("Excel non valido (mancano Codice/Descrizione)"); return; }
    }

    setStatus(`Invio al DB (${rows.length} righe)...`);
    await apiPost(`/api/admin/import/${type}`, { rows });
    setStatus(`Import completato ✅ (${rows.length} righe)`);
  }

  return (
    <div className="bg-white border border-black/10 rounded-2xl p-5 space-y-4">
      <div className="font-bold text-lg">Importa liste da Excel</div>

      <div className="grid gap-3 md:grid-cols-3 items-end">
        <div>
          <div className="text-sm font-semibold mb-1">Tipo lista</div>
          <select className="border rounded-lg px-3 py-2 w-full" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="cantieri">Cantieri</option>
            <option value="mezzi">Mezzi</option>
            <option value="dipendenti">Dipendenti</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <div className="text-sm font-semibold mb-1">Seleziona file Excel</div>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); }}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>
      </div>

      <div className="text-sm text-black/60">
        * Cantieri/Mezzi: colonne <b>Codice</b>, <b>Descrizione</b><br />
        * Dipendenti: colonne <b>Codice</b>, <b>Nome</b>, <b>Cognome</b>, <b>Descrizione</b>
      </div>

      {status && <div className="text-sm font-semibold">{status}</div>}
    </div>
  );
}
