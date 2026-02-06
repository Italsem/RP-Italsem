export type AuthedUser = {
  id: number;
  username: string;
  role: "ADMIN" | "USER";
  first_name?: string | null;
  last_name?: string | null;
};

// ✅ AUTH DISABILITATA: sempre admin
export async function getUser(_ctx: any): Promise<AuthedUser | null> {
  return {
    id: 1,
    username: "admin",
    role: "ADMIN",
    first_name: "Luca",
    last_name: "Franceschetti",
  };
}

export function requireAdmin(u: AuthedUser | null) {
  return !!u && u.role === "ADMIN";
}
