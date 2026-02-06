export default function Admin() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Admin Panel</h1>
        <p className="text-sm text-black/60">
          Gestione utenti e liste (cantieri, mezzi, dipendenti)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="font-bold text-lg">Utenti</div>
            <span className="text-xs px-2 py-1 rounded-full bg-black text-white">
              ADMIN
            </span>
          </div>
          <p className="text-sm text-black/60 mt-2">
            Crea utenti / reset password / abilita-disabilita.
          </p>
          <button className="mt-4 px-4 py-2 rounded-lg bg-brand-orange text-white font-bold hover:opacity-90 transition">
            Gestisci utenti
          </button>
        </div>

        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <div className="font-bold text-lg">Liste</div>
          <p className="text-sm text-black/60 mt-2">
            Aggiorna Cantieri / Mezzi / Dipendenti (autocomplete).
          </p>
          <button className="mt-4 px-4 py-2 rounded-lg bg-brand-orange text-white font-bold hover:opacity-90 transition">
            Gestisci liste
          </button>
        </div>
      </div>
    </div>
  );
}
