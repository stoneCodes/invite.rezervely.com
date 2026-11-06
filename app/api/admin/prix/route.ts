import { NextResponse } from "next/server";
import { requireAdmin, originAllowed } from "@/lib/admin/auth";
import { recordAdminEvent, updateAdminEvent } from "@/lib/admin/audit";
import { setAdminSetting } from "@/lib/admin/settings";
import { createPromotionCode } from "@/lib/payment";
import adminFr from "@/lib/i18n/admin-fr";

export const dynamic = "force-dynamic";
type Body = { action?: unknown; priceCents?: unknown; code?: unknown; kind?: unknown; value?: unknown; expires?: unknown; maxRedemptions?: unknown };
const fail=(status:number)=>NextResponse.json({error:adminFr.formError},{status});
export async function POST(req:Request){
  const actor=await requireAdmin();
  if(!actor)return new NextResponse(null,{status:404});
  if(!originAllowed(req))return new NextResponse(null,{status:404});
  let body:Body;
  try{body=await req.json();}catch{return fail(400);}
  try{
    if(body.action==="price"){
      const cents=body.priceCents;
      if(typeof cents!=="number"||!Number.isInteger(cents)||cents<50||cents>1_000_000)return fail(400);
      const eventId=await recordAdminEvent({actor,action:adminFr.savePriceAction,details:{stage:"started",priceCents:cents}});
      try{await setAdminSetting("price_cents",cents);await updateAdminEvent(eventId,{stage:"completed",priceCents:cents});}
      catch(error){await updateAdminEvent(eventId,{stage:"failed",priceCents:cents});throw error;}
      return NextResponse.json({ok:true});
    }
    if(body.action==="promotion"){
      const code=typeof body.code==="string"?body.code.trim():"";
      const kind=body.kind;
      const value=body.value;
      const max=body.maxRedemptions;
      if(!/^[A-Za-z0-9]{3,32}$/.test(code)||(kind!=="percent"&&kind!=="amount")||typeof value!=="number"||!Number.isInteger(value))return fail(400);
      if(kind==="percent"&&(value<1||value>100))return fail(400);
      if(kind==="amount"&&(value<1||value>1_000_000))return fail(400);
      if(max!==undefined&&max!==null&&(!Number.isInteger(max)||Number(max)<1||Number(max)>1_000_000))return fail(400);
      let expiresAt:number|undefined;
      if(body.expires){
        if(typeof body.expires!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(body.expires))return fail(400);
        const date=new Date(`${body.expires}T23:59:59.000Z`);
        if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==body.expires||date.getTime()<=Date.now())return fail(400);
        expiresAt=Math.floor(date.getTime()/1000);
      }
      const eventId=await recordAdminEvent({actor,action:adminFr.promoAction,details:{stage:"started",code,kind,value,expiresAt,maxRedemptions:max??null}});
      let promo;
      try{promo=await createPromotionCode({code,kind,value,expiresAt,maxRedemptions:typeof max==="number"?max:undefined});}
      catch(error){await updateAdminEvent(eventId,{stage:"failed",code,kind,value,expiresAt});throw error;}
      await updateAdminEvent(eventId,{stage:"completed",code:promo.code,promotionCodeId:promo.id,couponId:promo.coupon.id,kind,value,expiresAt:promo.expires_at,maxRedemptions:promo.max_redemptions});
      return NextResponse.json({ok:true,promotionCode:promo});
    }
  }catch(error){
    console.error("admin.price",error instanceof Error?error.message:error);
    return NextResponse.json({error:adminFr.actionFailed},{status:502});
  }
  return fail(400);
}

export async function GET(){
  if(!await requireAdmin())return new NextResponse(null,{status:404});
  return fail(405);
}
