import HomeClient from "./HomeClient";
import { getLang, getT } from "@/lib/i18n/server";
import { getAdminSetting } from "@/lib/admin/settings";
import { getPriceCents, paymentsOn } from "@/lib/payment";
import { getTemplateOrder } from "@/lib/admin/templateOrder";
import { getPublishedReviews, getReviewStats } from "@/lib/reviews";

type PublicPromotion={code:string;kind:"percent"|"amount";value:number;expiresAt?:number};
export default async function Home() {
  const [lang,t,enabled,promo,order,reviews,reviewStats]=await Promise.all([getLang(),getT(),paymentsOn().catch(()=>false),getAdminSetting<PublicPromotion>("public_promo").catch(()=>null),getTemplateOrder(),getPublishedReviews(),getReviewStats()]);
  const active=enabled&&promo&&(!promo.expiresAt||promo.expiresAt>Date.now()/1000)&&Number.isFinite(promo.value);
  const label=active?(promo.kind==="percent"?t.home.promoPercent(promo.value):t.home.promoAmount(new Intl.NumberFormat(lang==="en"?"en-IE":"fr-FR",{style:"currency",currency:"EUR"}).format(promo.value/100))):undefined;
  // Prix affiché dans la FAQ seulement si les paiements sont actifs (sinon « gratuit pour le moment »).
  const cents=enabled?await getPriceCents().catch(()=>null):null;
  const price=cents?new Intl.NumberFormat(lang==="en"?"en-IE":"fr-FR",{style:"currency",currency:"EUR"}).format(cents/100):null;
  // Données structurées FAQPage (Google peut afficher les questions dans ses résultats).
  const faqLd={"@context":"https://schema.org","@type":"FAQPage",mainEntity:t.home.faq(price).map(([q,a])=>({"@type":"Question",name:q,acceptedAnswer:{"@type":"Answer",text:a}}))};
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqLd).replace(/</g,"\\u003c")}} />
    <HomeClient order={order} price={price} reviews={reviews} reviewStats={reviewStats} publicPromo={active&&label?{code:promo.code,label}:undefined} />
  </>;
}
