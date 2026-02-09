import { apiGet, apiPost } from "./api";

export type User = {
  id: number;
  username: string;
  role: "ADMIN" | "USER";
  firstName: string;
  lastName: string;
};

type MeResponse = {
  ok: boolean;
  user: {
    id: number;
    username: string;
    role: "ADMIN" | "USER";
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
  };
};

export async function me(): Promise<User> {
  const res = await apiGet<MeResponse>("/api/auth/me");
  const u = res.user;
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    firstName: u.firstName ?? u.first_name ?? "",
    lastName: u.lastName ?? u.last_name ?? "",
  };
}

export async function login(username: string, password: string) {
  return apiPost<{ ok: boolean; user: User }>("/api/auth/login", { username, password });
}

export async function logout() {
  return apiPost<{ ok: boolean }>("/api/auth/logout");
}
