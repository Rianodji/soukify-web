import { NextRequest, NextResponse } from "next/server";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

export async function POST(req: NextRequest) {
  try {
    const { accessToken, refreshToken } = await req.json();

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const res = NextResponse.json({ success: true });

    res.cookies.set("sk_access", accessToken, {
      ...COOKIE_OPTS,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    res.cookies.set("sk_refresh", refreshToken, {
      ...COOKIE_OPTS,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return res;
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
