import { getUser, unauthorized, json } from "../_auth";

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const u = await getUser(ctx);
  if (!u) return unauthorized();

  return json({
    id: u.id,
    username: u.username,
    role: u.role,
    firstName: u.first_name ?? "",
    lastName: u.last_name ?? "",
  });
};
