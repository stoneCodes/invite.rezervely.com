import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getPriceCents, listPromotionCodes, paymentsOn, stripeKeyStatus, type PromotionCode } from "@/lib/payment";
import adminFr from "@/lib/i18n/admin-fr";
import PriceForms from "./PriceForms";

export const dynamic="force-dynamic";
const euro=(cents:number)=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(cents/100);
const date=(seconds:number|null)=>seconds?new Intl.DateTimeFormat("fr-FR",{dateStyle:"medium"}).format(new Date(seconds*1000)):"—";
export default async function PricePage(){
  if(!await requireAdmin())notFound();
  const [priceCents,codeResult]=await Promise.all([getPriceCents(),listPromotionCodes().then(data=>({data,error:false})).catch(error=>{console.error("admin.promo.list",error instanceof Error?error.message:error);return{data:[] as PromotionCode[],error:true};})]);
  const key=stripeKeyStatus();
  const mode=key.mode==="test"?adminFr.stripeTest:key.mode==="live"?adminFr.stripeLive:key.mode==="missing"?adminFr.stripeMissing:adminFr.stripeUnknown;
  const enabled=paymentsOn();
  return <main className="ad-main ad-price-page"><div className="ad-price-intro"><div><span className="ad-price-kicker">{adminFr.priceStatus}</span><h1>{adminFr.priceTitle}</h1><p>{adminFr.priceDescription}</p></div><div className="ad-price-current"><span>{adminFr.currentPrice}</span><strong>{euro(priceCents)}</strong></div></div>
    <section className="ad-grid ad-price-status"><article className="ad-stat ad-sale-state"><span>{adminFr.paymentSwitch}</span><strong className={enabled?"ad-state-on":"ad-state-off"}><i aria-hidden="true"/>{enabled?adminFr.paymentOn:adminFr.paymentOff}</strong><small>{adminFr.readOnlySetting}</small></article><article className="ad-stat ad-stripe-mode"><span>{adminFr.stripeMode}</span><strong>{mode}</strong><small>{key.mode==="test"?adminFr.stripeTest:key.mode==="live"?adminFr.stripeLive:adminFr.stripeMissing}</small></article></section>
    <div className="ad-price-section-heading"><h2>{adminFr.saleConfiguration}</h2></div>
    <PriceForms priceCents={priceCents} copy={{currentPrice:adminFr.currentPrice,priceEuro:adminFr.priceEuro,priceSuffix:adminFr.priceSuffix,savePrice:adminFr.savePrice,confirmPrice:adminFr.confirmPrice,promoTitle:adminFr.promoTitle,promoCode:adminFr.promoCode,discountType:adminFr.discountType,percentDiscount:adminFr.percentDiscount,amountDiscount:adminFr.amountDiscount,discountValue:adminFr.discountValue,expiresAt:adminFr.expiresAt,maxUses:adminFr.maxUses,createPromo:adminFr.createPromo,confirmPromo:adminFr.confirmPromo,actionDone:adminFr.actionDone,actionFailed:adminFr.actionFailed,formError:adminFr.formError}}/>
    <section className="ad-panel ad-promo-list"><h2>{adminFr.promotionList}</h2>{codeResult.error?<p role="alert">{adminFr.stripeLoadFailed}</p>:codeResult.data.length===0?<p>{adminFr.noPromos}</p>:<div className="ad-table-wrap"><table><thead><tr><th>{adminFr.promoCode}</th><th>{adminFr.discount}</th><th>{adminFr.promoStatus}</th><th>{adminFr.uses}</th><th>{adminFr.expires}</th></tr></thead><tbody>{codeResult.data.map(promo=>{const coupon=promo.coupon;const description=coupon.percent_off!==null?adminFr.percentLabel(coupon.percent_off):adminFr.fixedDiscount(euro(coupon.amount_off||0));const active=promo.active&&coupon.valid;return <tr key={promo.id}><td>{promo.code}</td><td>{description}</td><td>{active?adminFr.promoActive:adminFr.promoInactive}</td><td>{promo.times_redeemed} / {promo.max_redemptions??adminFr.unlimited}</td><td>{date(promo.expires_at||coupon.redeem_by)}</td></tr>;})}</tbody></table></div>}</section>
  </main>;
}
