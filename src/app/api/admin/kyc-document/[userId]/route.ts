import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020/api/v1";

/**
 * `GET /admin/users/:userId/kyc/document` requires a Bearer token — an
 * `<img src>` can't attach one, so this route reads the httpOnly cookie
 * server-side and streams the binary back to the browser (cf.
 * HANDOFF_INFRA.md, 2026-07-25).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const accessToken = req.cookies.get("sk_access")?.value;
  if (!accessToken) return new NextResponse(null, { status: 401 });

  const res = await fetch(`${API_BASE}/admin/users/${userId}/kyc/document`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) return new NextResponse(null, { status: res.status });

  return new NextResponse(res.body, {
    status: 200,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream" },
  });
}
