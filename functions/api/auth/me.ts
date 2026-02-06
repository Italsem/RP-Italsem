// functions/api/auth/me.ts
import { getUser, json, unauthorized } from "../_auth";

export async function onRequestGet({ request, env }: any) {
  const u = await getUser(env, request);
  if (!u) return unauthorized();
  return json({ ok: true, user: u });
}
