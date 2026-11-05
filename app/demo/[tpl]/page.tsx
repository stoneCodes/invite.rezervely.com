import { notFound } from "next/navigation";
import DemoClient from "./DemoClient";
import { isTemplate } from "@/lib/validate";

type P = { params: Promise<{ tpl: string }>; searchParams: Promise<{ integre?: string }> };

export default async function Demo({ params, searchParams }: P) {
  const { tpl } = await params;
  if (!isTemplate(tpl)) notFound();
  // ?integre=1 : démo affichée dans la pop-up de l'accueil, qui a déjà son bouton de retour.
  return <DemoClient template={tpl} embedded={(await searchParams).integre === "1"} />;
}
