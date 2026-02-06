import { clearSessionCookie } from "../_auth";

export const onRequestGet = async () => {
  return clearSessionCookie();
};
