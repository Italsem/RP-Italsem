import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../lib/auth";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation() as any;

import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../lib/auth";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation() as any;

  const from = useMemo(() => loc?.state?.from ?? "/dashboard", [loc]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      await login(username.trim(), password);

      // 🔥 FORZIAMO redirect e refresh stato
      window.location.href = from;
    } catch {
      setErr("Credenziali non valide");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-white px-4">
      <div className="w-full max-w-md border border-black/10 rounded-2xl p-8 shadow-lg bg-white">
        <img src="/logo.png" alt="RP-Italsem" className="h-14 mx-auto mb-4" />

        <h1 className="text-2xl font-extrabold text-center mb-1">
          Accesso RP-Italsem
        </h1>
        <p className="text-sm text-center text-black/60 mb-8">
          Inserisci le credenziali per continuare
        </p>

        <form onSubmit={onSubmit}>
          <label className="block text-sm font-semibold mb-1">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-black/15 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            placeholder="es. admin"
            autoComplete="username"
          />

          <label className="block text-sm font-semibold mb-1">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full border border-black/15 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {err && (
            <div className="text-sm text-red-600 font-semibold mb-3">
              {err}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full bg-brand-orange text-brand-white rounded-lg py-2.5 font-bold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Accesso..." : "Entra"}
          </button>
        </form>

        <div className="mt-6 text-xs text-black/50 text-center">© RP-Italsem</div>
      </div>
    </div>
  );
}
