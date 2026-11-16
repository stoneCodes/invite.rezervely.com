"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import PlanChoice from "@/components/PlanChoice";
import type { Plan, Prices } from "@/lib/prices";
import type { TemplateId } from "@/lib/types";

type Copy = { accept: string; cgv: string; acceptRequired: string; fail: string; redirect: string; done: string };

/** Publication depuis l'espace (invitation enregistrée mais pas encore publiée). Paiement actif : CGV à accepter puis Stripe. */
/** plans : choix entre l'article seul et le pack (labelPack = libellé du bouton quand le pack est choisi). */
export default function PublishButton({ token, needPay, label, labelPack, plans, copy, extra }: { token: string; needPay: boolean; label: string; labelPack?: string; plans?: { template: TemplateId; prices: Prices } | null; copy: Copy; extra?: ReactNode }) {
  const [plan, setPlan] = useState<Plan>("single");
  const router = useRouter();
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function publish() {
    if (needPay && !agree) { setMsg({ kind: "err", text: copy.acceptRequired }); document.getElementById("space-cgv")?.focus(); return; }
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/invitations/${encodeURIComponent(token)}/publish`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ acceptTerms: agree, plan: plans ? plan : "single" }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || copy.fail);
      if (j.checkoutUrl) { setMsg({ kind: "ok", text: copy.redirect }); window.location.assign(j.checkoutUrl); return; }
      setMsg({ kind: "ok", text: copy.done });
      router.replace(`/espace/${token}`);
      router.refresh();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error && e.message ? e.message : copy.fail });
    } finally { setBusy(false); }
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {needPay && plans && <PlanChoice template={plans.template} prices={plans.prices} plan={plan} onChange={setPlan} />}
      {needPay && (
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: ".85rem", lineHeight: 1.45, cursor: "pointer" }}><input id="space-cgv" type="checkbox" style={{ marginTop: 3, flex: "none" }} checked={agree} onChange={(e) => { setAgree(e.target.checked); setMsg(null); }} /> <span>{copy.accept} <a href="/cgv" target="_blank" rel="noopener">{copy.cgv}</a></span></label>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="btn-s" disabled={busy} onClick={() => void publish()}>{plans && plan === "pack" && labelPack ? labelPack : label}</button>
        {extra}
      </div>
      {msg && <p className={`ed-msg ${msg.kind}`} role="status" style={{ margin: 0 }}>{msg.text}</p>}
    </div>
  );
}
