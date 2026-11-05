"use client";
import Invitation from "@/components/invitation/Invitation";
import { sampleData } from "@/lib/sample";
import type { TemplateId } from "@/lib/types";

export default function DemoClient({ template }: { template: TemplateId }) {
  return <Invitation data={sampleData()} template={template} />;
}
