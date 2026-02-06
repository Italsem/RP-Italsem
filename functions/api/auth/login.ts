import { createSession } from "../_auth";

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map(b => b.toString(16).padStart(2, "0")).join("");
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
      "SELECT id, username, password_hash, role, is_active, first_name, last_name FROM users WHERE username = ?"
    ).bind(username).first<any>();

    if (!user || !user.is_active) return new Response("Invalid credentials", { status: 401 });

    const stored = String(user.password_hash ?? "");

    let ok = false;

    // ✅ se nel DB è salvato in chiaro
    if (stored === password) ok = true;

    // ✅ se nel DB è salvato come SHA256
    if (!ok && isSha256Hex(stored)) {
      const candidate = await sha256Hex(password);
      if (candidate.toLowerCase() === stored.toLowerCase()) ok = true;
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
