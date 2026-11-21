// "Orzu xati": a motivational letter from the Alumni Mentor team to the student, in the style of a classic admission
// letter (cream paper, burgundy lines, a wax seal, a campus at the bottom). It is clearly our own card, not a document
// of any university: no university crest, seal or signature is used. The name comes from the Telegram account, or from
// "Shaxsiy ma'lumotlar" in Application Studio once filled; the date is the day it is opened. Tapping the paper plane
// sends the letter flying with a burst of confetti, then it can be shared as a PNG.
const Letter = (() => {
  const W = 1080, H = 1400;
  const st = () => Object.assign({ uni: "", year: new Date().getFullYear() + 2 }, store.get("dream", {}));
  const nameOf = () => { const p = (store.get("studio", {}).p) || {}; const n = [p.first, p.last].filter((x) => String(x || "").trim()).join(" ");
    return n || [user.first_name, user.last_name].filter(Boolean).join(" ") || "Talaba"; };
  const today = () => { const d = new Date(); return LANG === "uz" ? `${d.getDate()}-${["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktabr", "noyabr", "dekabr"][d.getMonth()]}, ${d.getFullYear()}` : d.toLocaleDateString(LANG === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long", year: "numeric" }); };
  // a light campus with autumn trees for the bottom of the paper
  const CAMPUS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 300"><defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B8533A"/><stop offset="1" stop-color="#8E3B28"/></linearGradient></defs>
    <rect x="300" y="120" width="480" height="180" fill="url(#w)"/><path d="M280 122h520l-30-26H310z" fill="#5A4A52"/>
    ${[...Array(9)].map((_, i) => `<rect x="${322 + i * 52}" y="${150 + (i % 2) * 0}" width="22" height="32" fill="#F4E9D8" opacity=".9"/><rect x="${322 + i * 52}" y="210" width="22" height="32" fill="#F4E9D8" opacity=".9"/>`).join("")}
    <rect x="455" y="96" width="170" height="204" fill="#F7F0E4"/><path d="M440 98h200l-100-44z" fill="#EDE2D0" stroke="#C9B79A" stroke-width="2"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${466 + i * 34}" y="110" width="12" height="190" fill="#FFFFFF" stroke="#D8CBB5"/>`).join("")}
    <rect x="512" y="10" width="56" height="50" fill="#F7F0E4" stroke="#C9B79A" stroke-width="2"/><path d="M506 12h68l-34-26z" fill="#C79A3A"/><rect x="532" y="26" width="16" height="22" fill="#5A4A52" opacity=".5"/>
    <rect x="525" y="250" width="30" height="50" fill="#5A4A52"/>
    ${[[120, 230, 110, "#C2410C"], [210, 250, 90, "#E08A1E"], [50, 260, 80, "#B91C1C"], [880, 235, 105, "#D97706"], [980, 255, 85, "#B91C1C"], [800, 270, 70, "#EAB308"], [270, 275, 60, "#EA580C"]].map(([x, y, r, c]) =>
      `<rect x="${x - 6}" y="${y}" width="12" height="${300 - y}" fill="#6B3A2A"/><circle cx="${x}" cy="${y - r * .35}" r="${r * .62}" fill="${c}" opacity=".92"/><circle cx="${x - r * .4}" cy="${y - r * .1}" r="${r * .45}" fill="${c}" opacity=".8"/><circle cx="${x + r * .42}" cy="${y - r * .05}" r="${r * .42}" fill="${c}" opacity=".85"/>`).join("")}
    <rect x="0" y="292" width="1080" height="8" fill="#8B5E3C" opacity=".35"/></svg>`;
  const img = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  function wrap(c, text, x, y, maxW, lh) {
    const words = text.split(/\s+/); let line = "", n = 0;
    for (const w of words) { const t = line ? line + " " + w : w; if (c.measureText(t).width > maxW && line) { c.fillText(line, x, y + n * lh); n++; line = w; } else line = t; }
    if (line) { c.fillText(line, x, y + n * lh); n++; } return n;
  }
  async function draw() {
    const s = st(), uni = s.uni || T("orzuingizdagi universitet"), cv = document.createElement("canvas"); cv.width = W; cv.height = H; const c = cv.getContext("2d");
    try { await Promise.all([document.fonts.load("700 60px Cinzel"), document.fonts.load("400 40px 'Great Vibes'"), document.fonts.load("400 34px 'Cormorant Garamond'"), document.fonts.load("700 34px 'Cormorant Garamond'")]); } catch {}
    const [logo, campus] = await Promise.all([img("img/logo-emblem-light.webp"), img("data:image/svg+xml;charset=utf-8," + encodeURIComponent(CAMPUS))]);
    // paper
    const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#FFFDF7"); g.addColorStop(1, "#F5EDDD"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = "#8B0920"; c.lineWidth = 3; c.strokeRect(34, 34, W - 68, H - 68); c.lineWidth = 1.2; c.strokeRect(46, 46, W - 92, H - 92);
    // letterhead
    if (logo) { const w = 190, h = logo.height * w / logo.width; c.drawImage(logo, 92, 96, w, h); }
    c.textAlign = "left"; c.fillStyle = "#111"; c.font = "700 64px Cinzel, Georgia, serif"; c.fillText("ALUMNI", 310, 160);
    c.font = "700 44px Cinzel, Georgia, serif"; c.fillStyle = "#8B0920"; c.fillText("MENTOR", 312, 214);
    c.fillStyle = "#333"; c.font = "italic 400 32px 'Cormorant Garamond', Georgia, serif"; c.fillText(T("Orzu xati"), 314, 258);
    c.textAlign = "right"; c.fillStyle = "#222"; c.font = "400 32px 'Cormorant Garamond', Georgia, serif"; c.fillText(today(), W - 100, 258);
    c.fillStyle = "#8B0920"; c.fillRect(92, 300, W - 184, 5); c.fillRect(92, 311, W - 184, 1.5);
    // the letter
    c.textAlign = "left"; c.fillStyle = "#222"; c.font = "400 46px 'Cormorant Garamond', Georgia, serif"; c.fillText(T("Hurmatli"), 110, 410);
    const hw = c.measureText(T("Hurmatli") + " ").width; c.fillStyle = "#8B0920"; c.font = "700 50px 'Cormorant Garamond', Georgia, serif"; c.fillText(nameOf() + ",", 110 + hw, 410);
    c.fillStyle = "#222"; c.font = "400 40px 'Cormorant Garamond', Georgia, serif";
    let y = 490; y += wrap(c, T("Tabriklaymiz! Bugun siz {u} sari birinchi qadamni qo'ydingiz. Har bir dars, har bir insho va har bir urinish sizni shu eshikka yaqinlashtiradi.", { u: uni }), 110, y, W - 230, 54) * 54 + 26;
    c.font = "700 42px 'Cormorant Garamond', Georgia, serif"; y += wrap(c, T("{y}-yil kuzida sizni {u} auditoriyalarida ko'rishga ishonamiz.", { y: s.year, u: uni }), 110, y, W - 230, 56) * 56 + 26;
    c.font = "italic 400 38px 'Cormorant Garamond', Georgia, serif"; wrap(c, T("Orzuingiz sizni kutmoqda."), 110, y, W - 230, 52);
    // signature and seal
    c.fillStyle = "#1A1A3A"; c.font = "400 64px 'Great Vibes', cursive"; c.fillText("Alumni Mentor", 110, 1000);
    c.fillStyle = "#111"; c.font = "700 32px 'Cormorant Garamond', Georgia, serif"; c.fillText(T("Alumni Mentor jamoasi"), 110, 1046);
    c.fillStyle = "#444"; c.font = "italic 400 28px 'Cormorant Garamond', Georgia, serif"; c.fillText(T("Urganch 1-IMI"), 110, 1082);
    const sx = 860, sy = 980; c.save(); c.translate(sx, sy);
    c.fillStyle = "#A10F27"; c.beginPath(); c.moveTo(-60, 60); c.lineTo(-95, 190); c.lineTo(-55, 165); c.lineTo(-30, 200); c.lineTo(-5, 70); c.fill(); c.beginPath(); c.moveTo(60, 60); c.lineTo(95, 190); c.lineTo(55, 165); c.lineTo(30, 200); c.lineTo(5, 70); c.fill();
    c.shadowColor = "rgba(80,0,10,.45)"; c.shadowBlur = 18; c.shadowOffsetY = 6;
    c.beginPath(); for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, r = 112 + (i % 2 ? 6 : 0); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath();
    const sg = c.createRadialGradient(-30, -30, 10, 0, 0, 120); sg.addColorStop(0, "#D11F3C"); sg.addColorStop(1, "#7A0718"); c.fillStyle = sg; c.fill(); c.shadowColor = "transparent";
    c.strokeStyle = "rgba(255,220,160,.55)"; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 88, 0, Math.PI * 2); c.stroke();
    if (logo) { const w = 96, h = logo.height * w / logo.width; c.globalAlpha = .9; c.drawImage(logo, -w / 2, -h / 2 + 4, w, h); c.globalAlpha = 1; }
    c.fillStyle = "#F6DCA0"; c.font = "700 20px Cinzel, serif"; c.textAlign = "center";
    const ring = (txt, r, start) => { [...txt].forEach((ch, i) => { const a = start + i * 0.17; c.save(); c.rotate(a); c.fillText(ch, 0, -r); c.restore(); }); };
    ring("ALUMNI", 96, -0.43);
    [..."MENTOR"].forEach((ch, i) => { c.save(); c.rotate(0.43 - i * 0.17); c.fillText(ch, 0, 96 + 14); c.restore(); });   // upright along the bottom
    c.restore();
    // campus and a small note that this is a motivational card
    if (campus) c.drawImage(campus, 50, H - 340, W - 100, (W - 100) * 300 / 1080);
    c.fillStyle = "rgba(0,0,0,.45)"; c.font = "400 22px Inter, sans-serif"; c.textAlign = "center"; c.fillText(T("Motivatsion karta · rasmiy hujjat emas · @{b}", { b: BOT }), W / 2, H - 58);
    return cv;
  }

  function Screen() {
    const s = st();
    setTimeout(paint, 0);
    if (!Letter._unis) fetch("top300.json").then((r) => r.json()).then((d) => { Letter._unis = d.rows.map((r) => r[1]); const dl = document.getElementById("lt-unis"); if (dl) dl.innerHTML = Letter._unis.map((n) => `<option value="${esc(n)}">`).join(""); }).catch(() => {});
    return `${navbar(T("Orzu xati"))}
    <div class="lt-wrap"><div class="lt-paper" id="lt-paper"><div class="busy-in"><div class="run-spin"></div></div></div>
      <button class="lt-plane" id="lt-plane" onclick="ltFly()" aria-label="${T("Yuborish")}">${ic("send")}</button></div>
    <div class="card lt-form">
      <label>${T("Orzuingizdagi universitet")}<input id="lt-uni" list="lt-unis" maxlength="80" value="${esc(s.uni)}" placeholder="Stanford University" onchange="ltSet()"><datalist id="lt-unis">${(Letter._unis || []).map((n) => `<option value="${esc(n)}">`).join("")}</datalist></label>
      <label>${T("Qaysi yili o'qishni boshlaysiz?")}<select id="lt-year" onchange="ltSet()">${[0, 1, 2, 3, 4, 5].map((k) => { const y = new Date().getFullYear() + k; return `<option ${y === +s.year ? "selected" : ""}>${y}</option>`; }).join("")}</select></label>
      <p class="mt-hint">${T("Ismingiz Application Studio'dagi \"Shaxsiy ma'lumotlar\"dan olinadi, to'ldirilmagan bo'lsa Telegram ismingizdan.")}</p></div>
    <div class="lt-share" id="lt-share" hidden><button class="btn-primary" onclick="ltShare()">${ic("share")} ${T("PNG sifatida ulashish")}</button><button class="btn-ghost" onclick="ltSave()">${ic("download")} ${T("Rasmni saqlash")}</button></div>`;
  }
  let lastCanvas = null;
  async function paint() { const box = document.getElementById("lt-paper"); if (!box) return; lastCanvas = await draw(); box.innerHTML = ""; const im = new Image(); im.src = lastCanvas.toDataURL("image/png"); im.alt = ""; box.appendChild(im); }
  window.ltSet = () => { store.set("dream", { uni: document.getElementById("lt-uni").value.trim(), year: +document.getElementById("lt-year").value }); paint(); };
  // the plane takes off across the letter, confetti bursts, and the share buttons appear
  window.ltFly = () => {
    const btn = document.getElementById("lt-plane"), paper = document.getElementById("lt-paper"); if (!btn || btn.classList.contains("fly")) return;
    try { tg.HapticFeedback.notificationOccurred("success"); } catch {}
    btn.classList.add("fly"); paper.classList.add("glow");
    const box = document.createElement("div"); box.className = "lt-confetti";
    const cols = ["#8B0920", "#E3B866", "#165936", "#F6DCA0", "#B51F3A", "#FFFFFF", "#1565C0"];
    box.innerHTML = [...Array(90)].map((_, i) => `<i style="--x:${(Math.random() * 2 - 1) * 48}vw;--y:${-30 - Math.random() * 60}vh;--r:${Math.random() * 720 - 360}deg;--d:${.9 + Math.random() * 1.1}s;--c:${cols[i % cols.length]};left:${40 + Math.random() * 20}%;${i % 3 ? "" : "border-radius:50%;"}"></i>`).join("");
    document.body.appendChild(box);
    const msg = document.createElement("div"); msg.className = "lt-congrats"; msg.innerHTML = `<b>${T("Tabriklaymiz!")}</b><span>${T("Orzuingiz sari yo'l boshlandi")}</span>`; document.body.appendChild(msg);
    setTimeout(() => { box.remove(); msg.classList.add("out"); setTimeout(() => msg.remove(), 500); btn.classList.remove("fly"); paper.classList.remove("glow"); const sh = document.getElementById("lt-share"); if (sh) sh.hidden = false; }, 2600);
  };
  const blob = () => new Promise((ok) => lastCanvas.toBlob(ok, "image/png"));
  window.ltShare = async () => {
    if (!lastCanvas) return; haptic("medium");
    try {
      const r = await (await fetch(SHARE_API + "/file?t=png&as=photo&n=orzu-xati&c=" + encodeURIComponent(T("Mening orzu xatim · Alumni Mentor")), { method: "POST", headers: { "X-Init-Data": tgInit() }, body: await blob() })).json();
      if (r.id && tg && tg.shareMessage) tg.shareMessage(r.id); else toast(T("Rasm bot bilan chatingizga yuborildi"));
    } catch { toast(T("Yuborib bo'lmadi")); }
  };
  window.ltSave = async () => { if (!lastCanvas) return; const a = document.createElement("a"); a.href = URL.createObjectURL(await blob()); a.download = "orzu-xati.png"; a.click(); };
  return { Screen };
})();
window.Letter = Letter;
