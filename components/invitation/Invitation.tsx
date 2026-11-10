"use client";
import "./invitation.css";
import "./appel/appel.css";
import "./origami/origami.css";
import "./velours/velours.css";
import "./domaine/domaine.css";
import "./dresscode/couple.css";
import "./wishlist.css";
import "./fete/fete.css";
import "./vinyle/vinyle.css";
import "./toast/toast.css";
import "./gateau/gateau.css";
import "./pinata/pinata.css";
import "./livre/livre.css";
import { useEffect, useRef, useState } from "react";
import { markup } from "./markup";
import { inviteDict } from "@/lib/i18n/invite";
import { mountInvitation, type MountOptions } from "./engine";
import { mountAppel } from "./appel/appel";
import { mountOrigami } from "./origami/origami";
import { mountVelours } from "./velours/velours";
import { mountDomaine } from "./domaine/domaine";
import { mountVinyle } from "./vinyle/vinyle";
import { mountToast } from "./toast/toast";
import { mountGateau } from "./gateau/gateau";
import { mountPinata } from "./pinata/pinata";
import { mountLivre } from "./livre/livre";
import type { InvitationData, TemplateId } from "@/lib/types";
import { DEMO_PHOTOS } from "@/lib/demoPhotos";
import { trackRefFor } from "@/lib/musicClient";

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

/** music : morceau choisi par les mariés (data.music) ou défaut de la catégorie du modèle, résolu depuis /api/musiques. */
function options(slug: string | undefined, skipIntro: boolean | undefined, noGate: boolean | undefined, data: InvitationData, template: TemplateId): MountOptions {
  const opts: MountOptions = { skipIntro, noGate, music: trackRefFor(data.music, template) };
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
  // « Appel entrant », « Le domaine » et les autres moteurs dédiés ont leur propre moteur ; les autres partagent engine.js + markup.ts.
  if (props.template === "appel") return <OwnEngine {...props} mount={mountAppel} />;
  // « boule-neige » est désormais « Le domaine » (même id, pas de migration) ; l'ancien moteur boule/ reste en secours.
  if (props.template === "boule-neige") return <OwnEngine {...props} mount={mountDomaine} />;
  if (props.template === "origami") return <OwnEngine {...props} mount={mountOrigami} />;
  if (props.template === "velours") return <OwnEngine {...props} mount={mountVelours} />;
  if (props.template === "vinyle") return <OwnEngine {...props} mount={mountVinyle} />;
  if (props.template === "toast") return <OwnEngine {...props} mount={mountToast} />;
  if (props.template === "gateau") return <OwnEngine {...props} mount={mountGateau} />;
  if (props.template === "pinata") return <OwnEngine {...props} mount={mountPinata} />;
  if (props.template === "livre") return <OwnEngine {...props} mount={mountLivre} />;
  return <ClassicInvitation {...props} />;
}

type Mount = (root: HTMLElement, data: InvitationData, opts?: MountOptions) => { replay(): void; destroy(): void };

function ClassicInvitation({ data, template, slug, skipIntro, noGate, onReady }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const api = mountInvitation(data, template, options(slug, skipIntro, noGate, data, template));
    onReady?.(api);
    return () => { api.destroy(); delete document.body.dataset.tpl; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Balisage figé au montage : un nouveau rendu du parent (ex. bouton de démo qui se réduit au défilement)
  // ne doit jamais réécrire le contenu que le moteur a rempli.
  const [html] = useState(() => ({ __html: markup(inviteDict(data.lang)) }));
  return <div ref={ref} dangerouslySetInnerHTML={html} />;
}

function OwnEngine({ data, template, slug, skipIntro, noGate, onReady, mount }: Props & { mount: Mount }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const api = mount(ref.current!, data, options(slug, skipIntro, noGate, data, template));
    onReady?.(api);
    return () => { api.destroy(); delete document.body.dataset.tpl; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref} />;
}
