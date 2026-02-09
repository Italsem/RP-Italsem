import { getUser } from "../_auth";

export async function guardAdmin(ctx: any) {
  const u = await getUser(ctx);
  if (!u || u.role !== "ADMIN") return { ok: false as const, res: new Response("Forbidden", { status: 403 }) };
  return { ok: true as const, user: u };
}

export async function listAll(ctx: any, table: string) {
  const info = await ctx.env.DB.prepare(`PRAGMA table_info(${table})`).all<any>();
  const cols = (info.results ?? []).map((x: any) => String(x.name));
  const orderBy = cols.includes("codice") ? "codice" : cols.includes("id") ? "id DESC" : cols[0] || "rowid DESC";
  const q = await ctx.env.DB.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all();
  return Response.json(q.results ?? []);
}

export async function upsertRow(ctx: any, table: string) {
  const body = await ctx.request.json();
  const { id, ...rest } = body;
  const info = await ctx.env.DB.prepare(`PRAGMA table_info(${table})`).all<any>();
  const tableCols = new Set((info.results ?? []).map((x: any) => String(x.name)));

  const keys = Object.keys(rest).filter((k) => tableCols.has(k));
  if (keys.length === 0) return new Response("Missing fields", { status: 400 });

  if (id && tableCols.has("id")) {
    const setSql = keys.map((k) => `${k}=?`).join(", ");
    const binds = keys.map((k) => rest[k]);
    binds.push(id);
    await ctx.env.DB.prepare(`UPDATE ${table} SET ${setSql} WHERE id=?`).bind(...binds).run();
    return Response.json({ ok: true });
  }

  if (tableCols.has("codice") && rest.codice) {
    const setKeys = keys.filter((k) => k !== "codice");
    const setSql = setKeys.map((k) => `${k}=?`).join(", ");
    if (setSql) {
      const binds = setKeys.map((k) => rest[k]);
      binds.push(rest.codice);
      await ctx.env.DB.prepare(`UPDATE ${table} SET ${setSql} WHERE codice=?`).bind(...binds).run();
    }
    const exists = await ctx.env.DB.prepare(`SELECT codice FROM ${table} WHERE codice=?`).bind(rest.codice).first();
    if (exists) return Response.json({ ok: true });
  }

  const colsSql = keys.join(", ");
  const qs = keys.map(() => "?").join(", ");
  const binds = keys.map((k) => rest[k]);
  await ctx.env.DB.prepare(`INSERT INTO ${table} (${colsSql}) VALUES (${qs})`).bind(...binds).run();
  return Response.json({ ok: true });
}

export async function deleteRow(ctx: any, table: string) {
  const body = await ctx.request.json();
  if (body.id) {
    await ctx.env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(body.id).run();
    return Response.json({ ok: true });
  }
  if (body.codice) {
    await ctx.env.DB.prepare(`DELETE FROM ${table} WHERE codice=?`).bind(body.codice).run();
    return Response.json({ ok: true });
  }
  return new Response("Missing id/codice", { status: 400 });
}
