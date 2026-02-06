import { getUser, requireAdmin } from "../_auth";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomSaltHex() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return new Response("Forbidden", { status: 403 });

  const res = await ctx.env.DB.prepare(
    "SELECT id, first_name, last_name, username, role, is_active, created_at FROM users ORDER BY id"
  ).all();

  return Response.json(res.results ?? []);
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
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
  } catch (e: any) {
    return new Response("Username already exists", { status: 409 });
  }

  return Response.json({ ok: true });
};

export const onRequestPut: PagesFunction<{ DB: D1Database }> = async (ctx) => {
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
};
