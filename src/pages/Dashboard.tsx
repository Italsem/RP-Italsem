import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Dashboard</h1>
          <p className="text-sm text-black/60">
            Panoramica inserimenti e export
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            className="px-4 py-2 rounded-lg bg-white border border-black/10 font-semibold hover:bg-black/5 transition"
            to="/admin"
          >
            Admin
          </Link>
          <Link
            className="px-4 py-2 rounded-lg bg-brand-orange text-brand-white font-bold hover:opacity-90 transition"
            to="/inserimento"
          >
            Nuovo inserimento
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <div className="text-sm text-black/60">Movimenti mese</div>
          <div className="text-3xl font-extrabold mt-1">—</div>
        </div>

        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <div className="text-sm text-black/60">Cantieri attivi</div>
          <div className="text-3xl font-extrabold mt-1">—</div>
        </div>

        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <div className="text-sm text-black/60">Export CPM</div>
          <div className="text-3xl font-extrabold mt-1">—</div>
        </div>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-lg">Ultimi inserimenti</div>
          <button className="text-sm font-semibold text-brand-orange hover:opacity-80 transition">
            Aggiorna
          </button>
        </div>
        <div className="text-sm text-black/60">
          Qui mettiamo la tabella (tra poco).
        </div>
      </div>
    </div>
  );
}
