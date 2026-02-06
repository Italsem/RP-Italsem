import { getUser } from "../_auth";

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return new Response("Unauthorized", { status: 401 });
  return Response.json(user);
};
