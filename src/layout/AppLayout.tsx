import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { logout, me, type User } from "../lib/auth";

export default function AppLayout() {
  const [user, setUser] = useState<User | null>(null);
  const loc = useLocation();

  useEffect(() => {
    me().then(setUser).catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "Utente";

  const navBtn = (to: string, label: string) => {
    const active = loc.pathname.startsWith(to);
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${active ? "bg-black text-white border-black" : "border-black/15 hover:bg-black/5"}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-brand-white text-brand-black">
      <header className="bg-brand-white border-b border-black/10">
        <div className="w-full px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-3 shrink-0">
            <img src="/logo.png" alt="RP-Italsem" className="h-10 w-auto" />
            <div className="leading-tight">
              <div className="font-extrabold text-lg tracking-wide">RP-Italsem</div>
              <div className="text-xs text-black/60">Rapportini & Presenze</div>
            </div>
          </Link>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {navBtn("/dashboard", "Dashboard")}
            {navBtn("/export", "Export")}
            {user?.role === "ADMIN" && navBtn("/admin", "Admin")}
            <span className="hidden md:inline text-sm text-black/60 ml-2">👤 {fullName}</span>
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
