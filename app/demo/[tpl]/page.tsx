import { notFound } from "next/navigation";
import DemoClient from "./DemoClient";
import { isTemplate } from "@/lib/validate";

export default async function Demo({ params }: { params: Promise<{ tpl: string }> }) {
  const { tpl } = await params;
  if (!isTemplate(tpl)) notFound();
  return <DemoClient template={tpl} />;
}
