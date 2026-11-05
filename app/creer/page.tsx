import { Suspense } from "react";
import Editor from "./Editor";

export const metadata = { title: "Créer mon invitation" };

export default function CreerPage() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}
