import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type ActiveCantiere = {
  work_date: string;
  cantiere_code: string;
  cantiere_desc: string;
  updated_at?: string;
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function safeJson<T>(res: Response): Promise<T> {
  const txt = await res.text();
  try {
    return JSON.parse(txt) as T;
  } catch {
    throw new Error(txt || `HTTP ${res.status}`);
  }
}

export default function Dashboard() {
  const [date, setDate] = useState<string>(todayISO());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<ActiveCantiere[]>([]);

  const prettyDate = useMemo(() => {
    // visualizzazione semplice IT
    const [y, m, d] = date.split("-");
    if (!y || !m || !d) return date;
    return `${d}/${m}/${y}`;
  }, [date]);

  useEffect(() => {
    let aborted = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/day/active?date=${encodeURIComponent(date)}`, {
          credentials: "include",
          headers: { "Accept": "application/json" },
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `Errore caricamento: ${res.status}`);
        }

        const data = await safeJson<ActiveCantiere[]>(res);
        if (!aborted) setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!aborted) {
          setRows([]);
          setErr(e?.message || "Errore sconosciuto");
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();
    return () => {
      aborted = true;
    };
  }, [date]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Italsem"
            className="h-10 w-10 rounded-md object-contain"
          />
          <div className="flex-1">
            <div className="text-lg font-semibold leading-tight">Rapportini Italsem</div>
            <div className="text-sm text-gray-500">Dashboard</div>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              to="/export"
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Export
            </Link>
            <Link
              to="/admin"
              className="rounded-md bg-black px-3 py-2 text-sm text-white hover:opacity-90"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-xl bg-white shadow-sm border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm text-gray-500">Data selezionata</div>
              <div className="text-xl font-semibold">{prettyDate}</div>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600" htmlFor="date">
                  Scegli data
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-md border px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            {loading && (
              <div className="text-sm text-gray-600">Caricamento cantieri...</div>
            )}

            {err && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {err}
              </div>
            )}

            {!loading && !err && rows.length === 0 && (
              <div className="text-sm text-gray-600">
                Nessun cantiere trovato per questa data.
              </div>
            )}

            {!loading && !err && rows.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Codice</th>
                      <th className="px-3 py-2 text-left">Cantiere</th>
                      <th className="px-3 py-2 text-right">Apri</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={`${r.work_date}-${r.cantiere_code}`} className="border-t">
                        <td className="px-3 py-2 font-mono">{r.cantiere_code}</td>
                        <td className="px-3 py-2">{r.cantiere_desc}</td>
                        <td className="px-3 py-2 text-right">
                          <Link
                            to={`/day?date=${encodeURIComponent(r.work_date)}&code=${encodeURIComponent(
                              r.cantiere_code
                            )}`}
                            className="rounded-md border px-3 py-1.5 hover:bg-gray-50"
                          >
                            Apri
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          Logo: <span className="font-mono">public/logo.png</span>
        </div>
      </main>
    </div>
  );
}
