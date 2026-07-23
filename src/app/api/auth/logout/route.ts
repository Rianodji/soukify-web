import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3020/api/v1";

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get("sk_access")?.value;
  const refreshToken = req.cookies.get("sk_refresh")?.value;

  if (accessToken && refreshToken) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete("sk_access");
  res.cookies.delete("sk_refresh");
  return res;
}
