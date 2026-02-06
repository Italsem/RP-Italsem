import { getUser, json, unauthorized } from "../_auth";

export const onRequestGet = async (ctx: any) => {
  const u = await getUser(ctx);
  if (!u) return unauthorized();
  return json({ id: u.id, username: u.username, role: u.role });
};
