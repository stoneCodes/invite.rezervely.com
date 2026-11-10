import { NextResponse } from "next/server";
import { issueAdminCode, originAllowed, verifyAdminCode, verifyAdminPassword } from "@/lib/admin/auth";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  if (!originAllowed(req)) return NextResponse.json({ error: "Requête refusée" }, { status: 404 });
  let body: { email?: unknown; code?: unknown; password?: unknown; action?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requête invalide" }, { status: 400 }); }
  try {
    if (body.action === "send") {
      await issueAdminCode(body.email, req);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "password") {
      const ok = await verifyAdminPassword(body.email, body.password);
      return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Connexion impossible" }, { status: 400 });
    }
    if (body.action === "verify") {
      const ok = await verifyAdminCode(body.email, body.code);
      return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Connexion impossible" }, { status: 400 });
    }
  } catch (error) {
    console.error("admin.login", error);
    // Même réponse pour une adresse autorisée ou non, y compris si l'envoi échoue.
    if (body.action === "send") return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Connexion impossible" }, { status: 400 });
}
