import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete("sk_access");
  res.cookies.delete("sk_refresh");
  return res;
}
