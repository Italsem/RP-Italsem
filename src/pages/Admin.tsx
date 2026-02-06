import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";

type UserRow = {
  id: number;
  username: string;
  role: "ADMIN" | "USER";
  is_active: number;
  created_at?: string;
  first_name?: string | null;
  last_name?: string | null;
};

export default function Admin() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // form create user/admin
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const r = await apiGet("/api/admin/users");
      setUsers(r.users || []);
    } catch (e: any) {
      setMsg(e?.message || "Errore caricamento utenti");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => b.id - a.id);
  }, [users]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await apiPost("/api/admin/users", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        password,
        role,
      });

      setFirstName("");
      setLastName("");
      setUsername("");
      setPassword("");
      setRole("USER");

      setMsg("✅ Utente creato!");
      await load();
    } catch (err: any) {
      setMsg(err?.message || "Errore creazione utente");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <p className="text-sm text-slate-600 mt-1">
        Qui puoi creare utenti/admin. (Liste cantieri/mezzi/dipendenti: le rimettiamo subito dopo, appena stabilizziamo il deploy.)
      </p>

      {msg && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm">
          {msg}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* CREATE USER */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Crea nuovo utente / admin</h2>

          <form className="mt-4 grid gap-3" onSubmit={onCreate}>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="es. Luca"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Cognome</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="es. Franceschetti"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Username</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="es. luca"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min 6 caratteri"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Ruolo</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300"
                value={role}
                onChange={(e) => setRole(e.target.value === "ADMIN" ? "ADMIN" : "USER")}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <button
              className="mt-2 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
              type="submit"
            >
              Crea
            </button>
          </form>
        </div>

        {/* USERS LIST */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Utenti</h2>
            <button
              onClick={load}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              Aggiorna
            </button>
          </div>

          {loading ? (
            <div className="mt-4 text-sm text-slate-600">Caricamento…</div>
          ) : (
            <div className="mt-4 overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">Nome</th>
                    <th className="py-2 pr-3">Username</th>
                    <th className="py-2 pr-3">Ruolo</th>
                    <th className="py-2 pr-3">Attivo</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((u) => (
                    <tr key={u.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3">{u.id}</td>
                      <td className="py-2 pr-3">
                        {(u.first_name || "") + " " + (u.last_name || "")}
                      </td>
                      <td className="py-2 pr-3">{u.username}</td>
                      <td className="py-2 pr-3">
                        <span
                          className={
                            u.role === "ADMIN"
                              ? "rounded-full bg-black px-2 py-1 text-white"
                              : "rounded-full bg-slate-100 px-2 py-1"
                          }
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2 pr-3">{u.is_active ? "SI" : "NO"}</td>
                    </tr>
                  ))}
                  {sorted.length === 0 && (
                    <tr>
                      <td className="py-3 text-slate-500" colSpan={5}>
                        Nessun utente trovato.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-xs text-slate-500">
            Nota: ora le password vengono salvate **hashate** + salt.
          </div>
        </div>
      </div>
    </div>
  );
}
