"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Copy = {
  resendSpace: string; offerPublication: string; unpublish: string; extend: string; saveDate: string;
  deleteInvitation: string; deleteWord: string; confirmOffer: string; confirmResend: string;
  confirmUnpublish: string; confirmExtend: string; confirmDelete: string; actionDone: string;
  actionFailed: string; actionWorking: string; dateRequired: string;
  actions: string;
  emailWarning: string;
  grantPdf: string; revokePdf: string; confirmGrantPdf: string; confirmRevokePdf: string;
};
export default function Actions({ id, copy, canOffer, canUnpublish, hasPdfGrant }: { id:string; copy:Copy; canOffer:boolean; canUnpublish:boolean; hasPdfGrant:boolean }) {
  const router=useRouter(); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(""); const [date,setDate]=useState("");
  async function run(action:"offer"|"resend"|"unpublish"|"extend"|"delete"|"pdf-grant"|"pdf-revoke") {
    const confirmText={offer:copy.confirmOffer,resend:copy.confirmResend,unpublish:copy.confirmUnpublish,extend:copy.confirmExtend,delete:copy.confirmDelete,"pdf-grant":copy.confirmGrantPdf,"pdf-revoke":copy.confirmRevokePdf}[action];
    if(!window.confirm(confirmText))return;
    const body:{action:string;date?:string;confirmation?:string}={action};
    if(action==="extend") { if(!date){setMessage(copy.dateRequired);return;} body.date=date; }
    if(action==="delete") { const typed=window.prompt(copy.deleteWord); if(typed!=="SUPPRIMER"){setMessage(copy.actionFailed);return;} body.confirmation=typed; }
    setBusy(true);setMessage("");
    try { const res=await fetch(`/api/admin/invitations/${id}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}); const result=await res.json(); if(!res.ok)throw new Error(result.error||copy.actionFailed); setMessage(result.emailSent===false?`${copy.actionDone} ${copy.emailWarning}`:copy.actionDone); if(result.deleted){router.push("/admin/invitations");router.refresh();return;} router.refresh(); }
    catch(e){setMessage(e instanceof Error?e.message:copy.actionFailed);} finally{setBusy(false);}
  }
  return <section className="ad-panel ad-actions"><h2>{copy.actions}</h2><div className="ad-action-grid">
    <button disabled={busy||!canOffer} onClick={()=>void run("offer")}>{copy.offerPublication}</button>
    <button disabled={busy} onClick={()=>void run("resend")}>{copy.resendSpace}</button>
    <button disabled={busy||!canUnpublish} onClick={()=>void run("unpublish")}>{copy.unpublish}</button>
    <form onSubmit={e=>{e.preventDefault();void run("extend")}}><label>{copy.extend}<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><button disabled={busy} type="submit">{copy.saveDate}</button></form>
    <button className="ad-danger" disabled={busy} onClick={()=>void run("delete")}>{copy.deleteInvitation}</button>
    {!hasPdfGrant?<button disabled={busy} onClick={()=>void run("pdf-grant")}>{copy.grantPdf}</button>:<button disabled={busy} onClick={()=>void run("pdf-revoke")}>{copy.revokePdf}</button>}
  </div>{busy&&<p role="status">{copy.actionWorking}</p>}{message&&<p role="status">{message}</p>}</section>;
}
