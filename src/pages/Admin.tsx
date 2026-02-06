import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";
import { me, type User } from "../lib/auth";

type DbUser = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  username: string;
  role: "ADMIN" | "USER";
  is_active: number;
  created_at: string;
};

export default function Admin() {
  const [tab, setTab] = useState<"users" | "lists">("users");
  const [current, setCurrent] = useState<User | null>(null);

  useEffect(() => { me().then(setCurrent).catch(() => setCurrent(null)); }, []);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold">Admin Panel</h1>
          <p className="text-sm text-black/60">Utenti e liste (cantieri, mezzi, dipendenti)</p>
        </div>
        <div className="text-sm text-black/60">
          Loggato come: <span className="font-semibold">{current ? `${current.firstName} ${current.lastName}` : "—"}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-lg border ${tab === "users" ? "bg-brand-orange text-white border-brand-orange" : "bg-white border-black/10"}`}
          onClick={() => setTab("users")}
        >
          Utenti
        </button>
        <button
          className={`px-4 py-2 rounded-lg border ${tab === "lists" ? "bg-brand-orange text-white border-brand-orange" : "bg-white border-black/10"}`}
          onClick={() => setTab("lists")}
        >
          Liste
        </button>
      </div>

      {tab === "users" ? <UsersPanel /> : <ListsPanel />}
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const data = await apiGet<DbUser[]>("/api/admin/users");
    setUsers(data);
  }

  useEffect(() => { refresh().catch(() => {}); }, []);

  async function createUser() {
    setMsg(null);
    try {
      await apiPost("/api/admin/users", { firstName, lastName, username, password, role });
      setFirst(""); setLast(""); setU(""); setP(""); setRole("USER");
      setMsg("Utente creato ✅");
      refresh();
    } catch (e: any) {
      setMsg("Errore creazione utente (username già esistente?)");
    }
  }

  async function toggle(u: DbUser) {
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      credentials: "include",
      body: JSON.stringify({ id: u.id, isActive: u.is_active !== 1, role: u.role })
    });
    refresh();
  }

  async function changeRole(u: DbUser) {
    const newRole = u.role === "ADMIN" ? "USER" : "ADMIN";
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      credentials: "include",
      body: JSON.stringify({ id: u.id, isActive: u.is_active === 1, role: newRole })
    });
    refresh();
  }

  async function resetPassword(u: DbUser) {
    const newPassword = prompt(`Nuova password per ${u.username}:`);
    if (!newPassword) return;
    await apiPost("/api/admin/users_reset_password", { id: u.id, newPassword });
    alert("Password aggiornata ✅");
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-black/10 rounded-2xl p-5">
        <div className="font-bold text-lg mb-3">Crea nuovo utente</div>

        <div className="grid gap-3 md:grid-cols-4">
          <input className="border border-black/15 rounded-lg px-3 py-2" placeholder="Nome"
            value={firstName} onChange={(e)=>setFirst(e.target.value)} />
          <input className="border border-black/15 rounded-lg px-3 py-2" placeholder="Cognome"
            value={lastName} onChange={(e)=>setLast(e.target.value)} />
          <input className="border border-black/15 rounded-lg px-3 py-2" placeholder="Username"
            value={username} onChange={(e)=>setU(e.target.value)} />
          <input className="border border-black/15 rounded-lg px-3 py-2" placeholder="Password"
            value={password} onChange={(e)=>setP(e.target.value)} type="password" />
        </div>

        <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-black/60">Ruolo:</span>
            <select className="border border-black/15 rounded-lg px-3 py-2"
              value={role} onChange={(e)=>setRole(e.target.value === "ADMIN" ? "ADMIN" : "USER")}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <button onClick={createUser}
            className="px-4 py-2 rounded-lg bg-brand-orange text-white font-bold hover:opacity-90">
            Crea utente
          </button>
        </div>

        {msg && <div className="text-sm mt-3 font-semibold">{msg}</div>}
      </div>

      <div className="bg-white border border-black/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-lg">Utenti</div>
          <button className="text-sm font-semibold text-brand-orange" onClick={refresh}>Aggiorna</button>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-black/10">
                <th className="py-2">Nome</th>
                <th>Username</th>
                <th>Ruolo</th>
                <th>Attivo</th>
                <th className="text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-black/5">
                  <td className="py-2">{(u.first_name ?? "") + " " + (u.last_name ?? "")}</td>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td>{u.is_active === 1 ? "SI" : "NO"}</td>
                  <td className="text-right space-x-2">
                    <button className="px-3 py-1 rounded-lg border border-black/10" onClick={()=>resetPassword(u)}>Reset PW</button>
                    <button className="px-3 py-1 rounded-lg border border-black/10" onClick={()=>changeRole(u)}>Cambia ruolo</button>
                    <button className="px-3 py-1 rounded-lg border border-black/10" onClick={()=>toggle(u)}>{u.is_active===1?"Disattiva":"Attiva"}</button>
                  </td>
                </tr>
              ))}
              {users.length===0 && (
                <tr><td className="py-4 text-black/60" colSpan={5}>Nessun utente.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ListsPanel() {
  const [sub, setSub] = useState<"cantieri"|"mezzi"|"dipendenti">("cantieri");
  const endpoint = useMemo(() => `/api/admin/${sub}`, [sub]);

  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [jsonText, setJsonText] = useState('{"descr":"Esempio"}');

  async function refresh() {
    const d = await apiGet<any[]>(endpoint);
    setItems(d);
  }
  useEffect(() => { refresh().catch(()=>{}); }, [endpoint]);

  const filtered = items.filter(it => JSON.stringify(it).toLowerCase().includes(search.toLowerCase()));

  async function addOrUpdate() {
    const obj = JSON.parse(jsonText);
    await apiPost(endpoint, obj);
    setJsonText('{"descr":"Esempio"}');
    refresh();
  }

  async function del(id:number) {
    await fetch(endpoint, {
      method: "DELETE",
      headers: {"Content-Type":"application/json"},
      credentials: "include",
      body: JSON.stringify({id})
    });
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["cantieri","mezzi","dipendenti"] as const).map(k => (
          <button key={k}
            onClick={()=>setSub(k)}
            className={`px-4 py-2 rounded-lg border ${sub===k ? "bg-brand-orange text-white border-brand-orange" : "bg-white border-black/10"}`}>
            {k}
          </button>
        ))}
      </div>

      <div className="bg-white border border-black/10 rounded-2xl p-5 space-y-3">
        <div className="font-bold">Aggiungi (v1 JSON)</div>
        <div className="text-xs text-black/60">Inserisci JSON con le colonne che esistono nella tabella (es. descr, codice, targa...).</div>
        <textarea className="w-full h-28 border border-black/15 rounded-lg p-3 font-mono text-sm"
          value={jsonText} onChange={(e)=>setJsonText(e.target.value)} />
        <button onClick={addOrUpdate}
          className="px-4 py-2 rounded-lg bg-brand-orange text-white font-bold hover:opacity-90">
          Salva
        </button>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="font-bold text-lg">Elenco {sub}</div>
          <input className="border border-black/15 rounded-lg px-3 py-2"
            placeholder="Search..."
            value={search} onChange={(e)=>setSearch(e.target.value)} />
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b border-black/10">
              <th className="py-2">ID</th><th>Record</th><th className="text-right">Azioni</th>
            </tr></thead>
            <tbody>
              {filtered.map(it => (
                <tr key={it.id} className="border-b border-black/5">
                  <td className="py-2">{it.id}</td>
                  <td className="font-mono text-xs">{JSON.stringify(it)}</td>
                  <td className="text-right">
                    <button className="px-3 py-1 rounded-lg border border-black/10" onClick={()=>del(it.id)}>
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={3} className="py-4 text-black/60">Nessun elemento.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
