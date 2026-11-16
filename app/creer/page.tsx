import { Suspense } from "react";
import Editor from "./Editor";
import { getT } from "@/lib/i18n/server";
import { getPrices, paymentsOn } from "@/lib/payment";
import { getTemplateOrder } from "@/lib/admin/templateOrder";

export async function generateMetadata() {
  return { title: (await getT()).meta.create };
}

export default async function CreerPage() {
  // Prix des formules, affichés au moment de publier seulement quand le paiement est activé.
  const prices = await paymentsOn() ? await getPrices() : null;
  const order = await getTemplateOrder();
  return (
    <Suspense>
      <Editor prices={prices} order={order} />
    </Suspense>
  );
}
