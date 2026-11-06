import { NextResponse } from "next/server";
import { logoutAdmin, originAllowed } from "@/lib/admin/auth";
export async function POST(req: Request) {
  if (!originAllowed(req)) return new NextResponse(null, { status: 404 });
  await logoutAdmin();
  return NextResponse.redirect(new URL("/admin", req.url), 303);
}
