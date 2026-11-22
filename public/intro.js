/* ---------- Alumni Mentor: the opening intro, "Urganchdan dunyoga" ----------
   A paper plane takes off from Urganch on a burgundy globe, flies a golden arc past Oxford, MIT and Stanford
   (each pin lights up as it passes), then its gold trail curls into a ring and the Alumni Mentor logo rises inside it.
   About 5 s, drawn in SVG (no video, a few KB), crisp on every screen. A tap or "O'tkazib yuborish" skips it.
   Plays once a day (and with ?intro=1 for testing); "prefers-reduced-motion" shows only the logo. */
(function () {
  // the flight: Urganch, then Oxford, MIT, Stanford, then down and once round the ring where the logo appears
  const PATH = "M148 312 C 96 280, 92 205, 128 182 S 205 120, 252 150 S 318 222, 286 262 C 262 300, 236 360, 200 360 A 95 95 0 0 1 200 170 A 95 95 0 0 1 200 360";
  const PINS = [{ x: 128, y: 182, n: "Oxford", dx: -8, a: "end" }, { x: 252, y: 150, n: "MIT", dx: 10, a: "start" }, { x: 286, y: 262, n: "Stanford", dx: 10, a: "start" }];
  const FLY0 = 700, FLY = 2500;   // ms: when the plane takes off, and how long it flies
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const stars = () => Array.from({ length: 46 }, () => `<circle cx="${(Math.random() * 400).toFixed(1)}" cy="${(Math.random() * 600).toFixed(1)}" r="${(Math.random() * 1.3 + .3).toFixed(2)}"
    style="animation-delay:${(Math.random() * 2.5).toFixed(2)}s;animation-duration:${(Math.random() * 2 + 1.6).toFixed(2)}s"/>`).join("");
  // dotted "land" on the globe: random dots inside a few blobs, clipped to the globe
  const land = () => { let s = ""; [[150, 205, 38, 26], [235, 200, 46, 30], [215, 285, 30, 40], [140, 285, 22, 18], [275, 300, 26, 20]].forEach(([cx, cy, rx, ry]) => {
    for (let i = 0; i < 46; i++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()); s += `<circle cx="${(cx + Math.cos(a) * rx * r).toFixed(1)}" cy="${(cy + Math.sin(a) * ry * r).toFixed(1)}" r="1.5"/>`; } }); return s; };

  function play(force) {
    const store = window.amStore, today = new Date().toDateString();
    if (!force && store.get("am_intro_day", "") === today) return;
    store.set("am_intro_day", today);
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = document.createElement("div");
    el.className = "ami"; el.setAttribute("role", "presentation");
    el.innerHTML = `
      <svg class="ami-svg" viewBox="20 70 360 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <radialGradient id="amiG" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#A3203A"/><stop offset=".6" stop-color="#5E0A1A"/><stop offset="1" stop-color="#2A040C"/></radialGradient>
          <linearGradient id="amiGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1C7"/><stop offset=".45" stop-color="#E0B25A"/><stop offset="1" stop-color="#F6D58E"/></linearGradient>
          <filter id="amiGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="amiHalo"><stop offset="0" stop-color="#FFD68C" stop-opacity=".55"/><stop offset="1" stop-color="#FFD68C" stop-opacity="0"/></radialGradient>
          <clipPath id="amiClip"><circle cx="200" cy="250" r="118"/></clipPath>
        </defs>
        <g class="ami-stars">${stars()}</g>
        <g class="ami-globe">
          <circle cx="200" cy="250" r="140" class="ami-atmo"/>
          <circle cx="200" cy="250" r="118" fill="url(#amiG)"/>
          <g clip-path="url(#amiClip)">
            <g class="ami-land">${land()}</g>
            <g class="ami-grid"><ellipse cx="200" cy="250" rx="118" ry="40"/><ellipse cx="200" cy="250" rx="118" ry="84"/><line x1="82" y1="250" x2="318" y2="250"/>
              <ellipse class="ami-mer m1" cx="200" cy="250" rx="40" ry="118"/><ellipse class="ami-mer m2" cx="200" cy="250" rx="84" ry="118"/><line x1="200" y1="132" x2="200" y2="368"/></g>
          </g>
          <circle cx="200" cy="250" r="118" class="ami-rim"/>
          <g class="ami-home"><circle cx="148" cy="312" r="13" class="ami-ping"/><circle cx="148" cy="312" r="4.5" class="ami-dot"/>
            <text x="148" y="336" text-anchor="middle">Urganch</text></g>
          ${PINS.map((p, i) => `<g class="ami-pin" data-i="${i}"><circle cx="${p.x}" cy="${p.y}" r="11" class="ami-ping"/><circle cx="${p.x}" cy="${p.y}" r="4.5" class="ami-dot"/>
            <text x="${p.x + p.dx}" y="${p.y - 12}" text-anchor="${p.a}">${p.n}</text></g>`).join("")}
        </g>
        <path class="ami-trail" d="${PATH}" filter="url(#amiGlow)"/>
        <g class="ami-plane"><path d="M14 0 L-11 -9 L-6 0 L-11 9 Z" fill="#FFFFFF" stroke="#E0B25A" stroke-width="1.2" stroke-linejoin="round"/><path d="M14 0 L-6 0" stroke="#E0B25A" stroke-width="1"/></g>
        <g class="ami-end"><circle cx="200" cy="265" r="120" fill="url(#amiHalo)" class="ami-halo"/>
          <image href="img/logo-dark.webp" x="122" y="198" width="156" height="133" class="ami-logo"/>
          <text x="200" y="412" text-anchor="middle" class="ami-tag">${T("Urganchdan dunyoning eng yaxshi universitetlariga")}</text></g>
        <g class="ami-burst">${Array.from({ length: 14 }, (_, i) => { const a = i / 14 * 6.283; return `<circle cx="200" cy="265" r="2.4" style="--x:${(Math.cos(a) * 130).toFixed(1)}px;--y:${(Math.sin(a) * 130).toFixed(1)}px"/>`; }).join("")}</g>
      </svg>
      <button class="ami-skip">${T("O'tkazib yuborish")}</button>`;
    document.body.appendChild(el);
    document.body.classList.add("ami-on");
    const buzz = (t) => { try { Telegram.WebApp.HapticFeedback.impactOccurred(t); } catch {} };
    const timers = []; let raf = 0;
    const later = (f, ms) => timers.push(setTimeout(f, ms));
    const finish = () => {
      timers.forEach(clearTimeout); cancelAnimationFrame(raf);
      if (el.classList.contains("out")) return;
      el.classList.add("out"); document.body.classList.remove("ami-on");
      setTimeout(() => el.remove(), 700);
    };
    el.addEventListener("click", finish);
    if (reduce) { el.classList.add("end"); later(finish, 1800); return; }

    // the plane follows the path; the gold trail is drawn behind it; each pin lights up as the plane passes it
    const path = el.querySelector(".ami-trail"), plane = el.querySelector(".ami-plane"), L = path.getTotalLength();
    path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
    const near = (p) => { let best = 0, bd = 1e9; for (let s = 0; s <= L; s += 4) { const q = path.getPointAtLength(s), d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2; if (d < bd) { bd = d; best = s; } } return best / L; };
    const at = PINS.map(near), lit = PINS.map(() => false), ringAt = Math.min(.92, at[2] + .07);   // the globe gives way just after Stanford
    let t0 = 0, ringOn = false;
    const step = (now) => {
      if (!t0) t0 = now;
      const k = Math.min(1, (now - t0) / FLY), e = ease(k), s = e * L;
      const p = path.getPointAtLength(s), q = path.getPointAtLength(Math.min(L, s + 1.5)), ang = Math.atan2(q.y - p.y, q.x - p.x) * 57.2958;
      plane.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(1.4)`);
      path.style.strokeDashoffset = (L - s).toFixed(1);
      at.forEach((f, i) => { if (!lit[i] && e >= f) { lit[i] = true; el.querySelector(`.ami-pin[data-i="${i}"]`).classList.add("on"); buzz("light"); } });
      if (!ringOn && e >= ringAt) { ringOn = true; el.classList.add("ring"); }   // the globe gives way as the trail starts the ring
      if (k < 1) raf = requestAnimationFrame(step);
      else { el.classList.add("end"); buzz("medium"); later(finish, 1600); }
    };
    later(() => { el.classList.add("fly"); raf = requestAnimationFrame(step); }, FLY0);
  }
  window.playIntro = play;
})();
