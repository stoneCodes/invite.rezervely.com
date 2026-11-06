"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const BEACON="https://static.cloudflareinsights.com/beacon.min.js";
export default function WebAnalytics({siteTag}:{siteTag:string}){
  const pathname=usePathname();
  useEffect(()=>{
    if(!siteTag||!pathname||pathname.startsWith("/admin")||pathname.startsWith("/api")||document.getElementById("cf-web-analytics"))return;
    const script=document.createElement("script");
    script.id="cf-web-analytics";
    script.type="module";
    script.src=BEACON;
    script.async=true;
    script.dataset.cfBeacon=JSON.stringify({token:siteTag});
    document.body.appendChild(script);
  },[siteTag,pathname]);
  return null;
}
