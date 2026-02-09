import { Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { logout, me, type User } from "../lib/auth";

export default function AppLayout() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    me().then(setUser).catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "Utente";

  return (
    <div className="min-h-screen bg-brand-white text-brand-black">
      <header className="bg-brand-white border-b border-black/10">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src="/logo.png" alt="RP-Italsem" className="h-10 w-auto" />
            <div className="leading-tight">
              <div className="font-extrabold text-lg tracking-wide">RP-Italsem</div>
              <div className="text-xs text-black/60">Rapportini & Presenze</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="px-3 py-2 rounded-lg border border-black/10 text-sm font-semibold hover:bg-black/5">
              Dashboard
            </Link>
            <Link to="/export" className="px-3 py-2 rounded-lg border border-black/10 text-sm font-semibold hover:bg-black/5">
              Export
            </Link>
            {user?.role === "ADMIN" && (
              <Link to="/admin" className="px-3 py-2 rounded-lg border border-black/10 text-sm font-semibold hover:bg-black/5">
                Admin
              </Link>
            )}
            <span className="hidden sm:inline text-sm text-black/60">
              👤 {fullName}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-brand-orange text-brand-white font-bold hover:opacity-90 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
