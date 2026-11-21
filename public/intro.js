/* ---------- Alumni Mentor: the opening intro ----------
   Five universities arrive one by one out of the depth, from Top 50 to Top 10 (THE World University Rankings 2027,
   the same table as top300.json). Each new card takes the front; the earlier ones step back into a line behind it.
   Then the line sinks away and the Alumni Mentor logo rises in gold light. About 7.5 s; a tap or "O'tkazib yuborish" skips it.
   Plays on the first open only (and with ?intro=1 for testing). Only transform and opacity move, so it stays smooth on phones. */
(function () {
  const UNIS = [
    { tier: 50, rank: "47", name: "London School of Economics", country: "Buyuk Britaniya", mono: "LSE", c1: "#E4022D", c2: "#8E0019" },
    { tier: 40, rank: "32", name: "Duke University", country: "AQSH", mono: "D", c1: "#1F3F99", c2: "#012169" },
    { tier: 30, rank: "21", name: "Cornell University", country: "AQSH", mono: "C", c1: "#C9302C", c2: "#7E1212" },
    { tier: 20, rank: "19", name: "Columbia University", country: "AQSH", mono: "CU", c1: "#6FA3D8", c2: "#1D4F91" },
    { tier: 10, rank: "3", name: "Stanford University", country: "AQSH", mono: "S", c1: "#B1282B", c2: "#6E0F12" },
  ];
  const STEP = 1050, FIRST = 650;   // ms between cards, and before the first one

  const crest = (u, i) => `<svg class="ami-crest" viewBox="0 0 80 92" aria-hidden="true">
    <defs><linearGradient id="amc${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${u.c1}"/><stop offset="1" stop-color="${u.c2}"/></linearGradient>
      <linearGradient id="amg${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F8E3AE"/><stop offset=".5" stop-color="#D9A748"/><stop offset="1" stop-color="#F3D58F"/></linearGradient></defs>
    <path d="M40 3 75 12v28c0 24-15.5 41-35 48C20.5 81 5 64 5 40V12z" fill="url(#amc${i})" stroke="url(#amg${i})" stroke-width="3"/>
    <path d="M40 10 68 17.5V40c0 19.5-12 33.5-28 40-16-6.5-28-20.5-28-40V17.5z" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1"/>
    <text x="40" y="${u.mono.length > 2 ? 52 : 55}" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="${u.mono.length > 2 ? 19 : u.mono.length > 1 ? 24 : 30}" fill="#fff" letter-spacing="1">${u.mono}</text>
  </svg>`;

  function play(force) {
    const store = window.amStore;
    if (!force && store.get("am_intro_seen", false)) return;
    store.set("am_intro_seen", true);
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = document.createElement("div");
    el.className = "ami"; el.setAttribute("role", "presentation");
    el.innerHTML = `
      <div class="ami-dust"></div><div class="ami-dust ami-dust2"></div>
      <div class="ami-floor"></div>
      <div class="ami-src">THE World University Rankings 2027</div>
      <div class="ami-stage">${UNIS.map((u, i) => `
        <div class="ami-card" data-i="${i}">
          <div class="ami-shine"></div>
          <div class="ami-tier"><small>TOP</small><b>${u.tier}</b></div>
          ${crest(u, i)}
          <h3>${u.name}</h3>
          <p>${T("{n}-o'rin", { n: u.rank })} · ${T(u.country)}</p>
        </div>`).join("")}
      </div>
      <div class="ami-end">
        <div class="ami-halo"></div>
        <img class="ami-logo" src="img/logo-dark.webp" alt="Alumni Mentor" decoding="async">
        <span class="ami-tag">${T("Top universitetlar sari ishonchli yo'l")}</span>
        <i class="ami-bar"><em></em></i>
      </div>
      <button class="ami-skip">${T("O'tkazib yuborish")}</button>`;
    document.body.appendChild(el);
    document.body.classList.add("ami-on");
    const cards = [...el.querySelectorAll(".ami-card")];
    const timers = [];
    const later = (f, ms) => timers.push(setTimeout(f, ms));
    const buzz = (t) => { try { Telegram.WebApp.HapticFeedback.impactOccurred(t); } catch {} };

    // card i when card k is in front: earlier cards stand in a line, higher, further back and a little to the left
    const place = (k) => cards.forEach((c, i) => {
      const d = k - i;
      if (d < 0) { c.style.opacity = 0; c.style.transform = "translate3d(0, 60px, -1500px) rotateX(18deg)"; return; }
      c.classList.toggle("front", d === 0);
      c.style.opacity = d === 0 ? 1 : Math.max(0, .78 - d * .18);
      c.style.transform = `translate3d(${-d * 22}px, ${-d * 64}px, ${-d * 270}px) rotateY(${d ? 10 : 0}deg) rotateX(${d ? 7 : 0}deg)`;
      c.style.filter = d ? `brightness(${.82 - d * .12})` : "none";
    });

    const finish = () => {
      timers.forEach(clearTimeout);
      if (el.classList.contains("out")) return;
      el.classList.add("out");
      document.body.classList.remove("ami-on");
      setTimeout(() => el.remove(), 700);
    };
    el.addEventListener("click", finish);

    if (reduce) { el.classList.add("end"); later(finish, 1800); return; }
    place(-1);
    UNIS.forEach((u, k) => later(() => { place(k); buzz(k === UNIS.length - 1 ? "medium" : "light"); }, FIRST + k * STEP));
    const tEnd = FIRST + UNIS.length * STEP + 250;
    // the line sinks back into the depth, one card after another, then the logo rises
    later(() => cards.forEach((c, i) => setTimeout(() => {
      c.style.opacity = 0; c.style.transform = `translate3d(${(i - 2) * 30}px, ${-120 - i * 10}px, -1800px) rotateX(24deg)`;
    }, (UNIS.length - 1 - i) * 70)), tEnd);
    later(() => { el.classList.add("end"); buzz("soft"); }, tEnd + 350);
    later(finish, tEnd + 3000);
  }
  window.playIntro = play;
})();
