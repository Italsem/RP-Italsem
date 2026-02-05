import { Outlet, Link, useNavigate } from "react-router-dom";

export default function AppLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    // (poi lo collegheremo all’API)
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-brand-white text-brand-black">
      {/* HEADER BIANCO */}
      <header className="bg-brand-white border-b border-black/10">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          {/* Logo + titolo */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="RP-Italsem"
              className="h-10 w-auto"
            />
            <div className="leading-tight">
              <div className="font-extrabold text-lg tracking-wide">
                RP-Italsem
              </div>
              <div className="text-xs text-black/60">
                Rapportini & Presenze
              </div>
            </div>
          </Link>

          {/* Azioni utente */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-black/60">
              👤 Utente
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

      {/* CONTENUTO FULL WIDTH */}
      <main className="w-full px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
