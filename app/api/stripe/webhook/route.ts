import { NextResponse } from "next/server";
import { applyPaidSession, verifyWebhook } from "@/lib/payment";

export const dynamic = "force-dynamic";

/** Webhook Stripe : publie l'invitation même si le client ferme la page avant le retour (paiement par carte ou différé). */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!(await verifyWebhook(raw, req.headers.get("stripe-signature")))) return new NextResponse("bad signature", { status: 400 });
  const ev = JSON.parse(raw) as { type: string; data: { object: Parameters<typeof applyPaidSession>[0] } };
  if (ev.type === "checkout.session.completed" || ev.type === "checkout.session.async_payment_succeeded") {
    await applyPaidSession(ev.data.object);
  }
  return NextResponse.json({ received: true });
}
