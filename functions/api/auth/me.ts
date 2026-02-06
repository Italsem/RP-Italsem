// functions/api/auth/me.ts
import { getUser, json, unauthorized } from "../_auth";

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx as any);
  if (!u) return unauthorized();
  return json({ ok: true, user: u });
};
