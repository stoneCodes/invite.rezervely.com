import Loader from "@/components/Loader";
import { getT } from "@/lib/i18n/server";

/** Affiché par Next.js pendant le chargement d'une page (ouverture d'une invitation, espace, navigation). */
export default async function Loading() {
  return <Loader label={(await getT()).common.loading} />;
}
