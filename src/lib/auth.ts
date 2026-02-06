import { apiGet, apiPost } from "./api";

export type User = { id: number; username: string; role: "ADMIN" | "USER" };

export async function me(): Promise<User> {
  return apiGet<User>("/api/auth/me");
}

export async function login(username: string, password: string) {
  return apiPost<{ ok: boolean; user: User }>("/api/auth/login", { username, password });
}

export async function logout() {
  return apiPost<{ ok: boolean }>("/api/auth/logout");
}
