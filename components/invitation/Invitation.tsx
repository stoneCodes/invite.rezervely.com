"use client";
import "./invitation.css";
import "./appel/appel.css";
import { useEffect, useRef } from "react";
import { MARKUP } from "./markup";
import { mountInvitation, type MountOptions } from "./engine";
import { mountAppel } from "./appel/appel";
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

function options(slug: string | undefined, skipIntro?: boolean, noGate?: boolean): MountOptions {
  const opts: MountOptions = { skipIntro, noGate };
  if (slug) {
    opts.onRsvp = async (r) => {
      const res = await fetch("/api/rsvp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, ...r }) });
      if (!res.ok) throw new Error("rsvp");
    };
  }
  return opts;
}

/** Monte une invitation animée. Le balisage est remonté à chaque changement de données (key côté parent). */
export default function Invitation(props: Props) {
  // « Appel entrant » a son propre moteur (conversation), les autres partagent engine.js + markup.ts.
  return props.template === "appel" ? <AppelInvitation {...props} /> : <ClassicInvitation {...props} />;
}

function ClassicInvitation({ data, template, slug, skipIntro, noGate, onReady }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const api = mountInvitation(data, template, options(slug, skipIntro, noGate));
    onReady?.(api);
    return () => api.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: MARKUP }} />;
}

function AppelInvitation({ data, slug, skipIntro, noGate, onReady }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const api = mountAppel(ref.current!, data, options(slug, skipIntro, noGate));
    onReady?.(api);
    return () => api.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref} />;
}
