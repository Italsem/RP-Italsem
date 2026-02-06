import { clearSessionCookie } from "../_auth";

function extractSid(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(/(?:^|;\s*)sid=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const sid = extractSid(ctx.request.headers.get("Cookie"));
  if (sid) {
    await ctx.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sid).run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearSessionCookie(),
    },
  });
};
