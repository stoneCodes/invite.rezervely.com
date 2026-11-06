import type { Metadata } from "next";
import LegalPage, { legalTitle } from "@/components/LegalPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await legalTitle("privacy") };
}

export default function Page() {
  return <LegalPage kind="privacy" />;
}
