// functions/api/auth/logout.ts
import { clearSessionCookie, destroySession, json } from "../_auth";

export async function onRequestPost({ request, env }: any) {
  await destroySession(env, request);

  return json(
    { ok: true },
    {
      status: 200,
      headers: {
        "Set-Cookie": clearSessionCookie(),
      },
    }
  );
}
