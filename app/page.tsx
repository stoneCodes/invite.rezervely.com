import HomeClient from "./HomeClient";
import { getLang, getT } from "@/lib/i18n/server";
import { getAdminSetting } from "@/lib/admin/settings";
import { paymentsOn } from "@/lib/payment";
import { getTemplateOrder } from "@/lib/admin/templateOrder";

type PublicPromotion={code:string;kind:"percent"|"amount";value:number;expiresAt?:number};
export default async function Home() {
  const [lang,t,enabled,promo,order]=await Promise.all([getLang(),getT(),paymentsOn().catch(()=>false),getAdminSetting<PublicPromotion>("public_promo").catch(()=>null),getTemplateOrder()]);
  const active=enabled&&promo&&(!promo.expiresAt||promo.expiresAt>Date.now()/1000)&&Number.isFinite(promo.value);
  const label=active?(promo.kind==="percent"?t.home.promoPercent(promo.value):t.home.promoAmount(new Intl.NumberFormat(lang==="en"?"en-IE":"fr-FR",{style:"currency",currency:"EUR"}).format(promo.value/100))):undefined;
  return <HomeClient order={order} publicPromo={active&&label?{code:promo.code,label}:undefined} />;
}
