function b64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function randomSaltB64() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

async function pbkdf2Hash(password: string, saltB64: string) {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 120000 },
    key,
    256
  );
  return b64(bits);
}

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const { username, password } = await ctx.request.json();
  if (!username || !password) return new Response("Missing username/password", { status: 400 });

  // se esiste già un admin, blocca
  const existingAdmin = await ctx.env.DB.prepare(
    "SELECT id FROM users WHERE role='ADMIN' AND is_active=1 LIMIT 1"
  ).first();

  if (existingAdmin) return new Response("Admin already exists", { status: 409 });

  const salt = randomSaltB64();
  const hash = await pbkdf2Hash(password, salt);

  await ctx.env.DB.prepare(
    "INSERT INTO users (username, password_hash, salt, role, is_active) VALUES (?, ?, ?, 'ADMIN', 1)"
  ).bind(username, hash, salt).run();

  return Response.json({ ok: true });
};
