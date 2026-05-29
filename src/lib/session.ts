import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import type { UserRole } from "@/types/api";

export interface Session {
  userId: string;
  roles: UserRole[];
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get("sk_access")?.value;
  if (!token) return null;
  try {
    const payload = jwtDecode<Session & { exp: number }>(token);
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return { userId: payload.userId, roles: payload.roles ?? [] };
  } catch {
    return null;
  }
}

export function hasRole(session: Session | null, ...roles: UserRole[]): boolean {
  if (!session) return false;
  return roles.some((r) => session.roles.includes(r));
}

export function isAdmin(session: Session | null): boolean {
  return hasRole(session, "ADMIN", "ACCOUNT_MANAGER", "SUPPORT", "FINANCE", "SUPER_ADMIN");
}

export function isSeller(session: Session | null): boolean {
  return hasRole(session, "SELLER", "PRO");
}
