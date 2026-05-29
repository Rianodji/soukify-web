import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/types/api";

interface JwtPayload {
  userId: string;
  roles: UserRole[];
  exp: number;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"),
    );
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
    return decoded as JwtPayload;
  } catch {
    return null;
  }
}

const ADMIN_ROLES: UserRole[] = ["ADMIN", "ACCOUNT_MANAGER", "SUPPORT", "FINANCE", "SUPER_ADMIN"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("sk_access")?.value;
  const payload = token ? decodeJwt(token) : null;
  const isAuthed = !!payload;

  /* ── Redirect authenticated users away from auth pages ── */
  const authPages = ["/login", "/register", "/verify-otp"];
  if (authPages.includes(pathname) && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  /* ── Protect dashboard routes ─────────────────────────── */
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthed) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  /* ── Protect admin routes — admin roles only ──────────── */
  if (pathname.startsWith("/admin")) {
    if (!isAuthed) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const hasAdminRole = payload!.roles.some((r) => ADMIN_ROLES.includes(r));
    if (!hasAdminRole) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/verify-otp",
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
