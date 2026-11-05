"use client";
import Link from "next/link";
import Invitation from "@/components/invitation/Invitation";
import type { InvitationData, TemplateId } from "@/lib/types";

export default function VoirClient({ data, template, token }: { data: InvitationData; template: TemplateId; token: string }) {
  return (
    <>
      {/* Sans slug : une réponse envoyée depuis cette page n'est pas comptée parmi celles des invités. */}
      <Invitation data={data} template={template} />
      <Link href={`/espace/${token}`} className="demo-exit" aria-label="Revenir à mon espace"><span aria-hidden="true">←</span> Mon espace</Link>
    </>
  );
}
