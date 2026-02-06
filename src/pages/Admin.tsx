// src/pages/Admin.tsx
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";
import * as XLSX from "xlsx";

type UserRow = {
  id: number;
  username: string;
  role: "ADMIN" | "USER";
  is_active: number;
  first_name?: string | null;
  last_name?: string | null;
};

type ImportKind = "cantieri" | "mezzi" | "dipendenti";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

export default function Admin() {
  const [me, setMe] = useState<any>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // crea utente
  const [firstName, setFirstName] = useState("Luca");
  const [lastName, setLastName] = useState("Franceschetti");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");

  useEffect(() => {
    (async () => {
      try {
        const m = await apiGet("/api/auth/me");
        setMe(m);
      } catch {}
      try {
        const u = await apiGet<UserRow[]>("/api/admin/users");
        setUsers(u || []);
      } catch {}
    })();
  }, []);

  const isAdmin = useMemo(() => (me?.role === "ADMIN"), [me]);

  async function refreshUsers() {
    const u = await apiGet<UserRow[]>("/api/admin/users");
    setUsers(u || []);
  }

  async function createUser() {
    setMsg("");
    if (!username.trim() || !password.trim()) {
      setMsg("Inserisci username e password.");
      return;
    }
    setBusy(true);
    try {
      await apiPost("/api/admin/users", {
        first_name: firstName?.trim() || null,
        last_name: lastName?.trim() || null,
        username: username.trim(),
        password: password,
        role,
      });
      setUsername("");
      setPassword("");
      setRole("USER");
      await refreshUsers();
      setMsg("✅ Utente creato.");
    } catch (e) {
      setMsg("❌ " + errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  function readExcel(file: File): any[] {
    const reader = new FileReader();
    return new Promise<any[]>((resolve, reject) => {
      reader.onerror = () => reject(new Error("Impossibile leggere il file."));
      reader.onload = () => {
        try {
          const data = new Uint8Array(reader.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
          resolve(json as any[]);
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsArrayBuffer(file);
    }) as any;
  }

  async function importExcel(kind: ImportKind, file: File) {
    setMsg("");
    setBusy(true);
    try {
      const rows = await readExcel(file);

      // endpoint atteso: /api/admin/import/:kind
      // payload: { rows: [...] }
      await apiPost(`/api/admin/import/${kind}`, { rows });

      setMsg(`✅ Import ${kind} completato (${rows.length} righe).`);
    } catch (e) {
      setMsg(`❌ Import ${kind} fallito: ` + errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Admin</h2>
        <p>Non autorizzato.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 8 }}>Pannello Admin</h2>
      <p style={{ marginTop: 0, opacity: 0.8 }}>Gestione utenti + import liste Excel</p>

      {msg && (
        <div
          style={{
            margin: "12px 0",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #eee",
            background: "#fff",
            whiteSpace: "pre-wrap",
          }}
        >
          {msg}
        </div>
      )}

      {/* CREAZIONE UTENTE */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Crea nuovo utente / admin</h3>

          <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Nome</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} />

          <label style={{ display: "block", fontSize: 12, margin: "10px 0 6px" }}>Cognome</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} />

          <label style={{ display: "block", fontSize: 12, margin: "10px 0 6px" }}>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />

          <label style={{ display: "block", fontSize: 12, margin: "10px 0 6px" }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

          <label style={{ display: "block", fontSize: 12, margin: "10px 0 6px" }}>Ruolo</label>
          <select value={role} onChange={(e) => setRole(e.target.value as any)} style={inputStyle}>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <button onClick={createUser} disabled={busy} style={btnStyle}>
            {busy ? "Attendi..." : "Crea utente"}
          </button>
        </div>

        {/* IMPORT EXCEL */}
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Importa liste Excel</h3>

          <ImportBox title="Import Cantieri" kind="cantieri" onImport={importExcel} disabled={busy} />
          <ImportBox title="Import Mezzi" kind="mezzi" onImport={importExcel} disabled={busy} />
          <ImportBox title="Import Dipendenti" kind="dipendenti" onImport={importExcel} disabled={busy} />

          <p style={{ fontSize: 12, opacity: 0.75, marginTop: 12 }}>
            Nota: prende il primo foglio del file Excel e manda tutte le righe al backend.
          </p>
        </div>
      </div>

      {/* LISTA UTENTI */}
      <div style={{ marginTop: 18, border: "1px solid #eee", borderRadius: 12, padding: 16, background: "#fff" }}>
        <h3 style={{ marginTop: 0 }}>Utenti</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Nome</th>
                <th style={th}>Cognome</th>
                <th style={th}>Username</th>
                <th style={th}>Ruolo</th>
                <th style={th}>Attivo</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={td}>{u.id}</td>
                  <td style={td}>{u.first_name || ""}</td>
                  <td style={td}>{u.last_name || ""}</td>
                  <td style={td}>{u.username}</td>
                  <td style={td}>{u.role}</td>
                  <td style={td}>{u.is_active ? "SI" : "NO"}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td style={td} colSpan={6}>
                    Nessun utente trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button onClick={refreshUsers} disabled={busy} style={{ ...btnStyle, marginTop: 12 }}>
          Aggiorna lista
        </button>
      </div>
    </div>
  );
}

function ImportBox(props: {
  title: string;
  kind: ImportKind;
  onImport: (kind: ImportKind, file: File) => Promise<void>;
  disabled?: boolean;
}) {
  const { title, kind, onImport, disabled } = props;

  return (
    <div style={{ marginTop: 12, padding: 12, border: "1px dashed #ddd", borderRadius: 10 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <input
        type="file"
        accept=".xlsx,.xls"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImport(kind, f);
          e.currentTarget.value = ""; // reset input
        }}
      />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  outline: "none",
};

const btnStyle: React.CSSProperties = {
  marginTop: 12,
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "none",
  background: "#ff7a00",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const th: React.CSSProperties = {
  textAlign: "left",
  fontSize: 12,
  padding: 10,
  borderBottom: "1px solid #eee",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  fontSize: 13,
  padding: 10,
  borderBottom: "1px solid #f3f3f3",
  whiteSpace: "nowrap",
};
