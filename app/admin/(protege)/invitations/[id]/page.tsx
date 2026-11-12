import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/supabase";
import { invitePath } from "@/lib/slug";
import type { InvitationRow } from "@/lib/types";
import adminFr from "@/lib/i18n/admin-fr";
import Actions from "../Actions";

export const dynamic="force-dynamic";
type Extended=InvitationRow & {comped_at:string|null;keep_until:string|null};
type Rsvp={id:string;name:string;attending:boolean;guests:number;message:string|null;created_at:string};
const date=(v:string|null|undefined)=>{if(!v)return "—";const parsed=new Date(v);return Number.isFinite(parsed.getTime())?new Intl.DateTimeFormat("fr-FR",{dateStyle:"medium",...(v.includes("T")?{timeStyle:"short" as const}:{})}).format(parsed):"—";};
const amount=(v:number|null|undefined)=>typeof v==="number"?new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"}).format(v/100):"—";
const list=(items:string[])=>items.filter(Boolean).join(" · ")||"—";

export default async function InvitationDetails({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{reponses?:string}>}){
  if(!await requireAdmin())notFound();
  const [{id},query]=await Promise.all([params,searchParams]);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))notFound();
  const repliesPage=Math.max(1,Math.min(10000,Number.parseInt(query.reponses||"1",10)||1));
  const replySize=50;
  const [{data:inv,error},{data:replies,count:replyCount,error:replyError}]=await Promise.all([
    db().from("invitations").select("*").eq("id",id).maybeSingle<Extended>(),
    db().from("rsvps").select("id,name,attending,guests,message,created_at",{count:"exact"}).eq("invitation_id",id).order("created_at",{ascending:false}).range((repliesPage-1)*replySize,repliesPage*replySize-1),
  ]);
  if(error||!inv)notFound();
  const data=inv.data;
  const publicHref=invitePath(inv.slug);
  const paymentHref=inv.stripe_session_id?`https://dashboard.stripe.com/payments/${encodeURIComponent(inv.stripe_session_id)}`:null;
  const templateName=({cygnes:"Lac aux cygnes","nuit-doree":"Nuit dorée","jardin-nuit":"Le jardin secret",appel:"Appel entrant","boule-neige":"Le domaine",origami:"Origami",velours:"Éclat de velours",dot:"La dot",vinyle:"Face A",toast:"Le toast",gateau:"Le gâteau magique",pinata:"La piñata",livre:"Il était une fois"} as Record<string,string>)[inv.template]||inv.template;
  return <main className="ad-main">
    <p><Link href="/admin/invitations">← {adminFr.backToList}</Link></p>
    <div className="ad-title"><h1>{[data.partner1, data.partner2].filter(Boolean).join(" & ")}</h1></div>
    <section className="ad-panel"><h2>{adminFr.details}</h2><div className="ad-detail-grid">
      <p><b>{adminFr.ownerEmail}</b><br/>{inv.owner_email||"—"}</p><p><b>{adminFr.template}</b><br/>{templateName}</p>
      <p><b>{adminFr.invitationStatus}</b><br/>{inv.status==="published"?adminFr.publishedStatus:adminFr.draft}</p>
      <p><b>{adminFr.payment}</b><br/>{inv.comped_at?adminFr.offeredPayment:inv.paid_at?adminFr.paidOn(date(inv.paid_at),amount(inv.paid_amount_cents)):adminFr.unpaid}</p>
      <p><b>{adminFr.pdfAccess}</b><br/>{inv.paid_at?adminFr.pdfAccessPaid:inv.comped_at?adminFr.pdfAccessComped:inv.pdf_granted_at?adminFr.pdfAccessGranted:adminFr.pdfAccessUnavailable}</p>
      <p><b>{adminFr.createdAt}</b><br/>{date(inv.created_at)}</p><p><b>{adminFr.publishedOn(inv.published_at?date(inv.published_at):"—")}</b></p>
      <p><b>{adminFr.eventDate}</b><br/>{date(data.dateISO)}</p><p><b>{adminFr.eventVenue}</b><br/>{data.venue.name}<br/>{data.venue.address}</p>
      <p><b>{adminFr.keepUntil}</b><br/>{date(inv.keep_until)}</p><p><b>{adminFr.eventIntro}</b><br/>{data.intro||"—"}</p>
      <p><b>{adminFr.language}</b><br/>{data.lang==="en"?adminFr.english:adminFr.french}</p><p><b>{adminFr.rsvpDeadline}</b><br/>{date(data.rsvpBy)}</p>
      {data.photoUrl&&<p><b>{adminFr.photo}</b><br/><a href={data.photoUrl} target="_blank" rel="noreferrer">{adminFr.photo}</a></p>}
      <p><b>{adminFr.publicInvite}</b><br/><a href={publicHref} target="_blank" rel="noreferrer">{publicHref}</a></p>
      <p><b>{adminFr.ownerSpace}</b><br/><a href={`/espace/${inv.edit_token}`} target="_blank" rel="noreferrer">/espace/{inv.edit_token}</a></p>
      {paymentHref&&<p><b>{adminFr.stripePayment}</b><br/><a href={paymentHref} target="_blank" rel="noreferrer">{inv.stripe_session_id}</a></p>}
    </div>
    <h3>{adminFr.programme}</h3><ul>{data.programme.map((item,i)=><li key={`${item.t}-${i}`}>{item.t} · {item.title}{item.note?` — ${item.note}`:""}</li>)}</ul>
    {data.dressCode.enabled&&<><h3>{data.dressCode.title||adminFr.dressCode}</h3><p>{data.dressCode.note}</p><p>{adminFr.menDress} : {data.dressCode.men.label} · {data.dressCode.men.text}</p><p>{adminFr.womenDress} : {data.dressCode.women.label} · {data.dressCode.women.text}</p><p>{list(data.dressCode.colors.map(c=>`${c.name} (${c.hex})`))}</p></>}
    {data.verse&&<><h3>{data.verse.ref}</h3><p>{data.verse.orig&&<>{data.verse.orig}<br/></>}{data.verse.text}</p></>}
    {data.story.length>0&&<><h3>{adminFr.details}</h3><ul>{data.story.map((item,i)=><li key={`${item.y}-${i}`}>{item.y} · {item.text}</li>)}</ul></>}
    </section>
    <section className="ad-panel"><h2>{adminFr.answers} · {replyCount||0}</h2>{replyError?<p role="alert">{adminFr.pageError}</p>:!replyCount?<p>{adminFr.noAnswers}</p>:<><div className="ad-table-wrap"><table><thead><tr><th>{adminFr.guestName}</th><th>{adminFr.attending}</th><th>{adminFr.people}</th><th>{adminFr.message}</th><th>{adminFr.createdAt}</th></tr></thead><tbody>{(replies as Rsvp[]).map(r=><tr key={r.id}><td>{r.name}</td><td>{r.attending?adminFr.yes:adminFr.no}</td><td>{r.guests}</td><td>{r.message||"—"}</td><td>{date(r.created_at)}</td></tr>)}</tbody></table></div><nav className="ad-pagination"><span>{adminFr.replyPageOf(repliesPage,Math.max(1,Math.ceil((replyCount||0)/replySize)))}</span><div>{repliesPage>1&&<Link href={`/admin/invitations/${id}?reponses=${repliesPage-1}`}>{adminFr.previous}</Link>}{repliesPage<Math.ceil((replyCount||0)/replySize)&&<Link href={`/admin/invitations/${id}?reponses=${repliesPage+1}`}>{adminFr.next}</Link>}</div></nav></>}</section>
    <Actions id={id} canOffer={!inv.paid_at&&!inv.comped_at} canUnpublish={inv.status==="published"} hasPdfGrant={!!inv.pdf_granted_at} copy={{resendSpace:adminFr.resendSpace,offerPublication:adminFr.offerPublication,unpublish:adminFr.unpublish,extend:adminFr.extend,saveDate:adminFr.saveDate,deleteInvitation:adminFr.deleteInvitation,deleteWord:adminFr.deleteWord,confirmOffer:adminFr.confirmOffer,confirmResend:adminFr.confirmResend,confirmUnpublish:adminFr.confirmUnpublish,confirmExtend:adminFr.confirmExtend,confirmDelete:adminFr.confirmDelete,actionDone:adminFr.actionDone,actionFailed:adminFr.actionFailed,actionWorking:adminFr.actionWorking,dateRequired:adminFr.dateRequired,actions:adminFr.actions,emailWarning:adminFr.emailWarning,grantPdf:adminFr.grantPdf,revokePdf:adminFr.revokePdf,confirmGrantPdf:adminFr.confirmGrantPdf,confirmRevokePdf:adminFr.confirmRevokePdf}}/>
  </main>;
}
