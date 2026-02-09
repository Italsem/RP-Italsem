// functions/api/auth/logout.ts
import { json, clearSessionCookie, parseCookies, deleteSession } from "../_auth";

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const cookies = parseCookies(ctx.request.headers.get("Cookie"));
  const sid = cookies["sid"];
  if (sid) await deleteSession(ctx, sid);
  return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
};
