// Balisage commun aux 3 templates (rempli par engine.js).
export const MARKUP = String.raw`<div class="backdrop fixed-frame" aria-hidden="true"></div>
<div id="stage" class="fixed-frame"></div>
<canvas id="fx" class="fixed-frame" aria-hidden="true"></canvas>
<button class="sound" id="sound" hidden aria-label="Couper la musique">♪</button>

<div class="app">
  <div class="hero-track" id="heroTrack">
  <header class="hero" id="hero">
    <div class="scene" id="scene"><div class="moon"></div></div>
    <div class="flicker" aria-hidden="true"><i style="left:14%;top:57%"></i><i style="left:36%;top:55%;animation-delay:.4s"></i><i style="left:52%;top:61%;animation-delay:.9s"></i><i style="left:20%;top:76%;animation-delay:.2s"></i><i style="left:58%;top:75%;animation-delay:1.1s"></i><i style="left:66%;top:58%;animation-delay:.6s"></i></div>
    <div class="curtain l"></div><div class="curtain r"></div>
    <div class="hero-text">
      <div class="eyebrow">Nous nous marions</div>
      <h1 class="names" id="names"></h1>
      <div class="date-line" id="dateLine"></div>
    </div>
    <div class="hint">Faites défiler</div>
  </header>
  </div>

  <main class="wrap" id="wrap">
    <section>
      <div class="bouquet bq1"></div>
      <p class="intro" id="intro"></p>
      <div class="medallion" id="medal"><svg class="ring-draw" viewBox="0 0 244 312" aria-hidden="true"><ellipse cx="122" cy="156" rx="118" ry="152"/></svg><div class="tilt"><div class="ring r2"></div><div class="ring"></div><div class="photo"><img id="photo" alt="Photo du couple"><div class="glare"></div></div></div><div class="orbit" id="orbit"></div></div>
      <blockquote class="verse" id="verse"><p class="v-orig" id="vOrig" lang="ar" dir="rtl"></p><p class="v-text" id="vText"></p><cite id="vRef"></cite></blockquote>
    </section>
    <section id="dateSec">
      <div class="eyebrow">La date</div>
      <h2>Grattez pour découvrir</h2>
      <div class="scratch-row" id="scratchRow"></div>
      <div class="heart-box"><div class="heart"><b id="heartDate"></b><canvas></canvas></div></div>
      <p class="date-full" id="dateFull"></p>
      <p class="gate-hint" id="gateHint"></p>
    </section>
    <section>
      <div class="eyebrow">Compte à rebours</div>
      <h2>Plus que…</h2>
      <div class="count"><div><b id="cD">0</b><span>jours</span></div><div><b id="cH">0</b><span>heures</span></div><div><b id="cM">0</b><span>min</span></div><div><b id="cS">0</b><span>sec</span></div></div>
    </section>
    <section>
      <div class="eyebrow">Le déroulé</div>
      <h2>Programme du jour</h2>
      <div class="tl-wrap"><ol class="timeline" id="timeline"></ol><div class="tl-line"></div><div class="tl-head"></div></div>
      <div class="swipe">Glissez →</div>
    </section>
    <section id="dress">
      <div class="eyebrow">Dress code</div>
      <h2 id="dcTitle"></h2>
      <p class="small" id="dcNote"></p>
      <div class="dc-swatches" id="dcSwatches"></div>
      <div class="dc-figs" id="dcFigs">
        <figure>
          <svg viewBox="0 0 140 210" role="img" aria-label="Veste pour les hommes">
            <defs><clipPath id="cJ"><path d="M70 30 L52 33 L26 46 Q18 50 17 60 L10 168 Q10 174 17 174 L28 174 L31 112 L33 196 Q70 204 107 196 L109 112 L112 174 L123 174 Q130 174 130 168 L123 60 Q122 50 114 46 L88 33 Z"/></clipPath>
              <linearGradient id="shJ" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>
            <path d="M70 8 q9 0 9 7 q0 6 -9 9 v6" stroke="#B89B6A" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M70 29 L24 50 M70 29 L116 50" stroke="#B89B6A" stroke-width="4" stroke-linecap="round"/>
            <path class="g-main" d="M70 30 L52 33 L26 46 Q18 50 17 60 L10 168 Q10 174 17 174 L28 174 L31 112 L33 196 Q70 204 107 196 L109 112 L112 174 L123 174 Q130 174 130 168 L123 60 Q122 50 114 46 L88 33 Z"/>
            <g clip-path="url(#cJ)">
              <path d="M10 40 L31 112 L28 180 L0 180 Z" fill="#000" opacity=".13"/><path d="M130 40 L109 112 L112 180 L140 180 Z" fill="#000" opacity=".09"/>
              <rect width="140" height="210" fill="url(#shJ)"/>
            </g>
            <path fill="#F7F3EE" d="M56 33 L70 80 L84 33 L76 31 L70 36 L64 31 Z"/>
            <path class="g-main" d="M67 38 L73 38 L74.5 72 L70 79 L65.5 72 Z"/><path d="M67 38 L73 38 L74.5 72 L70 79 L65.5 72 Z" fill="#000" opacity=".38"/>
            <path class="g-main" d="M56 33 L46 40 L54 64 L47 68 L70 112 L70 82 Z"/><path d="M56 33 L46 40 L54 64 L47 68 L70 112 L70 82 Z" fill="#fff" opacity=".14"/>
            <path class="g-main" d="M84 33 L94 40 L86 64 L93 68 L70 112 L70 82 Z"/><path d="M84 33 L94 40 L86 64 L93 68 L70 112 L70 82 Z" fill="#000" opacity=".1"/>
            <path d="M70 112 L70 199" stroke="#000" stroke-opacity=".28" stroke-width="1"/>
            <circle cx="70" cy="126" r="2.6" fill="#000" opacity=".45"/><circle cx="70" cy="146" r="2.6" fill="#000" opacity=".45"/>
            <path d="M84 156 L104 154" stroke="#000" stroke-opacity=".3" stroke-width="2"/><path d="M38 154 L56 156" stroke="#000" stroke-opacity=".3" stroke-width="2"/>
            <path d="M88 88 L104 86" stroke="#000" stroke-opacity=".3" stroke-width="2"/><path d="M92 87 L96 81 L100 86.5 Z" fill="#F7F3EE"/>
          </svg>
          <figcaption id="dcMenL"></figcaption><p class="dc-desc" id="dcMen"></p>
        </figure>
        <figure>
          <svg viewBox="0 0 140 210" role="img" aria-label="Robe pour les femmes">
            <defs><clipPath id="cD2"><path d="M50 42 L55 42 L70 70 L85 42 L90 42 L94 92 Q112 150 128 200 Q70 212 12 200 Q28 150 46 92 Z"/></clipPath>
              <linearGradient id="shD" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>
            <path d="M70 8 q9 0 9 7 q0 6 -9 9 v6" stroke="#B89B6A" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M70 29 L32 48 M70 29 L108 48" stroke="#B89B6A" stroke-width="4" stroke-linecap="round"/>
            <path d="M50 42 L46 36 M90 42 L94 36" stroke="#B89B6A" stroke-width="1.4"/>
            <path class="g-main" d="M50 42 L55 42 L70 70 L85 42 L90 42 L94 92 Q70 101 46 92 Z"/>
            <path class="g-main" d="M46 97 Q70 106 94 97 Q112 150 128 200 Q70 212 12 200 Q28 150 46 97 Z"/>
            <g clip-path="url(#cD2)">
              <path d="M58 104 Q50 150 36 204" stroke="#000" stroke-opacity=".16" stroke-width="7" fill="none"/>
              <path d="M70 106 Q70 150 68 208" stroke="#fff" stroke-opacity=".14" stroke-width="5" fill="none"/>
              <path d="M82 104 Q90 150 104 204" stroke="#000" stroke-opacity=".16" stroke-width="7" fill="none"/>
              <path d="M64 105 Q60 150 52 206" stroke="#fff" stroke-opacity=".1" stroke-width="3" fill="none"/>
              <rect width="140" height="210" fill="url(#shD)"/>
            </g>
            <path d="M46 92 Q70 101 94 92 L94 98 Q70 107 46 98 Z" fill="#000" opacity=".22"/>
          </svg>
          <figcaption id="dcWomenL"></figcaption><p class="dc-desc" id="dcWomen"></p>
        </figure>
      </div>
      <div class="dc-name" id="dcName"></div>
    </section>
    <section>
      <div class="eyebrow">Le lieu</div>
      <h2>Où nous retrouver</h2>
      <p class="venue-name" id="venueName"></p>
      <p class="small" id="venueAddr"></p>
      <div class="btns"><a class="btn" id="mapsBtn" target="_blank" rel="noopener">Itinéraire</a><a class="btn ghost" id="calBtn" target="_blank" rel="noopener">Ajouter au calendrier</a></div>
    </section>
    <section>
      <div class="eyebrow">Notre histoire</div>
      <h2>Comment tout a commencé</h2>
      <div class="story" id="story"></div>
    </section>
    <section>
      <div class="bouquet bq2"></div>
      <div class="eyebrow">RSVP</div>
      <h2>Serez-vous des nôtres ?</h2>
      <p class="small" id="rsvpBy"></p>
      <form id="rsvp" novalidate>
        <div><label for="gName">Votre nom</label><input type="text" id="gName" placeholder="Ex. Marie Dupont"></div>
        <div class="choice"><label><input type="radio" name="att" id="attYes" checked> Avec joie</label><label><input type="radio" name="att" id="attNo"> Hélas, non</label></div>
        <div><label for="gCount">Nombre de personnes</label><select id="gCount"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
        <div><label for="gMsg">Un mot pour les mariés</label><textarea id="gMsg" rows="3"></textarea></div>
        <button class="btn" type="submit">Envoyer ma réponse</button>
      </form>
      <p class="small" id="rsvpErr" hidden>Votre réponse n'a pas pu être envoyée. Vérifiez votre connexion et réessayez.</p>
      <div class="thanks" id="thanks" hidden></div>
    </section>
  </main>
</div>`;
