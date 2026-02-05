import { Outlet, Link } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src="/logo.png" alt="RP-Italsem" className="h-10" />
            <div>
              <div className="font-bold leading-5">RP-Italsem</div>
              <div className="text-xs text-gray-500">Rapportini & Presenze</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">👤 Utente</span>
            <button className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
