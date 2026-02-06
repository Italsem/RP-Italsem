import { getUser } from "../_auth";

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const user = await getUser(ctx);
  if (!user) return new Response("Unauthorized", { status: 401 });

  return Response.json({
    id: user.id,
    username: user.username,
    role: user.role,
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
  });
};
