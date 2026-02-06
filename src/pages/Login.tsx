import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";

export default function Login() {
  const nav = useNavigate();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await apiPost("/api/auth/login", { username, password });
      nav("/dashboard");
    } catch {
      setErr("Credenziali non valide");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-black/10 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col items-center gap-4">
            <img src="/logo.png" alt="Italsem" className="h-16 w-auto" />
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-black">Accesso RP-Italsem</h1>
              <p className="text-sm text-black/60 mt-1">Inserisci le credenziali per continuare</p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold">Username</label>
              <input
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--brand-orange)]"
                placeholder="es. admin"
                value={username}
                onChange={(e) => setU(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Password</label>
              <input
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--brand-orange)]"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setP(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {err && (
              <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-orange text-white font-extrabold py-2 hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Accesso..." : "Entra"}
            </button>

            <div className="text-center text-xs text-black/50 pt-2">© RP-Italsem</div>
          </form>
        </div>
      </div>
    </div>
  );
}
