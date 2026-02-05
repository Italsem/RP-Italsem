export default function Admin() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="font-semibold mb-2">Utenti</div>
          <p className="text-sm text-gray-500">Crea utenti / reset password (tra poco).</p>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="font-semibold mb-2">Liste</div>
          <p className="text-sm text-gray-500">Cantieri / Mezzi / Dipendenti (tra poco).</p>
        </div>
      </div>
    </div>
  );
}
