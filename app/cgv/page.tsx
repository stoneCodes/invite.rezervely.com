import type { Metadata } from "next";
import LegalPage, { legalTitle } from "@/components/LegalPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await legalTitle("cgv") };
}

export default function Page() {
  return <LegalPage kind="cgv" />;
}
