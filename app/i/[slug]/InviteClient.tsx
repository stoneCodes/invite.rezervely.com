"use client";
import Invitation from "@/components/invitation/Invitation";
import type { InvitationData, TemplateId } from "@/lib/types";

export default function InviteClient(props: { data: InvitationData; template: TemplateId; slug: string }) {
  return <Invitation {...props} />;
}
