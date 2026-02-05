import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link className="px-3 py-2 rounded-lg bg-white border" to="/admin">Admin</Link>
          <Link className="px-3 py-2 rounded-lg bg-blue-600 text-white" to="/inserimento">
            Nuovo inserimento
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">Movimenti mese</div>
          <div className="text-2xl font-bold">—</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">Cantieri attivi</div>
          <div className="text-2xl font-bold">—</div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-gray-500">Export CPM</div>
          <div className="text-2xl font-bold">—</div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4">
        <div className="font-semibold mb-2">Ultimi inserimenti</div>
        <div className="text-sm text-gray-500">Qui mettiamo la tabella (tra poco).</div>
      </div>
    </div>
  );
}
