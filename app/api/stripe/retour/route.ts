import { NextResponse } from "next/server";
import { applyPaidSession, getSession } from "@/lib/payment";
import { siteUrl } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Retour de Stripe après paiement : on vérifie la session auprès de Stripe (jamais sur la seule foi de l'adresse), on publie, puis on ouvre l'espace. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("session_id") ?? "";
  const base = siteUrl();
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return NextResponse.redirect(`${base}/espace`, 303);
  try {
    const s = await getSession(id);
    const token = s.metadata?.token;
    if (!token) return NextResponse.redirect(`${base}/espace`, 303);
    const ok = await applyPaidSession(s);
    return NextResponse.redirect(`${base}/espace/${token}?paiement=${ok ? "ok" : "attente"}`, 303);
  } catch (e) {
    console.error("stripe.retour", e instanceof Error ? e.message : e);
    return NextResponse.redirect(`${base}/espace`, 303);
  }
}
