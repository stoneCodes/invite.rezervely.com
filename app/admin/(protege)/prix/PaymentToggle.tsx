"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentToggle({enabled,ready,copy}:{enabled:boolean;ready:boolean;copy:{enable:string;disable:string;confirmOn:string;confirmOff:string;failed:string;needsSecret:string}}){
  const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  async function toggle(){const next=!enabled;if(!window.confirm(next?copy.confirmOn:copy.confirmOff))return;setBusy(true);setError("");try{const res=await fetch("/api/admin/prix",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"payments",enabled:next})});const data=await res.json();if(!res.ok)throw new Error(data.error||copy.failed);router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:copy.failed);}finally{setBusy(false);}}
  return <div className="ad-payment-toggle"><button type="button" disabled={busy||(!enabled&&!ready)} onClick={()=>void toggle()}>{enabled?copy.disable:copy.enable}</button>{!enabled&&!ready&&<small>{copy.needsSecret}</small>}{error&&<small role="alert">{error}</small>}</div>;
}
