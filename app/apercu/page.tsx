"use client";
import { useEffect, useRef, useState } from "react";
import Invitation from "@/components/invitation/Invitation";
import type { InvitationData, TemplateId } from "@/lib/types";

type Msg = { type: "invite-preview"; data: InvitationData; template: TemplateId; replay?: boolean };

/** Aperçu affiché dans l'iframe de l'éditeur : reçoit les données par postMessage. */
export default function Apercu() {
  const [state, setState] = useState<{ v: number; msg: Msg } | null>(null);
  const v = useRef(0);
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "invite-preview") return;
      v.current += 1;
      setState({ v: v.current, msg: e.data as Msg });
    };
    window.addEventListener("message", on);
    window.parent.postMessage({ type: "invite-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", on);
  }, []);
  if (!state) return null;
  return (
    <>
      <Invitation key={state.v} data={state.msg.data} template={state.msg.template} skipIntro={!state.msg.replay} noGate={!state.msg.replay} />
      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 80, font: "500 10px/1 Jost,system-ui,sans-serif", letterSpacing: ".2em", padding: "7px 10px", borderRadius: 999, background: "rgba(0,0,0,.55)", color: "#fff", pointerEvents: "none" }}>
        APERÇU
      </div>
    </>
  );
}
