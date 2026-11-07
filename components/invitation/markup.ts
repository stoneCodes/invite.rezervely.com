// Balisage commun aux 3 templates (rempli par engine.js). Textes fixes : lib/i18n/invite.ts.
import type { InviteDict } from "@/lib/i18n/invite";

export const markup = (T: InviteDict) => String.raw`<div class="backdrop fixed-frame" aria-hidden="true"></div>
<div id="stage" class="fixed-frame"></div>
<canvas id="fx" class="fixed-frame" aria-hidden="true"></canvas>
<button class="sound" id="sound" hidden aria-label="${T.c.soundOff}">♪</button>

<div class="app">
  <div class="hero-track" id="heroTrack">
  <header class="hero" id="hero">
    <div class="scene" id="scene"><div class="moon"></div></div>
    <div class="flicker" aria-hidden="true"><i style="left:14%;top:57%"></i><i style="left:36%;top:55%;animation-delay:.4s"></i><i style="left:52%;top:61%;animation-delay:.9s"></i><i style="left:20%;top:76%;animation-delay:.2s"></i><i style="left:58%;top:75%;animation-delay:1.1s"></i><i style="left:66%;top:58%;animation-delay:.6s"></i></div>
    <div class="curtain l"></div><div class="curtain r"></div>
    <div class="hero-text">
      <div class="eyebrow">${T.classic.eyebrow}</div>
      <h1 class="names" id="names"></h1>
      <div class="date-line" id="dateLine"></div>
    </div>
    <div class="hint">${T.classic.scroll}</div>
  </header>
  </div>

  <main class="wrap" id="wrap">
    <section>
      <div class="bouquet bq1"></div>
      <p class="intro" id="intro"></p>
      <div class="medallion" id="medal"><svg class="ring-draw" viewBox="0 0 244 312" aria-hidden="true"><ellipse cx="122" cy="156" rx="118" ry="152"/></svg><div class="tilt"><div class="ring r2"></div><div class="ring"></div><div class="photo"><img id="photo" alt="${T.c.photoAlt}"><div class="glare"></div></div></div><div class="orbit" id="orbit"></div></div>
      <blockquote class="verse" id="verse"><p class="v-orig" id="vOrig" lang="ar" dir="rtl"></p><p class="v-text" id="vText"></p><cite id="vRef"></cite></blockquote>
    </section>
    <section id="dateSec">
      <div class="eyebrow">${T.classic.dateEyebrow}</div>
      <h2>${T.classic.dateTitle}</h2>
      <div class="scratch-row" id="scratchRow"></div>
      <div class="heart-box"><div class="heart"><b id="heartDate"></b><canvas></canvas></div></div>
      <p class="date-full" id="dateFull"></p>
      <p class="gate-hint" id="gateHint"></p>
    </section>
    <section>
      <div class="eyebrow">${T.classic.countEyebrow}</div>
      <h2>${T.classic.countTitle}</h2>
      <div class="count"><div><b id="cD">0</b><span>${T.classic.days}</span></div><div><b id="cH">0</b><span>${T.classic.hours}</span></div><div><b id="cM">0</b><span>${T.classic.min}</span></div><div><b id="cS">0</b><span>${T.classic.sec}</span></div></div>
    </section>
    <section>
      <div class="eyebrow">${T.classic.progEyebrow}</div>
      <h2>${T.classic.progTitle}</h2>
      <div class="tl-wrap"><ol class="timeline" id="timeline"></ol><div class="tl-line"></div><div class="tl-head"></div></div>
      <div class="swipe">${T.classic.swipe}</div>
    </section>
    <section id="dress">
      <div class="eyebrow">${T.classic.dressEyebrow}</div>
      <h2 id="dcTitle"></h2>
      <p class="small" id="dcNote"></p>
      <div class="dc-swatches" id="dcSwatches"></div>
      <div class="dc-figs" id="dcFigs">
        <div class="dcc" id="dcCouple" role="img" aria-label="${T.classic.dressEyebrow}"><canvas></canvas><canvas></canvas></div>
      </div>
      <div class="dc-name" id="dcName"></div>
      <div class="dc-cols">
        <figure><figcaption id="dcMenL"></figcaption><p class="dc-desc" id="dcMen"></p></figure>
        <figure><figcaption id="dcWomenL"></figcaption><p class="dc-desc" id="dcWomen"></p></figure>
      </div>
    </section>
    <section>
      <div class="eyebrow">${T.classic.venueEyebrow}</div>
      <h2>${T.classic.venueTitle}</h2>
      <p class="venue-name" id="venueName"></p>
      <p class="small" id="venueAddr"></p>
      <div class="btns"><a class="btn" id="mapsBtn" target="_blank" rel="noopener">${T.classic.route}</a><a class="btn ghost" id="calBtn" target="_blank" rel="noopener">${T.classic.calendar}</a></div>
    </section>
    <section>
      <div class="eyebrow">${T.classic.storyEyebrow}</div>
      <h2>${T.classic.storyTitle}</h2>
      <div class="story" id="story"></div>
    </section>
    <section>
      <div class="bouquet bq2"></div>
      <div class="eyebrow">RSVP</div>
      <h2>${T.classic.rsvpTitle}</h2>
      <p class="small" id="rsvpBy"></p>
      <form id="rsvp" novalidate>
        <div><label for="gName">${T.classic.yourName}</label><input type="text" id="gName" placeholder="${T.c.namePh}"></div>
        <div class="choice"><label><input type="radio" name="att" id="attYes" checked> ${T.classic.yes}</label><label><input type="radio" name="att" id="attNo"> ${T.classic.no}</label></div>
        <div><label for="gCount">${T.classic.guests}</label><select id="gCount"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
        <div><label for="gMsg">${T.classic.word}</label><textarea id="gMsg" rows="3"></textarea></div>
        <button class="btn" type="submit">${T.classic.send}</button>
      </form>
      <p class="small" id="rsvpErr" hidden>${T.c.sendErr}</p>
      <div class="thanks" id="thanks" hidden></div>
    </section>
  </main>
</div>`;
