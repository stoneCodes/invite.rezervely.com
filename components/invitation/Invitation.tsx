"use client";
import "./invitation.css";
import "./appel/appel.css";
import "./boule/boule.css";
import "./origami/origami.css";
import { useEffect, useRef } from "react";
import { markup } from "./markup";
import { inviteDict } from "@/lib/i18n/invite";
import { mountInvitation, type MountOptions } from "./engine";
import { mountAppel } from "./appel/appel";
import { mountBoule } from "./boule/boule";
import { mountOrigami } from "./origami/origami";
import type { InvitationData, TemplateId } from "@/lib/types";
import { DEMO_PHOTOS } from "@/lib/demoPhotos";

type Props = {
  data: InvitationData;
  template: TemplateId;
  /** Slug public : si présent, les réponses RSVP sont enregistrées */
  slug?: string;
  skipIntro?: boolean;
  noGate?: boolean;
  /** Démo : sans photo des mariés, affiche la photo de couple du modèle (jamais pour une invitation publiée). */
  demoPhoto?: boolean;
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
export default function Invitation(input: Props) {
  const props = input.demoPhoto && !input.data.photoUrl ? { ...input, data: { ...input.data, photoUrl: DEMO_PHOTOS[input.template] } } : input;
  // « Appel entrant » et « Le monde miniature » ont leur propre moteur ; les autres partagent engine.js + markup.ts.
  if (props.template === "appel") return <OwnEngine {...props} mount={mountAppel} />;
  if (props.template === "boule-neige") return <OwnEngine {...props} mount={mountBoule} />;
  if (props.template === "origami") return <OwnEngine {...props} mount={mountOrigami} />;
  return <ClassicInvitation {...props} />;
}

type Mount = (root: HTMLElement, data: InvitationData, opts?: MountOptions) => { replay(): void; destroy(): void };

function ClassicInvitation({ data, template, slug, skipIntro, noGate, onReady }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const api = mountInvitation(data, template, options(slug, skipIntro, noGate));
    onReady?.(api);
    return () => { api.destroy(); delete document.body.dataset.tpl; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: markup(inviteDict(data.lang)) }} />;
}

function OwnEngine({ data, slug, skipIntro, noGate, onReady, mount }: Props & { mount: Mount }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const api = mount(ref.current!, data, options(slug, skipIntro, noGate));
    onReady?.(api);
    return () => { api.destroy(); delete document.body.dataset.tpl; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref} />;
}
