/* ---------- Alumni Mentor: the opening intro ----------
   Calm and simple: the Alumni Mentor logo appears on ivory, the crests of top universities spread out from it in a
   circle, each crest turns into a small dot, and all the dots come back together into one dot in the middle.
   About 4.5 s, plain HTML and CSS (only transform and opacity move, so it stays smooth on phones).
   A tap or "O'tkazib yuborish" skips it. Plays once a day (and with ?intro=1 for testing). */
(function () {
  // monogram crests in each university's own colours (no official logos)
  const UNIS = [
    ["H", "#A51C30"], ["MIT", "#8A8B8C"], ["S", "#8C1515"], ["Ox", "#002147"],
    ["C", "#1B4F72"], ["Y", "#00356B"], ["P", "#E77500"], ["CU", "#1D4F91"],
  ];
  const RX = 148, RY = 165;   // how far the crests spread (px), a little taller than wide
  const crest = ([m, c]) => `<svg viewBox="0 0 40 46" aria-hidden="true"><path d="M20 1.5 37.5 6v14.5C37.5 33 29.6 41.5 20 44.5 10.4 41.5 2.5 33 2.5 20.5V6z" fill="${c}" stroke="#E2B85F" stroke-width="1.6"/>
    <text x="20" y="${m.length > 2 ? 27 : 28.5}" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="${m.length > 2 ? 10 : m.length > 1 ? 13 : 17}" fill="#FFFFFF">${m}</text></svg>`;

  function play(force) {
    const store = window.amStore, today = new Date().toDateString();
    if (!force && store.get("am_intro_day", "") === today) return;
    store.set("am_intro_day", today);
    const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = document.createElement("div");
    el.className = "ami"; el.setAttribute("role", "presentation");
    el.innerHTML = `
      <div class="ami-c">
        ${UNIS.map((u, i) => { const a = (i / UNIS.length) * 2 * Math.PI - Math.PI / 2;
          return `<span class="ami-u" style="--x:${(Math.cos(a) * RX).toFixed(1)}px;--y:${(Math.sin(a) * RY).toFixed(1)}px;--d:${i * 45}ms;--c:${u[1]}">${crest(u)}<i></i></span>`; }).join("")}
        <div class="ami-brand"><img src="img/logo-emblem-light.webp" alt="" decoding="async"><span><b>ALUMNI</b><small>MENTOR</small></span></div>
        <i class="ami-one"></i>
      </div>
      <button class="ami-skip">${T("O'tkazib yuborish")}</button>`;
    document.body.appendChild(el);
    document.body.classList.add("ami-on");
    const buzz = (t) => { try { Telegram.WebApp.HapticFeedback.impactOccurred(t); } catch {} };
    const timers = [], later = (f, ms) => timers.push(setTimeout(f, ms));
    const finish = () => {
      timers.forEach(clearTimeout);
      if (el.classList.contains("out")) return;
      el.classList.add("out"); document.body.classList.remove("ami-on");
      setTimeout(() => el.remove(), 650);
    };
    el.addEventListener("click", finish);
    if (reduce) { later(finish, 1500); return; }
    later(() => { el.classList.add("spread"); buzz("light"); }, 700);     // the crests spread out of the logo
    later(() => el.classList.add("dots"), 2150);                          // each crest becomes a dot
    later(() => el.classList.add("gather"), 2550);                        // the dots come back to the middle
    later(() => { el.classList.add("one"); buzz("medium"); }, 3250);      // one dot
    later(finish, 3950);
  }
  window.playIntro = play;
})();
