import { createSession } from "../_auth";

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isSha256Hex(s: string) {
  return /^[a-f0-9]{64}$/i.test(s);
}

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  try {
    const body = await ctx.request.json();
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");

    if (!username || !password) return new Response("Missing credentials", { status: 400 });

    const user = await ctx.env.DB.prepare(
      "SELECT id, username, password_hash, salt, role, is_active, first_name, last_name FROM users WHERE username = ?"
    )
      .bind(username)
      .first<any>();

    if (!user || !user.is_active) return new Response("Invalid credentials", { status: 401 });

    const stored = String(user.password_hash ?? "");
    const salt = String(user.salt ?? "");

    let ok = false;

    // ✅ 1) password in chiaro
    if (stored === password) ok = true;

    // ✅ 2) password hashata (supporta entrambi i formati più comuni)
    if (!ok && isSha256Hex(stored)) {
      const h1 = await sha256Hex(password + salt);
      const h2 = await sha256Hex(salt + password);
      if (stored.toLowerCase() === h1.toLowerCase() || stored.toLowerCase() === h2.toLowerCase()) ok = true;
    }

    if (!ok) return new Response("Invalid credentials", { status: 401 });

    return await createSession(ctx, {
      id: user.id,
      username: user.username,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    });
  } catch (e) {
    console.log("LOGIN ERROR:", e);
    return new Response("Internal error", { status: 500 });
  }
};
