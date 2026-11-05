"use client";
import "./invitation.css";
import { useEffect, useRef } from "react";
import { MARKUP } from "./markup";
import { mountInvitation, type MountOptions } from "./engine";
import type { InvitationData, TemplateId } from "@/lib/types";

type Props = {
  data: InvitationData;
  template: TemplateId;
  /** Slug public : si présent, les réponses RSVP sont enregistrées */
  slug?: string;
  skipIntro?: boolean;
  noGate?: boolean;
  onReady?: (api: { replay(): void }) => void;
};

/** Monte une invitation animée. Le balisage est remonté à chaque changement de données (key côté parent). */
export default function Invitation({ data, template, slug, skipIntro, noGate, onReady }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const opts: MountOptions = { skipIntro, noGate };
    if (slug) {
      opts.onRsvp = async (r) => {
        const res = await fetch("/api/rsvp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, ...r }) });
        if (!res.ok) throw new Error("rsvp");
      };
    }
    const api = mountInvitation(data, template, opts);
    onReady?.(api);
    return () => api.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: MARKUP }} />;
}
