import { Suspense } from "react";
import Editor from "./Editor";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  return { title: (await getT()).meta.create };
}

export default function CreerPage() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}
