import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Dashboard</h1>
          <p className="text-sm text-black/60">Gestione rapportini, presenze ed export</p>
        </div>

        <div className="flex gap-2">
          <Link
            className="px-4 py-2 rounded-lg bg-white border border-black/10 font-semibold hover:bg-black/5 transition"
            to="/admin"
          >
            Admin
          </Link>
          <Link
            className="px-4 py-2 rounded-lg bg-white border border-black/10 font-semibold hover:bg-black/5 transition"
            to="/export"
          >
            Export
          </Link>
          <Link
            className="px-4 py-2 rounded-lg bg-brand-orange text-brand-white font-bold hover:opacity-90 transition"
            to="/inserimento"
          >
            Nuovo Rapportino
          </Link>
        </div>
      </div>

      <div className="bg-white border border-black/10 rounded-2xl p-5">
        <div className="font-bold text-lg mb-2">Stato</div>
        <div className="text-sm text-black/60">
          Ora sei operativo: inserisci rapportini, poi fai export presenze / cantiere / CPM.
        </div>
      </div>
    </div>
  );
}
