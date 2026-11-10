import { Suspense } from "react";
import Editor from "./Editor";
import { getLang, getT } from "@/lib/i18n/server";
import { formatPrice, getPriceCents, paymentsOn } from "@/lib/payment";
import { getTemplateOrder } from "@/lib/admin/templateOrder";

export async function generateMetadata() {
  return { title: (await getT()).meta.create };
}

export default async function CreerPage() {
  // Prix affiché sur le bouton « Publier » seulement quand le paiement est activé.
  const payPrice = await paymentsOn() ? formatPrice(await getLang(), await getPriceCents()) : null;
  const order = await getTemplateOrder();
  return (
    <Suspense>
      <Editor payPrice={payPrice} order={order} />
    </Suspense>
  );
}
