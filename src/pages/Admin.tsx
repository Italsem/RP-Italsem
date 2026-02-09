import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../lib/api";

type U = { id: number; username: string; role: "ADMIN" | "USER"; is_active: number; first_name?: string; last_name?: string; created_at?: string };

export default function Admin() {
  const [users, setUsers] = useState<U[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [first_name, setFirst] = useState("");
  const [last_name, setLast] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");

  const load = async () => {
    setErr(null);
    try {
      const r = await apiGet<{ ok: true; users: U[] }>("/api/admin/users");
      setUsers(r.users || []);
    } catch (e: any) {
      setErr(e.message || "Errore");
    }
  };

  useEffect(() => { load(); }, []);

  const createUser = async () => {
    try {
      await apiPost("/api/admin/users", { first_name, last_name, username, password, role });
      setFirst(""); setLast(""); setUsername(""); setPassword(""); setRole("USER");
      await load();
      alert("Utente creato!");
    } catch (e: any) {
      alert(e.message || "Errore");
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pannello Admin</h1>
          <div className="text-sm text-gray-600">Gestione utenti + import liste + configurazioni.</div>
        </div>
        <a className="rounded-xl border px-4 py-2" href="/">← Dashboard</a>
      </div>

      {err && <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-red-700">{err}</div>}

      <div className="grid gap-4 md:grid-cols-2">
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
                    <td className="p-2">{(u.first_name || "")} {(u.last_name || "")}</td>
                    <td className="p-2">{u.role}</td>
                    <td className="p-2">{u.is_active ? "SI" : "NO"}</td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td className="p-4 text-gray-600" colSpan={4}>Nessun utente</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QUI sotto lasci la tua parte di import Excel già funzionante */}
      <div className="mt-4 rounded-2xl border bg-white p-4">
        <div className="font-semibold">Import Excel</div>
        <div className="text-sm text-gray-600">
          Mantieni la tua sezione di import (cantieri/mezzi/dipendenti) già fatta.
        </div>
      </div>
    </div>
  );
}
