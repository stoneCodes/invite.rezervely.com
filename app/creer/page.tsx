import { Suspense } from "react";
import Editor from "./Editor";
import { getLang, getT } from "@/lib/i18n/server";
import { formatPrice, paymentsOn } from "@/lib/payment";

export async function generateMetadata() {
  return { title: (await getT()).meta.create };
}

export default async function CreerPage() {
  // Prix affiché sur le bouton « Publier » seulement quand le paiement est activé.
  const payPrice = paymentsOn() ? formatPrice(await getLang()) : null;
  return (
    <Suspense>
      <Editor payPrice={payPrice} />
    </Suspense>
  );
}
