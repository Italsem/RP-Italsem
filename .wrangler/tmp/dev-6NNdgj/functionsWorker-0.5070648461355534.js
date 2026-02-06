var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/pages-wJTzHr/functionsWorker-0.5070648461355534.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(";");
  for (const p of parts) {
    const [k, ...rest] = p.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join("=") || "");
  }
  return out;
}
__name(parseCookies, "parseCookies");
__name2(parseCookies, "parseCookies");
function makeSessionId() {
  return crypto.randomUUID();
}
__name(makeSessionId, "makeSessionId");
__name2(makeSessionId, "makeSessionId");
async function getUser(ctx) {
  const cookies = parseCookies(ctx.request.headers.get("Cookie"));
  const sid = cookies["sid"];
  if (!sid) return null;
  const session = await ctx.env.DB.prepare(
    `SELECT s.id as sid, s.user_id, u.id, u.username, u.role, u.is_active, u.first_name, u.last_name
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`
  ).bind(sid).first();
  if (!session || !session.is_active) return null;
  return {
    id: session.id,
    username: session.username,
    role: session.role,
    first_name: session.first_name,
    last_name: session.last_name
  };
}
__name(getUser, "getUser");
__name2(getUser, "getUser");
function requireAdmin(u) {
  return !!u && u.role === "ADMIN";
}
__name(requireAdmin, "requireAdmin");
__name2(requireAdmin, "requireAdmin");
async function createSession(ctx, u) {
  const sid = makeSessionId();
  await ctx.env.DB.prepare(
    `INSERT INTO sessions (id, user_id, created_at)
     VALUES (?, ?, datetime('now'))`
  ).bind(sid, u.id).run();
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `sid=${encodeURIComponent(sid)}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${60 * 60 * 24 * 14}`
  );
  return new Response(
    JSON.stringify({
      ok: true,
      user: u
    }),
    {
      status: 200,
      headers: {
        ...Object.fromEntries(headers.entries()),
        "Content-Type": "application/json"
      }
    }
  );
}
__name(createSession, "createSession");
__name2(createSession, "createSession");
function clearSessionCookie() {
  return `sid=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
}
__name(clearSessionCookie, "clearSessionCookie");
__name2(clearSessionCookie, "clearSessionCookie");
var allowed = /* @__PURE__ */ new Set(["cantieri", "mezzi", "dipendenti"]);
var onRequestPost = /* @__PURE__ */ __name2(async (ctx) => {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return new Response("Forbidden", { status: 403 });
  const type = ctx.params.type;
  if (!allowed.has(type)) return new Response("Bad type", { status: 400 });
  const { rows } = await ctx.request.json();
  if (!Array.isArray(rows)) return new Response("Missing rows", { status: 400 });
  await ctx.env.DB.prepare(`DELETE FROM ${type}`).run();
  if (type === "dipendenti") {
    const stmt = ctx.env.DB.prepare(
      `INSERT INTO dipendenti (Codice, Nome, Cognome, Descrizione) VALUES (?, ?, ?, ?)`
    );
    for (const r of rows) {
      await stmt.bind(r.Codice ?? "", r.Nome ?? "", r.Cognome ?? "", r.Descrizione ?? "").run();
    }
  } else {
    const stmt = ctx.env.DB.prepare(
      `INSERT INTO ${type} (Codice, Descrizione) VALUES (?, ?)`
    );
    for (const r of rows) {
      await stmt.bind(r.Codice ?? "", r.Descrizione ?? "").run();
    }
  }
  return Response.json({ ok: true, count: rows.length });
}, "onRequestPost");
async function guardAdmin(ctx) {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return { ok: false, res: new Response("Forbidden", { status: 403 }) };
  return { ok: true, user: u };
}
__name(guardAdmin, "guardAdmin");
__name2(guardAdmin, "guardAdmin");
async function listAll(ctx, table) {
  const q = await ctx.env.DB.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
  return Response.json(q.results ?? []);
}
__name(listAll, "listAll");
__name2(listAll, "listAll");
async function upsertRow(ctx, table) {
  const body = await ctx.request.json();
  const { id, ...rest } = body;
  const keys = Object.keys(rest);
  if (keys.length === 0) return new Response("Missing fields", { status: 400 });
  if (id) {
    const setSql = keys.map((k) => `${k}=?`).join(", ");
    const binds2 = keys.map((k) => rest[k]);
    binds2.push(id);
    await ctx.env.DB.prepare(`UPDATE ${table} SET ${setSql} WHERE id=?`).bind(...binds2).run();
    return Response.json({ ok: true });
  }
  const cols = keys.join(", ");
  const qs = keys.map(() => "?").join(", ");
  const binds = keys.map((k) => rest[k]);
  await ctx.env.DB.prepare(`INSERT INTO ${table} (${cols}) VALUES (${qs})`).bind(...binds).run();
  return Response.json({ ok: true });
}
__name(upsertRow, "upsertRow");
__name2(upsertRow, "upsertRow");
async function deleteRow(ctx, table) {
  const { id } = await ctx.request.json();
  if (!id) return new Response("Missing id", { status: 400 });
  await ctx.env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();
  return Response.json({ ok: true });
}
__name(deleteRow, "deleteRow");
__name2(deleteRow, "deleteRow");
var onRequestGet = /* @__PURE__ */ __name2(async (ctx) => {
  const g = await guardAdmin(ctx);
  if (!g.ok) return g.res;
  return listAll(ctx, "cantieri");
}, "onRequestGet");
var onRequestPost2 = /* @__PURE__ */ __name2(async (ctx) => {
  const g = await guardAdmin(ctx);
  if (!g.ok) return g.res;
  return upsertRow(ctx, "cantieri");
}, "onRequestPost");
var onRequestDelete = /* @__PURE__ */ __name2(async (ctx) => {
  const g = await guardAdmin(ctx);
  if (!g.ok) return g.res;
  return deleteRow(ctx, "cantieri");
}, "onRequestDelete");
var onRequestGet2 = /* @__PURE__ */ __name2(async (ctx) => {
  const g = await guardAdmin(ctx);
  if (!g.ok) return g.res;
  return listAll(ctx, "dipendenti");
}, "onRequestGet");
var onRequestPost3 = /* @__PURE__ */ __name2(async (ctx) => {
  const g = await guardAdmin(ctx);
  if (!g.ok) return g.res;
  return upsertRow(ctx, "dipendenti");
}, "onRequestPost");
var onRequestDelete2 = /* @__PURE__ */ __name2(async (ctx) => {
  const g = await guardAdmin(ctx);
  if (!g.ok) return g.res;
  return deleteRow(ctx, "dipendenti");
}, "onRequestDelete");
var onRequestGet3 = /* @__PURE__ */ __name2(async (ctx) => {
  const g = await guardAdmin(ctx);
  if (!g.ok) return g.res;
  return listAll(ctx, "mezzi");
}, "onRequestGet");
var onRequestPost4 = /* @__PURE__ */ __name2(async (ctx) => {
  const g = await guardAdmin(ctx);
  if (!g.ok) return g.res;
  return upsertRow(ctx, "mezzi");
}, "onRequestPost");
var onRequestDelete3 = /* @__PURE__ */ __name2(async (ctx) => {
  const g = await guardAdmin(ctx);
  if (!g.ok) return g.res;
  return deleteRow(ctx, "mezzi");
}, "onRequestDelete");
async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
__name2(sha256Hex, "sha256Hex");
function randomSaltHex() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(randomSaltHex, "randomSaltHex");
__name2(randomSaltHex, "randomSaltHex");
var onRequestGet4 = /* @__PURE__ */ __name2(async (ctx) => {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return new Response("Forbidden", { status: 403 });
  const res = await ctx.env.DB.prepare(
    "SELECT id, first_name, last_name, username, role, is_active, created_at FROM users ORDER BY id"
  ).all();
  return Response.json(res.results ?? []);
}, "onRequestGet");
var onRequestPost5 = /* @__PURE__ */ __name2(async (ctx) => {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return new Response("Forbidden", { status: 403 });
  const body = await ctx.request.json();
  const { firstName, lastName, username, password, role } = body;
  if (!firstName || !lastName || !username || !password) {
    return new Response("Missing fields", { status: 400 });
  }
  const salt = randomSaltHex();
  const hash = await sha256Hex(`${salt}:${password}`);
  const userRole = role === "ADMIN" ? "ADMIN" : "USER";
  try {
    await ctx.env.DB.prepare(
      "INSERT INTO users (first_name, last_name, username, password_hash, salt, role, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)"
    ).bind(firstName, lastName, username, hash, salt, userRole).run();
  } catch (e) {
    return new Response("Username already exists", { status: 409 });
  }
  return Response.json({ ok: true });
}, "onRequestPost");
var onRequestPut = /* @__PURE__ */ __name2(async (ctx) => {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return new Response("Forbidden", { status: 403 });
  const body = await ctx.request.json();
  const { id, isActive, role } = body;
  if (!id) return new Response("Missing id", { status: 400 });
  const newRole = role === "ADMIN" ? "ADMIN" : "USER";
  const active = isActive ? 1 : 0;
  await ctx.env.DB.prepare(
    "UPDATE users SET is_active=?, role=? WHERE id=?"
  ).bind(active, newRole, id).run();
  return Response.json({ ok: true });
}, "onRequestPut");
async function sha256Hex2(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex2, "sha256Hex2");
__name2(sha256Hex2, "sha256Hex");
function randomSaltHex2() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(randomSaltHex2, "randomSaltHex2");
__name2(randomSaltHex2, "randomSaltHex");
var onRequestPost6 = /* @__PURE__ */ __name2(async (ctx) => {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return new Response("Forbidden", { status: 403 });
  const { id, newPassword } = await ctx.request.json();
  if (!id || !newPassword) return new Response("Missing fields", { status: 400 });
  const salt = randomSaltHex2();
  const hash = await sha256Hex2(`${salt}:${newPassword}`);
  await ctx.env.DB.prepare(
    "UPDATE users SET password_hash=?, salt=?, is_active=1 WHERE id=?"
  ).bind(hash, salt, id).run();
  return Response.json({ ok: true });
}, "onRequestPost");
var onRequestPost7 = /* @__PURE__ */ __name2(async (ctx) => {
  const { username, password } = await ctx.request.json();
  if (!username || !password) return new Response("Missing fields", { status: 400 });
  const user = await ctx.env.DB.prepare(
    "SELECT id, username, password_hash, role, is_active, first_name, last_name FROM users WHERE username = ?"
  ).bind(username).first();
  if (!user || !user.is_active) return new Response("Invalid credentials", { status: 401 });
  if (String(user.password_hash) !== String(password)) {
    return new Response("Invalid credentials", { status: 401 });
  }
  return await createSession(ctx, {
    id: user.id,
    username: user.username,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name
  });
}, "onRequestPost");
function extractSid(cookieHeader) {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(/(?:^|;\s*)sid=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
__name(extractSid, "extractSid");
__name2(extractSid, "extractSid");
var onRequestPost8 = /* @__PURE__ */ __name2(async (ctx) => {
  const sid = extractSid(ctx.request.headers.get("Cookie"));
  if (sid) {
    await ctx.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sid).run();
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearSessionCookie(ctx.request)
    }
  });
}, "onRequestPost");
var onRequestGet5 = /* @__PURE__ */ __name2(async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return new Response("Unauthorized", { status: 401 });
  return Response.json({
    id: user.id,
    username: user.username,
    role: user.role,
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? ""
  });
}, "onRequestGet");
var onRequestGet6 = /* @__PURE__ */ __name2(async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });
  const date = new URL(ctx.request.url).searchParams.get("date");
  if (!date) return new Response("Missing date", { status: 400 });
  const r = await ctx.env.DB.prepare(
    `SELECT work_date, cantiere_code, cantiere_desc, updated_at
     FROM day_sheets
     WHERE work_date=?
     ORDER BY cantiere_desc`
  ).bind(date).all();
  return Response.json(r.results ?? []);
}, "onRequestGet");
var onRequestGet7 = /* @__PURE__ */ __name2(async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });
  const url = new URL(ctx.request.url);
  const date = url.searchParams.get("date");
  const code = url.searchParams.get("cantiere_code");
  if (!date || !code) return new Response("Missing params", { status: 400 });
  const row = await ctx.env.DB.prepare(
    `SELECT work_date, cantiere_code, cantiere_desc, payload, updated_at
     FROM day_sheets
     WHERE work_date=? AND cantiere_code=?`
  ).bind(date, code).first();
  if (!row) return new Response("Not found", { status: 404 });
  return Response.json({
    work_date: row.work_date,
    cantiere_code: row.cantiere_code,
    cantiere_desc: row.cantiere_desc,
    payload: JSON.parse(row.payload),
    updated_at: row.updated_at
  });
}, "onRequestGet");
var onRequestPost9 = /* @__PURE__ */ __name2(async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });
  const { work_date, cantiere_code, cantiere_desc, payload } = await ctx.request.json();
  if (!work_date || !cantiere_code || !cantiere_desc || !payload) {
    return new Response("Missing fields", { status: 400 });
  }
  await ctx.env.DB.prepare(
    `INSERT INTO day_sheets (work_date, cantiere_code, cantiere_desc, payload, created_by, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(work_date, cantiere_code) DO UPDATE SET
       cantiere_desc=excluded.cantiere_desc,
       payload=excluded.payload,
       updated_at=datetime('now')`
  ).bind(work_date, cantiere_code, cantiere_desc, JSON.stringify(payload), u.id).run();
  return Response.json({ ok: true });
}, "onRequestPost");
var allowed2 = /* @__PURE__ */ new Set(["cantieri", "mezzi", "dipendenti"]);
var onRequestGet8 = /* @__PURE__ */ __name2(async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });
  const type = ctx.params.type;
  if (!allowed2.has(type)) return new Response("Bad type", { status: 400 });
  const r = await ctx.env.DB.prepare(`SELECT * FROM ${type} ORDER BY id`).all();
  return Response.json(r.results ?? []);
}, "onRequestGet");
function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
__name(csvEscape, "csvEscape");
__name2(csvEscape, "csvEscape");
var onRequestGet9 = /* @__PURE__ */ __name2(async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });
  const month = new URL(ctx.request.url).searchParams.get("month");
  if (!month) return new Response("Missing month", { status: 400 });
  const r = await ctx.env.DB.prepare("SELECT payload FROM rapportini WHERE month=?").bind(month).all();
  const items = (r.results ?? []).map((x) => JSON.parse(x.payload));
  const lines = [];
  lines.push(["Cantiere", "Voce", "Giornate/Qt\xE0", "Note"].map(csvEscape).join(","));
  for (const doc of items) {
    for (const row of doc.rows ?? []) {
      const cantiere = row.cantiere || "";
      const voce = row.type;
      let sum = 0;
      for (const d of doc.days ?? []) sum += Number(row.days?.[d]?.ordinario ?? 0) || 0;
      const note = row.note || "";
      lines.push([cantiere, voce, sum, note].map(csvEscape).join(","));
    }
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8" }
  });
}, "onRequestGet");
function csvEscape2(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
__name(csvEscape2, "csvEscape2");
__name2(csvEscape2, "csvEscape");
var onRequestGet10 = /* @__PURE__ */ __name2(async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });
  const month = new URL(ctx.request.url).searchParams.get("month");
  if (!month) return new Response("Missing month", { status: 400 });
  const r = await ctx.env.DB.prepare("SELECT payload FROM rapportini WHERE month=?").bind(month).all();
  const items = (r.results ?? []).map((x) => JSON.parse(x.payload));
  const header = ["DATA", "CANTIERE", "TIPO", "CODICE", "DESCR", "ORDINARIO", "NOTE"];
  const lines = [];
  lines.push(header.map(csvEscape2).join(","));
  for (const doc of items) {
    for (const row of doc.rows ?? []) {
      const cantiere = row.cantiere || "";
      const tipo = row.type || "";
      const codice = row.code || "";
      const descr = row.name || "";
      const noteBase = row.note || "";
      for (const d of doc.days ?? []) {
        const ord = Number(row.days?.[d]?.ordinario ?? 0) || 0;
        if (!ord) continue;
        const noteDay = row.days?.[d]?.note || "";
        lines.push([d, cantiere, tipo, codice, descr, ord, (noteBase + " " + noteDay).trim()].map(csvEscape2).join(","));
      }
    }
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8" }
  });
}, "onRequestGet");
function csvEscape3(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
__name(csvEscape3, "csvEscape3");
__name2(csvEscape3, "csvEscape");
var onRequestGet11 = /* @__PURE__ */ __name2(async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });
  const month = new URL(ctx.request.url).searchParams.get("month");
  if (!month) return new Response("Missing month", { status: 400 });
  const r = await ctx.env.DB.prepare("SELECT payload FROM rapportini WHERE month=?").bind(month).all();
  const items = (r.results ?? []).map((x) => JSON.parse(x.payload));
  const map = {};
  for (const doc of items) {
    for (const row of doc.rows ?? []) {
      if (row.type !== "DIP") continue;
      const key = row.name || row.code || "SENZA_NOME";
      let sum = 0;
      for (const d of doc.days ?? []) {
        const v = row.days?.[d]?.ordinario ?? 0;
        sum += Number(v) || 0;
      }
      map[key] = (map[key] ?? 0) + sum;
    }
  }
  const lines = [
    ["Dipendente", "Giornate"].map(csvEscape3).join(","),
    ...Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => [k, v].map(csvEscape3).join(","))
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8" }
  });
}, "onRequestGet");
var onRequestGet12 = /* @__PURE__ */ __name2(async (ctx) => {
  const url = new URL(ctx.request.url);
  const tipo = url.searchParams.get("tipo");
  let sql = "";
  if (tipo === "cantieri") sql = "SELECT codice, descrizione FROM cantieri ORDER BY codice";
  else if (tipo === "mezzi") sql = "SELECT codice, descrizione FROM mezzi ORDER BY codice";
  else if (tipo === "dipendenti") sql = "SELECT codice, nome, cognome, descrizione FROM dipendenti ORDER BY cognome, nome";
  else return new Response("Tipo non valido", { status: 400 });
  const res = await ctx.env.DB.prepare(sql).all();
  return Response.json(res.results);
}, "onRequestGet");
var onRequestPost10 = /* @__PURE__ */ __name2(async (ctx) => {
  const b = await ctx.request.json();
  const required = ["data", "cantiere_codice", "tipo", "risorsa_codice", "risorsa_descrizione"];
  for (const k of required) {
    if (!b[k]) return new Response(`Missing ${k}`, { status: 400 });
  }
  await ctx.env.DB.prepare(
    `INSERT INTO movimenti
     (data, cantiere_codice, tipo, risorsa_codice, risorsa_descrizione, note,
      ordinario, notturno, pioggia, malattia, trasferta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    b.data,
    b.cantiere_codice,
    b.tipo,
    b.risorsa_codice,
    b.risorsa_descrizione,
    b.note ?? "",
    b.ordinario ?? 0,
    b.notturno ?? 0,
    b.pioggia ?? 0,
    b.malattia ?? 0,
    b.trasferta ?? 0
  ).run();
  return Response.json({ ok: true });
}, "onRequestPost");
var onRequestGet13 = /* @__PURE__ */ __name2(async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });
  const month = new URL(ctx.request.url).searchParams.get("month");
  if (!month) return new Response("Missing month", { status: 400 });
  const r = await ctx.env.DB.prepare(
    "SELECT id, month, created_by, created_at, payload FROM rapportini WHERE month=? ORDER BY created_at DESC"
  ).bind(month).all();
  return Response.json(r.results ?? []);
}, "onRequestGet");
var onRequestPost11 = /* @__PURE__ */ __name2(async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return new Response("Unauthorized", { status: 401 });
  const { month, payload } = await ctx.request.json();
  if (!month || !payload) return new Response("Missing fields", { status: 400 });
  await ctx.env.DB.prepare(
    "INSERT INTO rapportini (month, created_by, payload) VALUES (?, ?, ?)"
  ).bind(month, u.id, JSON.stringify(payload)).run();
  return Response.json({ ok: true });
}, "onRequestPost");
var routes = [
  {
    routePath: "/api/admin/import/:type",
    mountPath: "/api/admin/import",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/admin/cantieri",
    mountPath: "/api/admin",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/admin/cantieri",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/admin/cantieri",
    mountPath: "/api/admin",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/admin/dipendenti",
    mountPath: "/api/admin",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete2]
  },
  {
    routePath: "/api/admin/dipendenti",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/admin/dipendenti",
    mountPath: "/api/admin",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/admin/mezzi",
    mountPath: "/api/admin",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete3]
  },
  {
    routePath: "/api/admin/mezzi",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/admin/mezzi",
    mountPath: "/api/admin",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/admin/users",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/admin/users",
    mountPath: "/api/admin",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/admin/users",
    mountPath: "/api/admin",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  },
  {
    routePath: "/api/admin/users_reset_password",
    mountPath: "/api/admin",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/auth/login",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/auth/logout",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/auth/me",
    mountPath: "/api/auth",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/day/active",
    mountPath: "/api/day",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/day/sheet",
    mountPath: "/api/day",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/day/sheet",
    mountPath: "/api/day",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api/lists/:type",
    mountPath: "/api/lists",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api/export_cantiere",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  },
  {
    routePath: "/api/export_cpm",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet10]
  },
  {
    routePath: "/api/export_presenze",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet11]
  },
  {
    routePath: "/api/liste",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet12]
  },
  {
    routePath: "/api/movimenti",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost10]
  },
  {
    routePath: "/api/rapportini",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet13]
  },
  {
    routePath: "/api/rapportini",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost11]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-gjLBhE/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-gjLBhE/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.5070648461355534.js.map
