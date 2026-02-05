export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg">
        <img src="/logo.png" alt="RP-Italsem" className="h-14 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-center mb-6">Accedi</h1>

        <label className="block text-sm font-medium mb-1">Username</label>
        <input className="w-full border rounded-lg px-3 py-2 mb-4" />

        <label className="block text-sm font-medium mb-1">Password</label>
        <input type="password" className="w-full border rounded-lg px-3 py-2 mb-6" />

        <button className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold">
          Entra
        </button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Accesso riservato
        </p>
      </div>
    </div>
  );
}
