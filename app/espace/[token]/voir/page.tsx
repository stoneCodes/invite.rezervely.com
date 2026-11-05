import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getByToken } from "@/lib/supabase";
import VoirClient from "./VoirClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Votre invitation", robots: { index: false, follow: false } };

/** Les mariés revoient leur invitation telle que leurs invités la verront, publiée ou non. Les réponses envoyées d'ici ne sont pas enregistrées. */
export default async function Voir({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await getByToken(token);
  if (!inv) notFound();
  return <VoirClient data={inv.data} template={inv.template} token={token} />;
}
