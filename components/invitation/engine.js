// Moteur des invitations animées (porté depuis le prototype validé).
// mountInvitation(données, template, options) monte l'invitation sur le balisage de markup.ts.
/* eslint-disable */
import { inviteDict } from "../../lib/i18n/invite";
import { LOCALE } from "../../lib/i18n";
import { mountCouple } from "./dresscode/couple";
const CAP=s=>s.charAt(0).toUpperCase()+s.slice(1);
export const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function dateParts(iso,lang="fr",tz="Europe/Paris"){
  const d=new Date(iso);if(isNaN(d))return null;
  const en=lang==="en",f=o=>new Intl.DateTimeFormat(LOCALE[en?"en":"fr"],{timeZone:tz,...o}).format(d);
  const day=f({day:"numeric"}),month=f({month:"long"}),year=f({year:"numeric"});
  return{day,month,year,label:`${f({day:"2-digit"})} · ${f({month:"2-digit"})} · ${year}`,
    full:`${CAP(f({weekday:"long"}))} ${day} ${en?CAP(month):month} ${year} · ${en?f({hour:"numeric",minute:"2-digit",hour12:true}):f({hour:"2-digit",minute:"2-digit"}).replace(":","h")}`};
}
export function normalize(d){
  const T=inviteDict(d.lang);
  const p=dateParts(d.dateISO,d.lang)||{day:"?",month:"?",year:"?",label:"",full:""};
  const ini=s=>(String(s||"").trim()[0]||"").toUpperCase();
  return{...d,raw:d,
    partner1:esc(d.partner1),partner2:esc(d.partner2),
    monogram:esc(d.monogram||`${ini(d.partner1)}&${ini(d.partner2)}`),
    dateLabel:p.label,dateFull:p.full,
    scratch:[{v:p.day,l:T.c.day},{v:CAP(p.month),l:T.c.month},{v:p.year,l:T.c.year}],
    programme:(d.programme||[]).map(x=>({t:esc(x.t),title:esc(x.title),note:esc(x.note)})),
    story:(d.story||[]).map(x=>({y:esc(x.y),text:esc(x.text)})),
    dressCode:{...d.dressCode,colors:(d.dressCode?.colors||[]).slice(0,4).map(c=>({...c,name:esc(c.name)}))},
    photo:d.photoUrl||null};
}
export function mountInvitation(INPUT,TPL,OPTS={}){

/* ===== Données du client (ce que le formulaire remplira) ===== */
const DATA=normalize(INPUT);
const T=inviteDict(INPUT.lang);
let alive=true;const CLEAN=[];
const TEMPLATES = {"cygnes":{fx:"petals"},"nuit-doree":{fx:"gold"},"jardin-nuit":{fx:"fireflies"}};
const PLACEHOLDER="data:image/svg+xml,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 300"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3DCD4"/><stop offset=".6" stop-color="#E9CFC6"/><stop offset="1" stop-color="#C9B9A0"/></linearGradient></defs><rect width="230" height="300" fill="url(#g)"/><g fill="#8A5A5E" opacity=".5"><circle cx="92" cy="128" r="24"/><path d="M48 300c0-62 18-118 44-118s44 56 44 118z"/><circle cx="140" cy="118" r="26"/><path d="M92 300c0-70 20-130 48-130s50 60 50 130z"/></g><text x="115" y="272" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="13" fill="#5E3E41">${esc(T.c.photoHere)}</text></svg>`);
const $=id=>document.getElementById(id), tpl=()=>document.body.dataset.tpl, wait=ms=>new Promise(r=>setTimeout(r,ms));
const REDUCE=matchMedia("(prefers-reduced-motion: reduce)").matches;

function render(){
  $("names").innerHTML=`<span class="w1">${DATA.partner1}</span><span class="amp w2">&amp;</span><span class="w3">${DATA.partner2}</span>`;
  $("dateLine").textContent=DATA.dateLabel; $("intro").textContent=DATA.intro; $("photo").src=DATA.photo||PLACEHOLDER;
  $("scratchRow").innerHTML=DATA.scratch.map(s=>`<div class="scratch"><div class="disc"><b${String(s.v).length>5?' style="font-size:1.05rem"':''}>${s.v}</b><canvas></canvas></div><small>${s.l}</small></div>`).join("");
  $("heartDate").textContent=DATA.dateLabel;
  $("timeline").innerHTML=DATA.programme.map(p=>`<li><time>${p.t}</time><div><strong>${p.title}</strong><em>${p.note}</em></div></li>`).join("");
  $("venueName").textContent=DATA.venue.name; $("venueAddr").textContent=DATA.venue.address;
  $("mapsBtn").href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(DATA.venue.name+", "+DATA.venue.address);
  const s=new Date(DATA.dateISO),e=new Date(s.getTime()+10*3600e3),f=d=>d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  $("calBtn").href="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(T.c.weddingOf(DATA.raw.partner1,DATA.raw.partner2))+`&dates=${f(s)}/${f(e)}&location=`+encodeURIComponent(DATA.venue.name+", "+DATA.venue.address);
  $("story").closest("section").hidden=!DATA.story.length;$("timeline").closest("section").hidden=!DATA.programme.length;$("rsvpBy").hidden=!DATA.rsvpBy;
  $("story").innerHTML=DATA.story.map(x=>`<div><span>${x.y}</span><p>${x.text}</p></div>`).join("");
  $("rsvpBy").textContent=DATA.rsvpBy;
  renderVerse();$("dateFull").textContent=DATA.dateFull;renderDress();
}
function renderVerse(){const v=DATA.verse&&DATA.verse.text?DATA.verse:null;$("verse").hidden=!v;if(!v)return;$("vOrig").textContent=v.orig||"";$("vOrig").hidden=!v.orig;$("vText").textContent=v.orig?v.text:T.c.quote(v.text);$("vRef").textContent=v.ref||"";}

/* ===== Dress code ===== */
let dcIdx=0, dcTimer, dcManual=false, couple=null;
function renderDress(){
  const dc=DATA.dressCode, cols=dc.colors.slice(0,4);
  $("dress").hidden=dc.enabled===false||!cols.length; if($("dress").hidden)return;
  $("dcTitle").textContent=dc.title; $("dcNote").textContent=dc.note;
  $("dcMenL").textContent=dc.men.label; $("dcMen").textContent=dc.men.text; $("dcWomenL").textContent=dc.women.label; $("dcWomen").textContent=dc.women.text;
  $("dcSwatches").style.setProperty("--nc",cols.length);
  $("dcSwatches").innerHTML=cols.map((c,i)=>{const m=c.men||c.hex,w=c.women||c.hex,bg=m===w?m:`linear-gradient(135deg,${m} 50%,${w} 50%)`;return `<button type="button" class="dc-sw" data-i="${i}" style="--c:${bg}" aria-pressed="false"><i></i><small>${c.name}</small></button>`;}).join("");
  $("dcSwatches").querySelectorAll(".dc-sw").forEach(b=>b.onclick=()=>{dcManual=true; setDc(+b.dataset.i);});
  if(dcIdx>=cols.length)dcIdx=0; setDc(dcIdx); clearInterval(dcTimer);
  dcTimer=setInterval(()=>{ if(!dcManual && cols.length>1) setDc((dcIdx+1)%cols.length); },2800);
}
function setDc(i){ const c=DATA.dressCode.colors[i]; dcIdx=i; const f=$("dcFigs"); f.style.setProperty("--gm",c.men||c.hex); f.style.setProperty("--gw",c.women||c.hex); const ce=$("dcCouple"); if(couple?.el!==ce){couple?.destroy(); couple=mountCouple(ce,DATA.dressCode.couple);} couple.set(c.men||c.hex,c.women||c.hex);
  $("dcName").innerHTML=c.name; $("dcSwatches").querySelectorAll(".dc-sw").forEach(b=>b.setAttribute("aria-pressed",+b.dataset.i===i));
   }

/* ===== Date à gratter obligatoire ===== */
function visibleScratches(){return [...document.querySelectorAll(".disc canvas,.heart canvas")].filter(c=>c.parentElement.offsetWidth>0);}
function lockGate(){document.body.classList.add("gated");checkGate(true);}
function checkGate(silent){
  const cs=visibleScratches(),left=cs.filter(c=>!c.classList.contains("done")).length;
  if(left>0){$("gateHint").textContent=cs.length>1&&left<cs.length?T.classic.gateLeft(left):T.classic.gateAll;return;}
  if(!document.body.classList.contains("gated"))return;
  document.body.classList.remove("gated");$("gateHint").textContent=T.classic.gateDone;
  if(!silent){const r=$("dateFull").getBoundingClientRect();fx.heart(r.left+r.width/2,r.top+r.height/2);boom();
    setTimeout(()=>scrollBy({top:innerHeight*.5,behavior:REDUCE?"auto":"smooth"}),1100);}
}

/* ===== Grattage ===== */
const cssVar=n=>getComputedStyle(document.body).getPropertyValue(n).trim();
function initScratch(cv){
  const box=cv.parentElement,dpr=devicePixelRatio||1,w=box.offsetWidth,h=box.offsetHeight; if(!w) return;
  cv.width=w*dpr; cv.height=h*dpr; cv.classList.remove("done");
  const ctx=cv.getContext("2d"); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.globalCompositeOperation="source-over";
  const a=cssVar("--scratch-a"),b=cssVar("--scratch-b"),g=ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0,a);g.addColorStop(.45,b);g.addColorStop(.7,a);g.addColorStop(1,b); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  for(let i=0;i<(w*h)/30;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*.7})`;const s=Math.random()*1.8;ctx.fillRect(Math.random()*w,Math.random()*h,s,s);}
  ctx.fillStyle="rgba(60,30,30,.5)";ctx.font=`italic ${Math.min(w,h)*.15}px Georgia,serif`;ctx.textAlign="center";ctx.fillText(T.c.scratchHere,w/2,h/2+5);
  let down=false,n=0;
  const hit=ev=>{const r=cv.getBoundingClientRect();ctx.globalCompositeOperation="destination-out";ctx.beginPath();ctx.arc(ev.clientX-r.left,ev.clientY-r.top,Math.min(w,h)*.15,0,7);ctx.fill();if(++n%6===0)check();};
  const check=()=>{const d=ctx.getImageData(0,0,cv.width,cv.height).data;let c=0,t=0;for(let i=3;i<d.length;i+=64){t++;if(d[i]===0)c++;}
    if(c/t>.45){cv.classList.add("done");chime();checkGate();const r=cv.getBoundingClientRect();fx.burst(r.left+r.width/2,r.top+r.height/2,30);}};
  cv.onpointerdown=ev=>{down=true;cv.setPointerCapture(ev.pointerId);hit(ev);}; cv.onpointermove=ev=>{if(down)hit(ev);}; cv.onpointerup=cv.onpointercancel=()=>{down=false;};
}
const initAllScratch=()=>document.querySelectorAll(".disc canvas,.heart canvas").forEach(initScratch);

/* ===== Sprites lumineux ===== */
function sprite(inner,outer){const c=document.createElement("canvas");c.width=c.height=64;const x=c.getContext("2d"),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,inner);g.addColorStop(.22,outer);g.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=g;x.fillRect(0,0,64,64);return c;}
const SP={gold:sprite("rgba(255,250,225,1)","rgba(240,195,100,.6)"),fire:sprite("rgba(255,253,225,1)","rgba(255,222,140,.55)"),pink:sprite("rgba(255,245,250,1)","rgba(255,160,190,.55)")};
function drawPetal(ctx,p,al){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.scale(1,.55+.45*Math.sin(p.ph));ctx.globalAlpha=al;ctx.fillStyle=p.col;ctx.beginPath();ctx.ellipse(0,0,p.r,p.r*.62,0,0,7);ctx.fill();ctx.globalAlpha=al*.5;ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(-p.r*.3,-p.r*.15,p.r*.35,p.r*.18,0,0,7);ctx.fill();ctx.restore();}
const PETAL_COLS=["#F4B8C2","#F7CCD3","#EFA3B1","#FBE2E5","#E890A2"];

/* ===== Particules d'ambiance (canvas fixe) ===== */
const fx=(()=>{
  const cv=$("fx"),ctx=cv.getContext("2d");let W=0,H=0,parts=[],mode="petals",t=0;
  function size(){const r=cv.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);}
  function amb(){const p={x:Math.random()*W,y:Math.random()*H,amb:true,ph:Math.random()*6};
    if(mode==="petals"){p.y=-20-Math.random()*H;p.vx=(Math.random()-.5)*.4;p.vy=.5+Math.random()*.7;p.r=5+Math.random()*5;p.rot=Math.random()*6;p.vr=(Math.random()-.5)*.04;p.col=PETAL_COLS[Math.random()*5|0];}
    else if(mode==="gold"){p.vx=(Math.random()-.5)*.2;p.vy=-.15-Math.random()*.4;p.r=2+Math.random()*4;}
    else{p.r=4+Math.random()*5;p.a=Math.random()*6;} return p;}
  function setMode(m){mode=m;parts=[];const n=m==="petals"?20:m==="gold"?55:30;for(let i=0;i<n;i++)parts.push(amb());}
  function add(x,y,vx,vy,o={}){parts.push(Object.assign({x,y,vx,vy,life:1,decay:.012,grav:mode==="petals"?.1:.05,r:mode==="petals"?5+Math.random()*6:2+Math.random()*4,rot:Math.random()*6,vr:(Math.random()-.5)*.2,ph:Math.random()*6,col:PETAL_COLS[Math.random()*5|0]},o));}
  function burst(x,y,n,pow=7){if(REDUCE)return;const r=cv.getBoundingClientRect();x-=r.left;y-=r.top;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=1.5+Math.random()*pow;add(x,y,Math.cos(a)*s,Math.sin(a)*s);}}
  function storm(n){if(REDUCE)return;for(let i=0;i<n;i++){add(-20+Math.random()*W*.5,H+10+Math.random()*200,3+Math.random()*5,-6-Math.random()*7,{decay:.005+Math.random()*.004,grav:.06,r:6+Math.random()*7});}}
  function fireworks(x,y){if(REDUCE)return;const r=cv.getBoundingClientRect();x-=r.left;y-=r.top;for(let i=0;i<260;i++){const a=Math.random()*Math.PI*2,s=2+Math.random()*13;add(x,y,Math.cos(a)*s,Math.sin(a)*s,{decay:.006+Math.random()*.01,grav:.09});}}
  function heart(x,y){if(REDUCE)return;const r=cv.getBoundingClientRect();x-=r.left;y-=r.top;for(let i=0;i<150;i++){const a=Math.random()*Math.PI*2,hx=16*Math.pow(Math.sin(a),3),hy=-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a));add(x,y,hx*.2,hy*.2,{decay:.006+Math.random()*.004,grav:0});}}
  function frame(){if(!alive)return;t++;ctx.clearRect(0,0,W,H);const fade=Math.max(.18,1-scrollY/(innerHeight*.9));
    ctx.globalCompositeOperation=mode==="petals"?"source-over":"lighter";
    for(let i=parts.length-1;i>=0;i--){const p=parts[i];
      if(p.amb){
        if(mode==="petals"){p.ph+=.05;p.x+=p.vx+Math.sin(t*.01+p.ph)*.35;p.y+=p.vy;p.rot+=p.vr;if(p.y>H+20){Object.assign(p,amb());p.y=-20;}drawPetal(ctx,p,.8*fade);}
        else if(mode==="gold"){p.x+=p.vx;p.y+=p.vy;p.ph+=.04;if(p.y<-10){p.y=H+10;p.x=Math.random()*W;}ctx.globalAlpha=Math.max(0,(.35+.45*Math.sin(p.ph))*fade);ctx.drawImage(SP.gold,p.x-p.r*2,p.y-p.r*2,p.r*4,p.r*4);}
        else{p.a+=(Math.random()-.5)*.35;p.x+=Math.cos(p.a)*.45;p.y+=Math.sin(p.a)*.35-.05;p.ph+=.03+Math.random()*.02;if(p.x<-10)p.x=W+10;if(p.x>W+10)p.x=-10;if(p.y<-10)p.y=H+10;if(p.y>H+10)p.y=-10;ctx.globalAlpha=Math.max(0,Math.sin(p.ph))*fade;ctx.drawImage(SP.fire,p.x-p.r*2,p.y-p.r*2,p.r*4,p.r*4);}
      }else{p.x+=p.vx;p.y+=p.vy;p.vx*=.97;p.vy=p.vy*.97+p.grav;p.life-=p.decay;p.rot+=p.vr;p.ph+=.2;
        if(p.life<=0||p.y>H+60){parts.splice(i,1);continue;}
        if(mode==="petals")drawPetal(ctx,p,Math.min(1,p.life*1.4));else{ctx.globalAlpha=p.life;ctx.drawImage(SP.gold,p.x-p.r*2,p.y-p.r*2,p.r*4,p.r*4);}}
    }ctx.globalAlpha=1;requestAnimationFrame(frame);}
  addEventListener("resize",size);CLEAN.push(()=>removeEventListener("resize",size));size();if(!REDUCE)requestAnimationFrame(frame);
  return{setMode,burst,storm,fireworks,heart};
})();

/* ===== Musique (boîte à musique synthétisée) ===== */
let actx,master,musicOn=false,loopTimer;
const MELODY=[659,784,1047,988,784,659,587,659,698,880,1047,880,784,698,659,0];
function note(f,t,dur=1.6,vol=.5){if(!f)return;const o=actx.createOscillator(),o2=actx.createOscillator(),g=actx.createGain(),g2=actx.createGain();o.frequency.value=f;o2.frequency.value=f*2;g2.gain.value=.18;o.connect(g);o2.connect(g2).connect(g);g.connect(master);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.start(t);o2.start(t);o.stop(t+dur);o2.stop(t+dur);}
function playLoop(){const t0=actx.currentTime+.05,st=.42,k=tpl()==="nuit-doree"?.5:1;MELODY.forEach((f,i)=>note(f*k,t0+i*st,1.8,i%4===0?.55:.38));[262,349,392,330].forEach((f,i)=>note(f/2*k,t0+i*st*4,2.6,.35));loopTimer=setTimeout(playLoop,MELODY.length*st*1000);}
function startMusic(){try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();if(!master){master=actx.createGain();master.gain.value=.13;master.connect(actx.destination);}actx.resume();if(!musicOn){musicOn=true;playLoop();}$("sound").hidden=false;$("sound").textContent="♪";}catch(e){}}
function stopMusic(){musicOn=false;clearTimeout(loopTimer);if(actx)actx.suspend();$("sound").textContent="✕";}
function chime(){if(actx&&musicOn){const t=actx.currentTime;[1319,1568,2093].forEach((f,i)=>note(f,t+i*.08,1.2,.3));}}
function boom(){if(!actx||!musicOn)return;const t=actx.currentTime;[131,196,262,392,523,784].forEach((f,i)=>note(f,t+i*.03,3.2,.5));}
$("sound").onclick=()=>musicOn?stopMusic():startMusic();

/* ===== Mise en scène d'ouverture ===== */
const stage=$("stage"),hero=$("hero"),scene=$("scene");
let opening=false,token=0;
const sealHTML=()=>`<span>${DATA.monogram}</span>`;
const tapHTML=()=>`<div class="tap"><div class="who">${DATA.partner1} &amp; ${DATA.partner2}</div><div class="t">${esc(T.classic.tapSeal)}</div></div>`;

function hideNames(){document.querySelectorAll("#names span").forEach(s=>{s.className=s.className.replace(/\b(write|d2|d3|reveal-soft|on)\b/g,"").trim();});
  $("names").style.opacity=0;$("dateLine").style.opacity=0;}
function writeNames(){const n=$("names");n.style.opacity=1;["w1","w2","w3"].forEach((c,i)=>{const el=n.querySelector("."+c);el.classList.add("write");if(i)el.classList.add("d"+(i+1));});
  const d=$("dateLine");d.classList.remove("fade-up");void d.offsetWidth;d.style.opacity="";d.classList.add("fade-up");}
function finish(my){if(my!==token)return;stage.classList.add("gone");document.body.classList.remove("locked");setTimeout(()=>{if(my===token)stage.hidden=true;},1000);}

const BUILD={
  "cygnes"(){
    stage.className="fixed-frame st-cygnes";
    stage.innerHTML=`<div class="bokeh"></div>
      <div class="env3d" id="env"><div class="e-shadow"></div><div class="floaty">
        <div class="e-back"></div><div class="e-card" id="card"></div>
        <div class="e-front-w"><div class="e-front"></div></div>
        <div class="e-flapw" id="flapw"><div class="e-flap" id="flap"><div class="o"></div><div class="i"></div></div></div>
        <button class="seal breathe" id="seal" aria-label="${esc(T.classic.open)}">${sealHTML()}</button>
      </div></div><div class="sweep" id="sweep"></div>${tapHTML()}`;
    return async my=>{
      const seal=$("seal"),r=seal.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      // le sceau se brise en 4 éclats
      const fl=seal.parentElement;seal.style.opacity=0;
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy],i)=>{const s=document.createElement("div");s.className="shard";s.style.clipPath=`polygon(50% 50%,${sx<0?0:100}% 50%,${sx<0?0:100}% ${sy<0?0:100}%,50% ${sy<0?0:100}%)`;fl.appendChild(s);
        requestAnimationFrame(()=>requestAnimationFrame(()=>{s.style.transform=`translate(${sx*(70+Math.random()*40)}px,${sy*60+80}px) rotate(${sx*(60+i*25)}deg)`;s.style.opacity=0;}));});
      fx.burst(cx,cy,30,6);chime();
      await wait(250);$("flap").classList.add("open");
      await wait(520);$("flapw").classList.add("behind");
      await wait(150);$("card").classList.add("up");
      await wait(1150);if(my!==token)return;
      // la carte s'envole vers l'écran
      const card=$("card"),cr=card.getBoundingClientRect(),fc=document.createElement("div");fc.className="flycard";
      Object.assign(fc.style,{left:cr.left+"px",top:cr.top+"px",width:cr.width+"px",height:cr.height+"px",transform:"rotate(-2deg)",borderRadius:"3px"});
      stage.appendChild(fc);card.style.visibility="hidden";
      const sr=stage.getBoundingClientRect();
      $("env").style.transform="translateY(130%) rotate(9deg)";$("env").style.opacity=0;
      requestAnimationFrame(()=>requestAnimationFrame(()=>Object.assign(fc.style,{left:sr.left+"px",top:"0px",width:sr.width+"px",height:sr.height+"px",transform:"rotate(0)",borderRadius:"0"})));
      fx.storm(150);boom();
      await wait(1150);if(my!==token)return;
      $("sweep").classList.add("go");stage.style.background="transparent";
      writeNames();
      await wait(400);fc.style.transition="opacity .8s";fc.style.opacity=0;setTimeout(()=>fc.remove(),900);
      finish(my);
    };
  },
  "nuit-doree"(){
    stage.className="fixed-frame st-nuit";
    const half=`<div class="half"><div class="seal">${sealHTML()}</div></div>`;
    stage.innerHTML=`<div class="doors" id="doors"><div class="door l"><div class="pic"></div>${half}</div><div class="door r"><div class="pic"></div>${half}</div><div class="seam" id="seam"></div></div>
      <svg class="frame-svg" id="fsvg" preserveAspectRatio="none"><rect x="14" y="14" width="0" height="0" rx="2"/></svg>
      <div class="rays" id="rays"></div><div class="flare" id="flare"></div><div class="flash" id="flash"></div>
      <button class="hit" id="seal" aria-label="${esc(T.classic.open)}"></button>${tapHTML()}`;
    const sr=stage.getBoundingClientRect(),rect=stage.querySelector("rect");rect.setAttribute("width",Math.max(0,sr.width-28));rect.setAttribute("height",Math.max(0,sr.height-28));
    requestAnimationFrame(()=>requestAnimationFrame(()=>{$("doors").classList.add("in");$("fsvg").classList.add("in");}));
    return async my=>{
      const doors=$("doors"),r=$("seal").getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      doors.classList.add("glowseal");stage.classList.add("shake");chime();
      await wait(420);$("seam").classList.add("blast");$("fsvg").classList.add("out");
      await wait(180);$("flash").classList.add("go");$("flare").classList.add("go");boom();
      doors.classList.add("open");$("rays").classList.add("on");stage.classList.add("lit");
      scene.classList.remove("push");void scene.offsetWidth;scene.classList.add("push");
      fx.fireworks(cx,cy);
      await wait(900);if(my!==token)return;writeNames();
      await wait(900);finish(my);
    };
  },
  "jardin-nuit"(){
    stage.className="fixed-frame st-jardin";
    stage.innerHTML=`<canvas class="stage-fx" id="sfx"></canvas>
      <div class="j-env" id="jenv"><div class="halo"></div><div class="bob"><div class="j-light"></div><div class="j-body"></div><div class="j-flap"><div></div></div>
      <button class="seal breathe" id="seal" aria-label="${esc(T.classic.open)}">${sealHTML()}</button></div></div>${tapHTML()}`;
    const fxs=fireflyStage($("sfx"));
    return async my=>{
      const env=$("jenv");env.classList.add("open");chime();
      try{await document.fonts.ready;}catch(e){}
      const er=env.getBoundingClientRect();
      await wait(800);if(my!==token)return;
      env.classList.add("dissolve");fxs.release(er,420);boom();
      await wait(600);stage.classList.add("lit");hero.classList.add("opened");
      await wait(900);if(my!==token)return;
      fxs.formText();
      await wait(2300);if(my!==token)return;
      const n=$("names");n.style.transition="opacity 1s";n.style.opacity=1;$("dateLine").style.transition="opacity 1.2s .4s";$("dateLine").style.opacity=1;
      fxs.scatter();
      await wait(1400);fxs.stop();finish(my);
    };
  }
};

/* Lucioles qui sortent de l'enveloppe et écrivent les prénoms */
function fireflyStage(cv){
  const ctx=cv.getContext("2d");let W,H,d,ps=[],stars=[],phase="idle",run=true,t=0;
  const r0=cv.getBoundingClientRect();d=Math.min(2,devicePixelRatio||1);W=r0.width;H=r0.height;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);
  for(let i=0;i<110;i++)stars.push({x:Math.random()*W,y:Math.random()*H*.75,r:Math.random()*1.3+.2,ph:Math.random()*6});
  function targets(){
    const off=document.createElement("canvas");off.width=W;off.height=H;const o=off.getContext("2d");o.fillStyle="#fff";o.textAlign="center";o.textBaseline="middle";
    document.querySelectorAll("#names span").forEach(s=>{const r=s.getBoundingClientRect(),cs=getComputedStyle(s);o.font=`${cs.fontSize} ${cs.fontFamily}`;o.fillText(s.textContent,r.left-r0.left+r.width/2,r.top-r0.top+r.height/2);});
    const data=o.getImageData(0,0,W,H).data,pts=[];for(let y=0;y<H;y+=3)for(let x=0;x<W;x+=3)if(data[(y*W+x)*4+3]>140)pts.push([x,y]);
    for(let i=pts.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[pts[i],pts[j]]=[pts[j],pts[i]];}return pts;}
  function release(er,n){const cx=er.left-r0.left+er.width/2,cy=er.top-r0.top+er.height/2;
    for(let i=0;i<n;i++)ps.push({x:er.left-r0.left+Math.random()*er.width,y:er.top-r0.top+Math.random()*er.height,cx,cy,a:Math.random()*6,rad:10+Math.random()*120,sp:.02+Math.random()*.03,vy:-.6-Math.random()*1.2,r:2.5+Math.random()*3,ph:Math.random()*6,sprite:Math.random()<.3?SP.pink:SP.fire});phase="swirl";}
  function formText(){const pts=targets();if(!pts.length)return;ps.forEach((p,i)=>{const q=pts[i%pts.length];p.tx=q[0];p.ty=q[1];});phase="form";}
  function scatter(){phase="scatter";ps.forEach(p=>{const a=Math.random()*Math.PI*2,s=1+Math.random()*4;p.vx=Math.cos(a)*s;p.vy=Math.sin(a)*s;});}
  function frame(){if(!run||!alive)return;t++;ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation="lighter";
    if(phase==="idle"||phase==="swirl"){stars.forEach(s=>{ctx.globalAlpha=.4+.4*Math.sin(t*.03+s.ph);ctx.fillStyle="#fff";ctx.fillRect(s.x,s.y,s.r,s.r);});}
    ps.forEach(p=>{p.ph+=.08;
      if(phase==="swirl"){p.a+=p.sp;p.cy+=-.9;p.x+=(p.cx+Math.cos(p.a)*p.rad-p.x)*.06;p.y+=(p.cy+Math.sin(p.a)*p.rad*.6-p.y)*.06;p.rad+=.6;}
      else if(phase==="form"){p.x+=(p.tx-p.x)*.075;p.y+=(p.ty-p.y)*.075;}
      else if(phase==="scatter"){p.x+=p.vx;p.y+=p.vy;p.vx*=.985;p.vy=p.vy*.985-.02;p.fade=(p.fade??1)-.012;}
      const al=(phase==="form"?.85+.15*Math.sin(p.ph):.6+.4*Math.sin(p.ph))*(p.fade??1);
      ctx.globalAlpha=Math.max(0,al);const s=phase==="form"?p.r*2.6:p.r*4;ctx.drawImage(p.sprite,p.x-s/2,p.y-s/2,s,s);});
    ctx.globalAlpha=1;requestAnimationFrame(frame);}
  if(!REDUCE)requestAnimationFrame(frame);
  return{release,formText,scatter,stop:()=>{run=false;}};
}

async function openInvite(){
  if(opening)return;opening=true;const my=token;startMusic();stage.classList.add("opening");
  if(REDUCE){writeNames();hero.classList.add("opened");finish(my);return;}
  await stage._open(my);
}
function buildStage(){
  token++;opening=false;scrollTo(0,0);document.body.classList.add("locked");
  document.querySelectorAll(".flycard").forEach(e=>e.remove());
  stage.hidden=false;stage.removeAttribute("style");stage.classList.add("instant");hero.classList.add("instant");
  hero.classList.remove("opened");scene.classList.remove("push");hideNames();
  stage._open=BUILD[tpl()]();
  $("seal").onclick=openInvite;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{stage.classList.remove("instant");hero.classList.remove("instant");}));
  initAllScratch();prepReveal();if(OPTS.noGate)document.body.classList.remove("gated");else lockGate();
}

/* Apparition des sections au défilement (visibles par défaut si le script ne tourne pas) */
let io;
function prepReveal(){
  if(io)io.disconnect();const secs=[...document.querySelectorAll("#wrap > section")];secs.forEach(s=>{s.classList.remove("pre");delete s.dataset.done;});
  return;
  if(REDUCE||!("IntersectionObserver" in window))return;
  io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.remove("pre");io.unobserve(e.target);}}),{threshold:.15});
  secs.forEach(s=>{s.classList.add("pre");io.observe(s);});
}

function setTemplate(name){
  if(!TEMPLATES[name])name="cygnes";document.body.dataset.tpl=name;
  fx.setMode(TEMPLATES[name].fx);if(musicOn){clearTimeout(loopTimer);playLoop();}
  buildStage();
}
$("rsvp").onsubmit=async e=>{e.preventDefault();const name=$("gName").value.trim();if(!name){$("gName").focus();$("gName").placeholder=T.c.nameMissing;return;}
  const yes=$("attYes").checked,btn=$("rsvp").querySelector("button");$("rsvpErr").hidden=true;
  if(OPTS.onRsvp){btn.disabled=true;btn.textContent=T.c.sending;try{await OPTS.onRsvp({name,attending:yes,guests:yes?+$("gCount").value:0,message:$("gMsg").value.trim()});}
    catch(err){btn.disabled=false;btn.textContent=T.classic.send;$("rsvpErr").hidden=false;return;}}
  $("rsvp").hidden=true;$("thanks").hidden=false;
  $("thanks").innerHTML=`<p style="font-family:var(--f-script);font-size:2.2rem;margin:0">${esc(T.c.thanks(name.split(" ")[0]))}</p><p class="small">${esc(yes?T.c.noted($("gCount").value):T.c.missYou)}</p>${OPTS.onRsvp?"":`<p class="small" style="font-family:var(--f-label);font-size:.62rem;letter-spacing:.18em;text-transform:uppercase">${esc(T.c.previewOnly)}</p>`}`;chime();const tr=$("thanks").getBoundingClientRect();fx.heart(tr.left+tr.width/2,tr.top+tr.height/2);};
let counting=false;
function remaining(){let s=Math.max(0,Math.floor((new Date(DATA.dateISO)-Date.now())/1000));const d=Math.floor(s/86400);s%=86400;const h=Math.floor(s/3600);s%=3600;return[d,h,Math.floor(s/60),s%60];}
function setCount(v){$("cD").textContent=v[0];$("cH").textContent=String(v[1]).padStart(2,"0");$("cM").textContent=String(v[2]).padStart(2,"0");$("cS").textContent=String(v[3]).padStart(2,"0");}
function tick(){if(!counting)setCount(remaining());}
function countUp(){if(REDUCE)return;counting=true;const tg=remaining(),t0=performance.now();const st=now=>{const k=Math.min(1,(now-t0)/1600),e=1-Math.pow(1-k,3);setCount(tg.map(v=>Math.round(v*e)));if(k<1)requestAnimationFrame(st);else counting=false;};requestAnimationFrame(st);}

/* ===== Défilement scénarisé ===== */
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
function splitHeadings(){document.querySelectorAll("#wrap h2").forEach(h=>{if(h.dataset.split)return;const txt=h.textContent;h.dataset.split=1;h.setAttribute("aria-label",txt);
  const n=txt.replace(/\s/g,"").length;let k=0;h.innerHTML=txt.split(" ").map(w=>`<span class="word" aria-hidden="true">${[...w].map(c=>`<span class="ltr" style="--i:${k++};--n:${n}">${c}</span>`).join("")}</span>`).join(" ");});}
let orbit=[];const tilt={rx:0,ry:0,until:0};
function buildOrbit(){const o=$("orbit");o.innerHTML="";orbit=[];for(let i=0;i<18;i++){const d=document.createElement("i");d.style.setProperty("--s",(.45+Math.random()*.9).toFixed(2));o.appendChild(d);
  orbit.push({el:d,a:i/18*Math.PI*2+Math.random()*.3,sp:.008+Math.random()*.006,R:132+Math.random()*34,y:(Math.random()-.5)*150,tw:Math.random()*6});}}
$("medal").addEventListener("pointermove",e=>{const r=e.currentTarget.getBoundingClientRect();tilt.ry=((e.clientX-r.left)/r.width-.5)*34;tilt.rx=-((e.clientY-r.top)/r.height-.5)*26;tilt.until=performance.now()+1800;});
function onEnter(s){const h=s.querySelector("h2");if(h){const r=h.getBoundingClientRect();fx.burst(r.left+r.width/2,r.top+r.height/2,16,3);}
  if(s.querySelector(".count"))countUp();if(s.id==="dress")setDc(dcIdx);}
function scrollLoop(now){if(!alive)return;
  if(!REDUCE){
    const vh=innerHeight,tr=$("heroTrack"),h=clamp(scrollY/Math.max(1,tr.offsetHeight-vh));hero.style.setProperty("--h",h.toFixed(3));
    document.querySelectorAll("#wrap > section").forEach(s=>{const r=s.getBoundingClientRect(),p=clamp((vh-r.top)/(vh*.62));s.style.setProperty("--p",p.toFixed(3));
      if(p>.75&&!s.dataset.done&&stage.hidden){s.dataset.done=1;onEnter(s);}});
    const tl=$("timeline"),tb=tl.getBoundingClientRect(),t=clamp((vh*.62-tb.top)/tb.height);tl.parentElement.style.setProperty("--t",t.toFixed(3));
    tl.querySelectorAll("li").forEach(li=>li.classList.toggle("lit",li.offsetTop+18<=t*tl.offsetHeight));
    if(now>tilt.until){tilt.rx=Math.cos(now*.0011)*6;tilt.ry=Math.sin(now*.0008)*13;}
    const m=$("medal");m.style.setProperty("--rx",tilt.rx.toFixed(2)+"deg");m.style.setProperty("--ry",tilt.ry.toFixed(2)+"deg");m.style.setProperty("--rxn",tilt.rx.toFixed(2));m.style.setProperty("--ryn",tilt.ry.toFixed(2));
    m.style.setProperty("--gx",(50+tilt.ry*2.4).toFixed(1)+"%");m.style.setProperty("--gy",(36-tilt.rx*3).toFixed(1)+"%");
    orbit.forEach(d=>{d.a+=d.sp;const x=Math.cos(d.a)*d.R,z=Math.sin(d.a)*d.R,y=d.y+Math.sin(d.a)*30;d.el.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px)`;d.el.style.opacity=(.5+.5*Math.sin(now*.004+d.tw)).toFixed(2);});
  }
  requestAnimationFrame(scrollLoop);
}
buildOrbit();$("timeline").classList.add("tl-js");requestAnimationFrame(scrollLoop);

render();splitHeadings();tick();const tickI=setInterval(tick,1000);CLEAN.push(()=>clearInterval(tickI));
setTemplate(TPL);
function skipIntro(){token++;opening=true;stage.hidden=true;stage.classList.add("gone");document.body.classList.remove("locked");hero.classList.add("opened");
  const n=$("names");n.style.opacity=1;n.querySelectorAll("span").forEach(s=>{s.style.clipPath="none";});}
if(OPTS.skipIntro)skipIntro();
return{
  replay(){buildStage();},
  destroy(){alive=false;token++;CLEAN.forEach(f=>f());clearInterval(dcTimer);couple?.destroy();musicOn=false;clearTimeout(loopTimer);try{actx&&actx.close();}catch(e){}
    if(io)io.disconnect();document.body.classList.remove("locked","gated");}
};

}
