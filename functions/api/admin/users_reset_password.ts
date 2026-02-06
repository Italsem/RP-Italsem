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

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!requireAdmin(u)) return new Response("Forbidden", { status: 403 });

  const { id, newPassword } = await ctx.request.json();
  if (!id || !newPassword) return new Response("Missing fields", { status: 400 });

  const salt = randomSaltHex();
  const hash = await sha256Hex(`${salt}:${newPassword}`);

  await ctx.env.DB.prepare(
    "UPDATE users SET password_hash=?, salt=?, is_active=1 WHERE id=?"
  ).bind(hash, salt, id).run();

  return Response.json({ ok: true });
};
