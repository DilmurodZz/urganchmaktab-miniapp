// Study tools, loaded when one of them opens:
// 1) DTM ball kalkulyatori with last year's university passing scores (grant and contract),
// 2) IELTS ball kalkulyatori (raw answers to bands, the official rounding of the overall band),
// 3) Top 300 universities of the THE World University Rankings, and the grants, scholarships and certificates guide.
const Study = (() => {
  const n1 = (v) => (Math.round(v * 10) / 10).toLocaleString("ru-RU").replace(",", ".");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ================= DTM ================= */
  // the 2026 test: 3 compulsory subjects (10 questions x 1.1), subject 1 (30 x 3.1), subject 2 (30 x 2.1): 189 in total
  const PARTS = () => [
    { k: "ona", name: T("Ona tili"), q: 10, w: 1.1, grp: "m" },
    { k: "mat", name: T("Matematika"), q: 10, w: 1.1, grp: "m" },
    { k: "tar", name: T("O'zbekiston tarixi"), q: 10, w: 1.1, grp: "m" },
    { k: "s1", name: T("1-mutaxassislik fani"), q: 30, w: 3.1, grp: "s" },
    { k: "s2", name: T("2-mutaxassislik fani"), q: 30, w: 2.1, grp: "s" },
  ];
  let dtm = store.get("dtm_calc", { ona: 7, mat: 7, tar: 7, s1: 20, s2: 18, c: {}, cb: {} });
  const saveDtm = () => store.set("dtm_calc", dtm);
  // certificate rules (Bilim va malakalarni baholash agentligi):
  // compulsory subject + any national certificate = full points; A+ and A = full points in a specialty subject;
  // B+, B, C+, C = points in proportion to the A level (65); foreign language: B2, C1 or IELTS 5.5+ = full points, B1 = 75%
  function partScore(p) {
    const max = p.q * p.w, c = dtm.c[p.k] || "";
    if (c === "max" || c === "lang") return max;
    if (c === "b1") return max * .75;
    if (c === "prop") return max * clamp((+dtm.cb[p.k] || 0) / 65, 0, 1);
    return clamp(+dtm[p.k] || 0, 0, p.q) * p.w;
  }
  const total = () => PARTS().reduce((a, p) => a + partScore(p), 0);

  let otm = null, otmLoading = false, otmFail = false;
  const otmF = { pair: store.get("dtm_pair", ""), reg: "", form: "Kunduzgi", q: "", more: 40 };
  function loadOtm() {
    if (otm || otmLoading) return; otmLoading = true;
    fetch("otm.json").then((r) => r.json()).then((d) => { otm = d; if (location.hash === "#/dtm") refreshOtm(); })
      .catch(() => { otmFail = true; refreshOtm(); }).finally(() => { otmLoading = false; });
  }
  function partRow(p) {
    const c = dtm.c[p.k] || "", locked = !!c, sc = partScore(p);
    const certOpts = p.grp === "m"
      ? [["", T("Sertifikat yo'q")], ["max", T("Milliy sertifikat bor: maksimal ball")]]
      : [["", T("Sertifikat yo'q")], ["max", T("Milliy sertifikat A+ yoki A: maksimal ball")], ["prop", T("Milliy sertifikat B+, B, C+ yoki C")], ["lang", T("Chet tili: B2, C1 yoki IELTS 5.5+")], ["b1", T("Chet tili: B1 (75%)")]];
    return `<div class="sd-part ${locked ? "locked" : ""}">
      <div class="sd-ph"><b>${p.name}</b><span><em>${n1(sc)}</em> / ${n1(p.q * p.w)}</span></div>
      ${locked ? "" : `<div class="sd-rng"><input type="range" min="0" max="${p.q}" value="${clamp(+dtm[p.k] || 0, 0, p.q)}" oninput="dtmSet('${p.k}',this.value)"><small>${T("{a} / {b} ta to'g'ri javob", { a: clamp(+dtm[p.k] || 0, 0, p.q), b: p.q })} · ${n1(p.w)} ${T("ball")}</small></div>`}
      <div class="sd-cert"><select onchange="dtmCert('${p.k}',this.value)">${certOpts.map(([v, t]) => `<option value="${v}" ${v === c ? "selected" : ""}>${t}</option>`).join("")}</select>
      ${c === "prop" ? `<input type="number" inputmode="decimal" min="46" max="69.9" step="0.1" placeholder="${T("Sertifikat bali (46-69,9)")}" value="${esc(dtm.cb[p.k] || "")}" oninput="dtmCb('${p.k}',this.value)">` : ""}</div>
    </div>`;
  }
  function totalCard() {
    const t = total(), pct = t / 189;
    return `<div class="sd-total"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg" style="stroke-dasharray:${(pct * 326.7).toFixed(1)} 326.7"/></svg>
      <div><b>${n1(t)}</b><small>/ 189 ${T("ball")}</small></div></div>`;
  }
  function DTM() {
    loadOtm();
    return `${navbar(T("DTM ball kalkulyatori"))}
    <div class="card sd-hero"><div id="sd-total">${totalCard()}</div>
      <p>${T("Har bir fandan to'g'ri javoblaringiz sonini belgilang. Sertifikatingiz bo'lsa, uni tanlang: ball rasmiy qoidalar bo'yicha hisoblanadi.")}</p></div>
    <div class="section-title">${T("Majburiy fanlar")}<small>3 × 11 = 33</small></div>
    <div class="card sd-parts">${PARTS().filter((p) => p.grp === "m").map(partRow).join("")}</div>
    <div class="section-title">${T("Mutaxassislik fanlari")}<small>93 + 63 = 156</small></div>
    <div class="card sd-parts">${PARTS().filter((p) => p.grp === "s").map(partRow).join("")}</div>
    <details class="card sd-rules smooth"><summary>${ic("file")} ${T("Rasmiy baholash tartibi")}${ic("chev")}</summary>
      <ul>
        <li>${T("Majburiy fanlar: ona tili, matematika va O'zbekiston tarixi, har biridan 10 ta savol, har bir to'g'ri javob 1,1 ball (jami 33 ball).")}</li>
        <li>${T("1-mutaxassislik fani: 30 ta savol, har biri 3,1 ball (93 ball). 2-mutaxassislik fani: 30 ta savol, har biri 2,1 ball (63 ball).")}</li>
        <li>${T("Majburiy fan bo'yicha istalgan darajadagi milliy sertifikat shu fandan maksimal ball beradi.")}</li>
        <li>${T("Mutaxassislik fanidan A+ va A darajali sertifikat maksimal ball beradi; B+, B, C+ va C darajalarida ball A darajaga (65 ball) nisbatan mutanosib hisoblanadi.")}</li>
        <li>${T("Chet tilidan B2, C1 yoki IELTS 5.5 va undan yuqori sertifikat maksimal ball beradi, B1 darajasi maksimal ballning 75 foizini beradi.")}</li>
      </ul>
      <p class="note">${T("Manba: Bilim va malakalarni baholash agentligi (uzbmb.uz). Har yilgi qabul qoidalarini rasmiy saytdan tekshiring.")}</p></details>
    <div class="section-title">${T("Ballingiz qayerga yetadi?")}</div>
    <div id="sd-otm">${otmHTML()}</div>`;
  }
  const refreshTotal = () => { const el = document.getElementById("sd-total"); if (el) el.innerHTML = totalCard(); refreshOtm(); };
  const refreshOtm = () => { const el = document.getElementById("sd-otm"); if (el) el.innerHTML = otmHTML(); };
  function otmHTML() {
    if (!otm) return otmFail ? `<p class="note">${T("Ma'lumotni yuklab bo'lmadi. Internetni tekshirib, qayta oching.")}</p>` : `<div class="busy-in"><div class="run-spin"></div></div>`;
    const t = total(), F = otm.forms, L = otm.langs, S = otm.subjects;
    const pairs = [...new Set(otm.rows.map((r) => r[8] + "|" + r[9]))].map((k) => k.split("|").map(Number)).sort((a, b) => (S[a[0]] + S[a[1]]).localeCompare(S[b[0]] + S[b[1]]));
    const q = (otmF.q || "").toLowerCase().replace(/['‘’ʻʼ]/g, "");
    const fold = (s) => s.toLowerCase().replace(/['‘’ʻʼ`]/g, "");
    let rows = otm.rows.filter((r) => (!otmF.pair || r[8] + "|" + r[9] === otmF.pair) && (!otmF.reg || otm.regions[r[10]] === otmF.reg) && (!otmF.form || F[r[2]] === otmF.form)
      && (!q || fold(otm.dirs[r[1]][1]).includes(q) || fold(otm.otms[r[0]]).includes(q)));
    const status = (r) => r[6] != null && t >= r[6] ? "gr" : r[7] != null && t >= r[7] ? "kt" : "no";
    const nG = rows.filter((r) => status(r) === "gr").length, nK = rows.filter((r) => status(r) === "kt").length;
    // what you can reach first, then the closest ones above your score
    const rank = { gr: 0, kt: 1, no: 2 };
    rows = rows.slice().sort((a, b) => rank[status(a)] - rank[status(b)] || (status(a) === "no" ? (a[7] ?? 999) - (b[7] ?? 999) : (b[6] ?? b[7] ?? 0) - (a[6] ?? a[7] ?? 0)));
    const regs = [...otm.regions].sort((a, b) => a.localeCompare(b));
    return `<div class="sd-filters">
        <select onchange="dtmF('pair',this.value)"><option value="">${T("Barcha fanlar majmuasi")}</option>${pairs.map(([a, b]) => `<option value="${a}|${b}" ${otmF.pair === a + "|" + b ? "selected" : ""}>${esc(S[a])} + ${esc(S[b])}</option>`).join("")}</select>
        <div class="sd-f2"><select onchange="dtmF('reg',this.value)"><option value="">${T("Barcha hududlar")}</option>${regs.map((r) => `<option ${otmF.reg === r ? "selected" : ""}>${esc(r)}</option>`).join("")}</select>
        <select onchange="dtmF('form',this.value)"><option value="">${T("Barcha shakllar")}</option>${F.map((f) => `<option value="${esc(f)}" ${otmF.form === f ? "selected" : ""}>${T(f)}</option>`).join("")}</select></div>
        <label class="km-search">${ic("search")}<input id="sd-q" placeholder="${T("Yo'nalish yoki OTM nomi")}" value="${esc(otmF.q)}" autocomplete="off"></label>
      </div>
      <div class="sd-sum"><span class="gr"><b>${fmtN(nG)}</b>${T("grantga yetadi")}</span><span class="kt"><b>${fmtN(nK)}</b>${T("shartnomaga yetadi")}</span><span><b>${fmtN(rows.length)}</b>${T("jami yo'nalish")}</span></div>
      <div class="sd-list">${rows.slice(0, otmF.more).map((r) => { const s = status(r); return `<div class="sd-row ${s}">
        <div class="notr"><b>${esc(otm.dirs[r[1]][1])}</b><small>${esc(otm.otms[r[0]])}</small><small class="sd-meta">${esc(otm.regions[r[10]])} · ${T(F[r[2]])} · ${esc(L[r[3]])} · ${esc(S[r[8]])}, ${esc(S[r[9]])}</small></div>
        <div class="sd-b"><span>${T("Grant")}: <b>${r[6] != null ? n1(r[6]) : T("yo'q")}</b>${r[4] ? `<i>${r[4]} ${T("o'rin")}</i>` : ""}</span><span>${T("Shartnoma")}: <b>${r[7] != null ? n1(r[7]) : T("yo'q")}</b>${r[5] ? `<i>${r[5]} ${T("o'rin")}</i>` : ""}</span>
        <em>${s === "gr" ? T("Grantga yetadi") : s === "kt" ? T("Shartnomaga yetadi") : r[7] != null ? T("{n} ball yetmaydi", { n: n1(r[7] - t) }) : T("Yetmaydi")}</em></div></div>`; }).join("") || `<p class="note">${T("Hech narsa topilmadi")}</p>`}</div>
      ${rows.length > otmF.more ? `<button class="btn-ghost" onclick="dtmMore()">${T("Yana ko'rsatish ({n})", { n: fmtN(rows.length - otmF.more) })}</button>` : ""}
      <p class="note">${T("{y}-yilgi qabul natijalari bo'yicha o'tish ballari (Bilim va malakalarni baholash agentligi e'lon qilgan). Bu yilgi o'tish ballari arizalar soniga qarab o'zgaradi.", { y: otm.year })}</p>`;
  }
  // while a slider moves only its numbers change, so the drag is not interrupted
  window.dtmSet = (k, v) => {
    dtm[k] = +v; saveDtm(); const p = PARTS().find((x) => x.k === k), box = document.querySelector(`input[oninput="dtmSet('${k}',this.value)"]`)?.closest(".sd-part");
    if (box) { box.querySelector(".sd-ph em").textContent = n1(partScore(p)); box.querySelector(".sd-rng small").textContent = `${T("{a} / {b} ta to'g'ri javob", { a: +v, b: p.q })} · ${n1(p.w)} ${T("ball")}`; }
    const el = document.getElementById("sd-total"); if (el) el.innerHTML = totalCard();
    clearTimeout(window.dtmSet.t); window.dtmSet.t = setTimeout(refreshOtm, 200);
  };
  window.dtmCert = (k, v) => { dtm.c[k] = v; saveDtm(); haptic("light"); render(); };
  window.dtmCb = (k, v) => { dtm.cb[k] = v; saveDtm(); const em = document.activeElement?.closest(".sd-part")?.querySelector(".sd-ph em"); const part = PARTS().find((p) => p.k === k); if (em) em.textContent = n1(partScore(part)); refreshTotal(); };
  window.dtmF = (k, v) => { otmF[k] = v; otmF.more = 40; if (k === "pair") store.set("dtm_pair", v); refreshOtm(); };
  window.dtmMore = () => { otmF.more += 40; refreshOtm(); };

  /* ================= IELTS ================= */
  // raw score -> band (the conversion published by IELTS; exact cut-offs can move slightly between test versions)
  const LIS = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0]];
  const RAC = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1], [0, 0]];
  const band = (tab, raw) => (tab.find(([min]) => raw >= min) || [0, 0])[1];
  // the overall band: the mean of four, x.25 rounds up to x.5 and x.75 rounds up to the next whole band
  const overall = (a) => { const m = a.reduce((x, y) => x + y, 0) / 4, f = m - Math.floor(m); return Math.floor(m) + (f >= .75 ? 1 : f >= .25 ? .5 : 0); };
  let ie = store.get("ielts_calc", { mod: "ac", l: 30, r: 30, w: 6, s: 6.5 });
  const bandsList = [9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0];
  function ieltsResult() {
    const L = band(LIS, ie.l), R = band(RAC, ie.r), O = overall([L, R, +ie.w, +ie.s]);
    const goals = [
      [5.5, T("OTMga kirishda chet tili fanidan maksimal ball (B2 ga teng)")],
      [6, T("El-yurt umidi: bakalavriat uchun eng kam talab")],
      [6.5, T("Ko'pchilik xorijiy universitetlar bakalavriati")],
      [7, T("El-yurt umidi: magistratura va doktorantura uchun eng kam talab")],
      [7.5, T("Top 100 universitetlarning ko'p dasturlari")],
    ];
    return `<div class="sd-ie">
      <div class="sd-ov"><small>${T("Umumiy ball (Overall)")}</small><b>${O.toFixed(1)}</b></div>
      <div class="sd-bands">${[["Listening", L], ["Reading", R], ["Writing", +ie.w], ["Speaking", +ie.s]].map(([k, v]) => `<span><small>${k}</small><b>${(+v).toFixed(1)}</b></span>`).join("")}</div>
      <div class="sd-goals">${goals.map(([g, t]) => `<div class="${O >= g ? "ok" : ""}">${ic(O >= g ? "check" : "x")}<span><b>${g.toFixed(1)}</b> ${t}</span></div>`).join("")}</div></div>`;
  }
  function IELTS() {
    const sel = (k) => `<select onchange="ieSet('${k}',this.value)">${bandsList.map((b) => `<option value="${b}" ${+ie[k] === b ? "selected" : ""}>${b.toFixed(1)}</option>`).join("")}</select>`;
    const raw = (k, label) => `<div class="sd-part"><div class="sd-ph"><b>${label}</b><span><em id="ie-${k}">${ie[k]}</em> / 40</span></div>
      <div class="sd-rng"><input type="range" min="0" max="40" value="${ie[k]}" oninput="ieSet('${k}',this.value)"><small>${T("To'g'ri javoblar soni")}</small></div></div>`;
    return `${navbar(T("IELTS ball kalkulyatori"))}
    <div class="card" id="ie-res">${ieltsResult()}</div>
    <div class="card sd-parts">${raw("l", "Listening")}${raw("r", "Reading (Academic)")}
      <div class="sd-part"><div class="sd-ph"><b>Writing</b>${sel("w")}</div><small class="sd-hint">${T("Writing va Speaking imtihonchi tomonidan 0 dan 9 gacha band bilan baholanadi.")}</small></div>
      <div class="sd-part"><div class="sd-ph"><b>Speaking</b>${sel("s")}</div></div></div>
    <details class="card sd-rules smooth"><summary>${ic("file")} ${T("Ball qanday hisoblanadi")}${ic("chev")}</summary><ul>
      <li>${T("Listening va Reading 40 tadan savoldan iborat; to'g'ri javoblar soni rasmiy jadval bo'yicha bandga aylantiriladi.")}</li>
      <li>${T("Umumiy ball to'rtta ko'nikmaning o'rtachasi: .25 bo'lsa .5 ga, .75 bo'lsa keyingi butun bandga yaxlitlanadi.")}</li>
      <li>${T("IELTS natijasi 2 yil amal qiladi. Imtihonni British Council va IDP o'tkazadi.")}</li></ul>
      <p class="note">${T("Jadval taxminiy: aniq chegaralar har bir test variantida biroz farq qilishi mumkin.")}</p></details>`;
  }
  window.ieSet = (k, v) => {
    ie[k] = k === "mod" ? v : +v; store.set("ielts_calc", ie);
    if (k === "mod") { haptic("light"); return render(); }
    const em = document.getElementById("ie-" + k); if (em) em.textContent = v;
    const res = document.getElementById("ie-res"); if (res) res.innerHTML = ieltsResult();
  };

  /* ================= Top 300 universities + grants ================= */
  const COUNTRY = COUNTRY_UZ;
  const cn = (c) => T(COUNTRY[c] || c);
  const CRIT = () => [["overall", T("Umumiy reyting"), 3], ["teaching", T("O'qitish sifati"), 4], ["research", T("Tadqiqot muhiti"), 5], ["citations", T("Tadqiqot sifati"), 6], ["industry", T("Sanoat bilan aloqa"), 7], ["international", T("Xalqaro muhit"), 8]];
  let uni = null, uniFail = false, uniLoading = false;
  const uf = { tab: store.get("uni_tab", "top"), q: "", country: "", sort: "overall", more: 50 };
  function loadUni() {
    if (uni || uniLoading) return; uniLoading = true;
    fetch("top300.json").then((r) => r.json()).then((d) => { uni = d; if (location.hash === "#/unis") refreshUni(); })
      .catch(() => { uniFail = true; refreshUni(); }).finally(() => { uniLoading = false; });
  }
  const refreshUni = () => { const el = document.getElementById("sd-uni"); if (el) el.innerHTML = uniList(); };
  function uniList() {
    if (!uni) return uniFail ? `<p class="note">${T("Ma'lumotni yuklab bo'lmadi. Internetni tekshirib, qayta oching.")}</p>` : `<div class="busy-in"><div class="run-spin"></div></div>`;
    const crit = CRIT().find((c) => c[0] === uf.sort) || CRIT()[0], q = uf.q.toLowerCase();
    let rows = uni.rows.map((r, i) => [r, i]).filter(([r]) => (!uf.country || r[2] === uf.country) && (!q || r[1].toLowerCase().includes(q) || cn(r[2]).toLowerCase().includes(q)));
    if (uf.sort !== "overall") rows.sort((a, b) => (b[0][crit[2]] || 0) - (a[0][crit[2]] || 0));
    return `<p class="zk-found">${T("{n} ta universitet", { n: rows.length })}${uf.sort !== "overall" ? " · " + crit[1] : ""}</p>
      <div class="sd-ulist">${rows.slice(0, uf.more).map(([r, i], n) => `<button class="sd-uni t${n % 6}" onclick="uniOpen(${i})"><span class="sd-rank">${esc(r[0])}</span>
        <span class="notr"><b>${esc(r[1])}</b><small>${esc(cn(r[2]))}</small></span><span class="sd-sc"><b>${r[crit[2]] != null ? r[crit[2]].toFixed(1) : T("yo'q")}</b><small>${crit[1]}</small></span></button>`).join("") || `<p class="note">${T("Hech narsa topilmadi")}</p>`}</div>
      ${rows.length > uf.more ? `<button class="btn-ghost" onclick="uniMore()">${T("Yana ko'rsatish ({n})", { n: rows.length - uf.more })}</button>` : ""}`;
  }
  function Unis() {
    loadUni();
    const countries = Object.keys(COUNTRY).sort((a, b) => cn(a).localeCompare(cn(b)));
    return `${navbar(T("Top 300 universitet va grantlar"))}
    <div class="seg sd-tabs">${[["top", T("Top 300 universitet")], ["grant", T("Grant va sertifikatlar")]].map(([k, t]) => `<button class="${uf.tab === k ? "on" : ""}" onclick="uniTab('${k}')">${t}</button>`).join("")}</div>
    ${uf.tab === "top" ? `<div class="card sd-uhead"><img class="sd-the" src="img/the-logo.webp" alt="THE" width="52" height="52"><span><b>World University Rankings 2027</b><small>${T("Times Higher Education reytingi: dunyodagi eng yaxshi 300 ta universitet")}</small></span></div>
    <div class="sd-filters">
      <label class="km-search">${ic("search")}<input id="sd-uq" placeholder="${T("Universitet yoki davlat nomi")}" value="${esc(uf.q)}" autocomplete="off"></label>
      <div class="sd-f2"><select onchange="uniF('country',this.value)"><option value="">${T("Barcha davlatlar")}</option>${countries.map((c) => `<option value="${esc(c)}" ${uf.country === c ? "selected" : ""}>${esc(cn(c))}</option>`).join("")}</select>
      <select onchange="uniF('sort',this.value)">${CRIT().map(([k, t]) => `<option value="${k}" ${uf.sort === k ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    </div>
    <div id="sd-uni">${uniList()}</div>
    <p class="note">${T("Manba: Times Higher Education, World University Rankings 2027. Ballar 100 ballik shkalada.")}</p>` : grantsHTML()}`;
  }
  window.uniName = (i) => uni.rows[i][1]; window.uniCountry = (i) => uni.rows[i][2]; window.uniSite = (i) => uni.rows[i][14] || "";
  window.uniTab = (k) => { uf.tab = k; store.set("uni_tab", k); haptic("light"); render(); };
  window.uniF = (k, v) => { uf[k] = v; uf.more = 50; refreshUni(); };
  window.uniMore = () => { uf.more += 50; refreshUni(); };
  window.uniOpen = (i) => {
    const r = uni && uni.rows[i]; if (!r) return; haptic("light");
    const COL = ["#2563EB", "#7C3AED", "#0EA5E9", "#16A34A", "#F59E0B", "#E11D48"];
    const bar = ([k, t, idx], n) => `<div class="sd-bar" style="--bc:${COL[n]}"><span>${t}</span><i><s style="width:${r[idx] || 0}%"></s></i><b>${r[idx] != null ? r[idx].toFixed(1) : T("yo'q")}</b></div>`;
    const stat = (v, t) => v ? `<span><b>${esc(v)}</b><small>${t}</small></span>` : "";
    sheet(`<div class="sd-usheet"><span class="sd-rank big">${esc(r[0])}</span><h3 class="notr">${esc(r[1])}</h3><p>${esc(cn(r[2]))} · THE 2027</p>
      <div class="sd-bars">${CRIT().map(bar).join("")}</div>
      <div class="sd-stats">${r[15] != null ? `<span class="acc"><b>${r[15]}%</b><small>${T("qabul darajasi")}${r[16] ? ` (${r[16]})` : ""}</small></span>` : `<span class="acc"><b>${T("yo'q")}</b><small>${T("qabul darajasi")}</small></span>`}${stat(r[9], T("talaba"))}${stat(r[10], T("1 o'qituvchiga talaba"))}${stat(r[11], T("xorijiy talabalar"))}${stat(r[12], T("ayollar : erkaklar"))}</div>
      ${r[14] ? `<button class="btn-primary sd-site" onclick="openExt('${encodeURIComponent(r[14])}')">${ic("globe")} ${T("Rasmiy sayt")}: ${esc(r[14].replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</button>` : ""}
      <button class="btn-primary sd-addapp" onclick="appsAdd({ name: uniName(${i}), country: uniCountry(${i}), site: uniSite(${i}) }) && closeSheet()">${ic("plus")} ${T("Arizalarimga qo'shish")}</button>
      <button class="btn-ghost sd-share wide" onclick="shareSec('u_${i}', '${esc(r[1]).replace(/'/g, "")}')">${ic("send")} ${T("Do'stga ulashish")}</button>
      <button class="btn-ghost sd-thebtn" onclick="openExt('${encodeURIComponent("https://www.timeshighereducation.com" + r[13])}')">${ic("chart")} ${T("THE saytida ko'rish")}</button>
      <p class="note">${T("Qabul darajasi: arizachilarning necha foizi qabul qilingani (Wikidata ma'lumoti, oxirgi mavjud yil).")}</p></div>`);
  };
  document.addEventListener("input", (e) => {
    const id = e.target && e.target.id;
    if (id === "sd-uq") { uf.q = e.target.value; uf.more = 50; clearTimeout(refreshUni.t); refreshUni.t = setTimeout(refreshUni, 150); }
    if (id === "sd-q") { otmF.q = e.target.value; otmF.more = 40; clearTimeout(refreshOtm.t); refreshOtm.t = setTimeout(() => { refreshOtm(); const el = document.getElementById("sd-q"); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 250); }
  });

  // grants, scholarships and certificates: short, checked facts with the official site of each
  const G = () => [
    { h: T("Yoshlar uchun dasturlar va imtiyozlar"), items: [
      { k: "2plus6", i: "chat", t: T("\"2+6\" dasturi: chet tili kurslariga subsidiya"), d: [
        T("Davlat yoshlarga o'quv markazlarida chet tilini o'rganish xarajatlarini qoplab beradi: dastlabki 2 oyni o'zingiz to'laysiz, keyingi 6 oygacha bo'lgan o'qish Yoshlar ishlari agentligi jamg'armasi hisobidan to'lanadi."),
        T("Kim qatnasha oladi: 14 yoshdan 30 yoshgacha bo'lgan O'zbekiston yoshlari, B1 darajasidagi sertifikat yoki unga teng hujjat bilan; darslarga kamida 70 foiz qatnashish kerak. Subsidiya Toshkent shahrida bazaviy hisoblash miqdorining 2 baravarigacha, viloyat markazlarida 1,5 baravarigacha, tumanlarda 1 baravarigacha."),
        T("Ariza \"Yonda\" ilovasi orqali OneID bilan topshiriladi, o'quv markazlari ro'yxati 2plus6.uz saytida. Asos: Vazirlar Mahkamasining 2025-yil 8-oktabrdagi 632-son qarori.")],
        l: [["2plus6.uz", "2plus6.uz"], ["lex.uz", "lex.uz/uz/docs/-7759309"]] },
      { k: "atto", i: "card", t: T("ATTO talaba transport kartasi"), d: [
        T("Talabalar ATTO imtiyozli transport kartasi bilan jamoat transportida yo'l haqining yarmini to'laydi. Talabalar uchun yashil va sariq kartalar chiqarilgan."),
        T("Kartani rasmiylashtirish tartibi va manzillar atto.uz saytining \"Yo'lovchilar\" bo'limida.")],
        l: [["atto.uz", "atto.uz/uz/passengers"]] },
      { k: "yoshlar", i: "users", t: T("Yoshlar daftari"), d: [
        T("Ijtimoiy himoyaga muhtoj 14 yoshdan 30 yoshgacha bo'lgan yoshlarga davlat yordami: o'qish, kasb o'rganish, ish va boshqa ehtiyojlar uchun."),
        T("2026-yil 1-fevraldan arizalar my.gov.uz va yoshlarning yagona elektron platformasi orqali topshiriladi; 1093 raqami orqali ham murojaat qilish mumkin. Har yili eng faol 1 000 nafar yoshga bazaviy hisoblash miqdorining 3 baravari miqdorida mukofot beriladi.")],
        l: [["yoshlardaftari.uz", "yoshlardaftari.uz"], ["my.gov.uz", "my.gov.uz"]] },
    ] },
    { h: T("Mahalliy grant va stipendiyalar"), items: [
      { k: "otmgrant", i: "cap", t: T("OTM davlat granti (bakalavriat)"), d: [
        T("Davlat oliy ta'lim muassasalarida to'lovsiz o'qish va har oylik stipendiya. Grant o'rinlari har bir yo'nalish bo'yicha DTM test natijalarida eng yuqori ball to'plagan abituriyentlarga beriladi, qolganlar to'lov-shartnoma asosida qabul qilinishi mumkin."),
        T("Test 5 fandan iborat: 3 ta majburiy fan (ona tili, matematika, O'zbekiston tarixi) va 2 ta mutaxassislik fani, jami 90 ta savol, maksimal 189 ball. Hujjatlar har yili yozda onlayn topshiriladi."),
        T("Milliy sertifikat va chet tili sertifikatlari tegishli fandan maksimal yoki mutanosib ball beradi. O'z ballingizni ilovadagi DTM ball kalkulyatori bilan hisoblab, o'tgan yilgi o'tish ballari bilan solishtiring.")],
        l: [[T("Hujjat topshirish"), "my.uzbmb.uz"], ["uzbmb.uz", "uzbmb.uz"]] },
      { k: "prezident", i: "trophy", t: T("Prezident davlat stipendiyasi"), d: [
        T("Eng iqtidorli talabalar uchun eng yuqori davlat stipendiyasi: oyiga 2 579 444 so'm (2026-yil 1-sentyabrdan). 2026/2027 o'quv yili uchun 187 ta o'rin ajratilgan."),
        T("Talablar: barcha fanlardan faqat a'lo baholar, bakalavr talabalari uchun kamida 2 ta e'lon qilingan ilmiy ish. Arizalar har yili avgust oyida my.edu.uz platformasi orqali qabul qilinadi."),
        T("Tayyorgarlik: ilmiy maqolalar chop eting, fan olimpiadalari va tanlovlarda qatnashing, ilmiy rahbaringiz bilan loyiha ustida ishlang.")],
        l: [["my.edu.uz", "my.edu.uz"]] },
      { k: "nomdor", i: "star", t: T("Nomdor davlat stipendiyalari"), d: [
        T("Islom Karimov, Alisher Navoiy va boshqa buyuk allomalar nomidagi stipendiyalar a'lochi va faol talabalarga beriladi. 2026/2027 o'quv yili uchun Islom Karimov nomidagi stipendiyaga 194 ta, Navoiy nomidagisiga 175 ta o'rin ajratilgan."),
        T("Talablar: \"3\" baho bo'lmasligi, \"4\" baholar ulushi 25 foizdan oshmasligi. Ilmiy ishlar, olimpiada natijalari va jamoat faolligi ustunlik beradi. Arizalar my.edu.uz orqali avgust oyida qabul qilinadi.")],
        l: [["my.edu.uz", "my.edu.uz"]] },
      { k: "elyurt", i: "plane", t: T("El-yurt umidi jamg'armasi"), d: [
        T("Dunyoning yetakchi universitetlarida bakalavriat, magistratura va doktorantura uchun to'liq moliyalashtiriladigan davlat stipendiyasi: o'qish to'lovi, yashash va yo'l xarajatlari qoplanadi."),
        T("Talablar: IELTS kamida 6.0 (bakalavriat) yoki 7.0 (magistratura va doktorantura) yoki unga teng sertifikat, xorijiy universitetning qabul xati (Letter of Acceptance), diplom yoki attestat. Bitiruvchilar O'zbekistonga qaytib, belgilangan muddat ishlab berishlari kerak."),
        T("Ochiq tanlovlar yiliga ikki marta e'lon qilinadi (2026-yilda aprel va noyabr). 2026-yil uchun 500 ta kvota ajratilgan. Arizalar el-yurt.uz platformasi orqali onlayn topshiriladi.")],
        l: [["el-yurt.uz", "el-yurt.uz"]] },
    ] },
    { h: T("Milliy sertifikatlar"), items: [
      { k: "milliy", i: "file", t: T("Milliy sertifikat (fanlar)"), d: [
        T("Bilim va malakalarni baholash agentligi o'tkazadigan imtihon natijasida beriladi. Matematika, ona tili va adabiyoti, tarix, biologiya, kimyo, fizika va boshqa fanlardan topshirish mumkin. Ro'yxatdan o'tish my.gov.uz orqali."),
        T("Darajalar: A+ (70 va undan yuqori), A (65-69,9), B+ (60-64,9), B (55-59,9), C+ (50-54,9), C (46-49,9). OTMga kirishda A+ va A mutaxassislik fanidan maksimal ball beradi, boshqa darajalar mutanosib ball beradi; majburiy fanda istalgan daraja maksimal ball beradi."),
        T("O'qituvchilar uchun sertifikat maoshga ustama olish imkonini ham beradi.")],
        l: [["uzbmb.uz", "uzbmb.uz"], ["my.gov.uz", "my.gov.uz"]] },
      { k: "cefr", i: "chat", t: T("Chet tili milliy sertifikati (CEFR)"), d: [
        T("Ingliz, nemis, fransuz va boshqa tillardan bitta imtihon (Multilevel) topshiriladi: tinglash, o'qish, yozish va gapirish. Natijaga ko'ra B1, B2 yoki C1 darajasi beriladi."),
        T("OTMga kirishda B2 va C1 chet tili fanidan maksimal ball, B1 maksimal ballning 75 foizini beradi. Chet tili birinchi fan bo'lgan yo'nalishlarda sertifikat talab qilinadi, filologiya yo'nalishlari uchun C1 darajasi kerak.")],
        l: [["uzbmb.uz", "uzbmb.uz"]] },
    ] },
    { h: T("Xalqaro imtihonlar"), items: [
      { k: "ielts", i: "globe", t: "IELTS", d: [
        T("Ingliz tilini 4 ko'nikma bo'yicha baholaydi. Listening: 30 daqiqa, 40 savol. Reading: 60 daqiqa, 3 matn, 40 savol. Writing: 60 daqiqa, 2 vazifa. Speaking: 11-14 daqiqa, imtihonchi bilan suhbat."),
        T("Natija 0 dan 9 gacha band, 2 yil amal qiladi. Academic turi o'qish uchun, General Training ish va migratsiya uchun. Kompyuterda topshirilsa natija 3-5 kunda chiqadi. O'zbekistonda British Council va IDP o'tkazadi."),
        T("5.5 va undan yuqori ball OTMga kirishda chet tili fanidan maksimal ball beradi; El-yurt umidi uchun kamida 6.0 yoki 7.0 kerak.")],
        l: [["ielts.org", "ielts.org"]] },
      { k: "toefl", i: "laptop", t: "TOEFL iBT", d: [
        T("ETS tashkiloti o'tkazadigan ingliz tili imtihoni, ayniqsa AQSh universitetlarida keng qabul qilinadi. 4 bo'lim: Reading, Listening, Speaking va Writing, har biri 0 dan 30 gacha, jami 0 dan 120 gacha ball."),
        T("Imtihon taxminan 2 soat davom etadi, test markazida yoki uyda (Home Edition) topshiriladi. Natija taxminan bir haftada chiqadi va 2 yil amal qiladi. Top universitetlar odatda 90-100 va undan yuqori ball talab qiladi.")],
        l: [["ets.org/toefl", "ets.org/toefl"]] },
      { k: "duolingo", i: "laptop", t: "Duolingo English Test", d: [
        T("Uyda kompyuterda onlayn topshiriladigan ingliz tili testi, taxminan 1 soat davom etadi va savollar darajangizga moslashadi. Oxirida qisqa video suhbat va yozma ish bor."),
        T("Natija 10 dan 160 gacha ball, odatda 2 kun ichida chiqadi va 2 yil amal qiladi. Narxi IELTS va TOEFLdan arzonroq; minglab xorijiy universitetlar qabul qiladi.")],
        l: [["englishtest.duolingo.com", "englishtest.duolingo.com"]] },
      { k: "sat", i: "calc", t: "SAT", d: [
        T("AQSh va boshqa davlatlar universitetlarining bakalavriatiga kirish uchun asosiy test. College Board uni raqamli shaklda, Bluebook ilovasi orqali test markazlarida o'tkazadi."),
        T("2 bo'lim: Reading and Writing (64 daqiqa, 54 savol) va Math (70 daqiqa, 44 savol), jami taxminan 2 soat 14 daqiqa. Har bir bo'lim 200 dan 800 gacha, umumiy ball 400 dan 1600 gacha. Test moslashuvchan: birinchi qismdagi natijangizga qarab ikkinchi qism savollari qiyinlashadi yoki osonlashadi. Math bo'limida kalkulyatordan foydalanish mumkin."),
        T("Xalqaro sanalar yiliga bir necha marta (mart, may, iyun, avgust, oktabr, noyabr, dekabr), natija taxminan 2 haftada chiqadi. Top universitetlar uchun odatda 1450-1550 ball kerak; ayrim universitetlar SATni ixtiyoriy deb belgilagan.")],
        l: [["satsuite.collegeboard.org", "satsuite.collegeboard.org"]] },
      { k: "gre", i: "chart", t: "GRE", d: [
        T("Magistratura va doktoranturaga kirish uchun test (ETS), ayniqsa AQSh universitetlarida. Verbal Reasoning va Quantitative Reasoning bo'limlari 130 dan 170 gacha, Analytical Writing 0 dan 6 gacha baholanadi."),
        T("Imtihon taxminan 2 soat davom etadi, test markazida yoki uyda topshiriladi. Natija 5 yil amal qiladi; ScoreSelect orqali universitetlarga eng yaxshi natijangizni yuborishingiz mumkin.")],
        l: [["ets.org/gre", "ets.org/gre"]] },
      { k: "gmat", i: "briefcase", t: "GMAT", d: [
        T("MBA va biznes magistraturasiga kirish uchun test (GMAC). GMAT Focus Edition 3 bo'limdan iborat: Quantitative Reasoning, Verbal Reasoning va Data Insights, jami 2 soat 15 daqiqa."),
        T("Natija 205 dan 805 gacha, 5 yil amal qiladi. Test markazida yoki onlayn topshirish mumkin. Top biznes maktablari odatda 645-705 va undan yuqori ballni kutadi.")],
        l: [["mba.com", "mba.com"]] },
    ] },
  ];
  function grantsHTML() {
    return G().map((g) => `<div class="section-title">${g.h}</div>
      <div class="sd-grants">${g.items.map((x) => `<details class="card sd-g smooth" id="g-${x.k}"><summary>${chip(x.i, "sm")}<b>${x.t}</b>${ic("chev")}</summary>
        ${x.d.map((t) => `<p>${t}</p>`).join("")}<div class="sd-links">${x.l.map(([t, u]) => `<button class="btn-ghost" onclick="openExt('${encodeURIComponent("https://" + u)}')">${ic("globe")} ${t}</button>`).join("")}
        <button class="btn-ghost sd-share" onclick="shareSec('g_${x.k}', this.closest('details').querySelector('summary b').textContent)">${ic("send")} ${T("Do'stga ulashish")}</button></div></details>`).join("")}</div>`).join("")
      + `<p class="note">${T("Ma'lumotlar rasmiy manbalar asosida 2026-yil noyabr holatiga tayyorlandi.")}</p>`;
  }

  /* ================= UniMatch: which of the Top 300 fit this student ================= */
  // A transparent estimate, not a promise: the student's profile becomes a strength score (0-100),
  // every university gets a selectivity score from its THE rank and, where known, its acceptance rate.
  // Their difference puts the university in one of three groups: ambitious (reach), fitting (target), safe (safety).
  const ENG = {
    ielts: { t: "IELTS", v: [9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5], eq: (x) => x },
    toefl: { t: "TOEFL iBT", v: [118, 115, 110, 102, 94, 79, 60, 46, 35], eq: (x) => (x >= 118 ? 9 : x >= 115 ? 8.5 : x >= 110 ? 8 : x >= 102 ? 7.5 : x >= 94 ? 7 : x >= 79 ? 6.5 : x >= 60 ? 6 : x >= 46 ? 5.5 : 5) },
    duolingo: { t: "Duolingo", v: [155, 145, 135, 125, 115, 105, 95], eq: (x) => (x >= 155 ? 8.5 : x >= 145 ? 8 : x >= 135 ? 7.5 : x >= 125 ? 7 : x >= 115 ? 6.5 : x >= 105 ? 6 : 5.5) },
    cefr: { t: "CEFR (milliy)", v: ["C1", "B2", "B1"], eq: (x) => ({ C1: 7, B2: 6, B1: 5 })[x] || 0 },
  };
  const ACH = () => [["intl", T("Xalqaro olimpiada medali"), 25], ["nat", T("Respublika olimpiadasi g'olibi"), 14], ["res", T("Ilmiy maqola yoki tadqiqot"), 10],
    ["lead", T("Liderlik va volontyorlik"), 7], ["work", T("Ish tajribasi yoki amaliyot"), 8], ["proj", T("Loyiha, startap yoki portfolio"), 7], ["sport", T("Sport yoki san'atdagi yutuqlar"), 4]];
  const PRI = () => [["teach", T("O'qitish sifati"), 4], ["res", T("Tadqiqot"), 5], ["ind", T("Sanoat va ish"), 7], ["intl", T("Xalqaro muhit"), 8], ["easy", T("Qabul imkoniyati"), 0]];
  const UM_COUNTRIES = ["United States", "United Kingdom", "Canada", "Germany", "Netherlands", "Australia", "South Korea", "Japan", "China", "Singapore", "Switzerland", "Italy", "France", "Sweden", "Hong Kong", "Malaysia"];
  const SAT = () => [[0, T("Topshirmaganman")], [1100, "1000-1190"], [1250, "1200-1290"], [1350, "1300-1390"], [1450, "1400-1490"], [1530, "1500+"]];
  let um = Object.assign({ lvl: "bak", gpa: 4.5, eng: "ielts", engv: 6.5, sat: 0, ach: [], pri: [], cty: [] }, store.get("um", {}));
  const saveUm = () => store.set("um", um);
  const umF = { cat: "all", more: 30 };
  const rankNum = (r) => parseInt(String(r[0]).replace(/\D+/g, " ").trim(), 10) || 300;
  const engEq = (p = um) => (p.eng === "none" ? 0 : (ENG[p.eng] || ENG.ielts).eq(p.engv));
  function strength(p = um) {
    const mag = p.lvl === "mag";
    const E = clamp((engEq(p) - 5) / 3, 0, 1) * 25;
    const G = clamp((+p.gpa - 3.5) / 1.5, 0, 1) * (mag ? 35 : 20);
    const A = mag ? 0 : p.sat ? clamp((p.sat - 1050) / 500, 0, 1) * 25 : 8;
    const C = Math.min(mag ? 40 : 30, ACH().filter(([k]) => p.ach.includes(k)).reduce((s, a) => s + a[2], 0));
    return Math.round(E + G + A + C);
  }
  const selectivity = (r) => {
    const n = rankNum(r), Dr = 100 - Math.pow(Math.log(n) / Math.log(300), 1.6) * 68;
    return r[15] != null ? .55 * Dr + .45 * (100 - clamp(r[15], 2, 90) * .75) : Dr;
  };
  const engNeed = (r) => { const n = rankNum(r); return n <= 50 ? 7 : n <= 150 ? 6.5 : 6; };
  const CATS = ["safe", "fit", "reach", "hard"];
  function judge(r, p = um, S = strength(p)) {
    const diff = S - selectivity(r);
    let c = diff >= 8 ? 0 : diff >= -6 ? 1 : diff >= -22 ? 2 : 3;
    const eng = engEq(p), need = engNeed(r);
    if (eng < need - .5) c = 3; else if (eng < need) c = Math.min(3, c + 1);
    return { cat: CATS[c], pct: clamp(Math.round(55 + diff * 1.8), 8, 96), need, short: eng < need };
  }
  function matchList(p = um) {
    const S = strength(p);
    return uni.rows.map((r, i) => ({ r, i, ...judge(r, p, S) }))
      .filter((x) => !p.cty.length || p.cty.includes(x.r[2]));
  }
  const prefScore = (r) => { const keys = PRI().filter(([k, , idx]) => um.pri.includes(k) && idx); return keys.length ? keys.reduce((s, [, , idx]) => s + (r[idx] || 0), 0) / keys.length : 0; };
  const reachable = (p) => matchList(p).filter((x) => x.cat === "fit" || x.cat === "safe").length;

  function UniMatch() {
    loadUni();
    const mag = um.lvl === "mag", E = ENG[um.eng];
    const chips = (list, key) => `<div class="um-chips">${list.map(([k, t]) => `<button class="${um[key].includes(k) ? "on" : ""}" onclick="umToggle('${key}','${k}')">${um[key].includes(k) ? ic("check") : ""}${t}</button>`).join("")}</div>`;
    return `${navbar("UniMatch")}
    <div class="um-hero"><span class="um-badge">Top 300 · THE 2027</span><h2>${T("Sizga mos universitetlarni topamiz")}</h2>
      <p>${T("Baholaringiz, sertifikatlaringiz va yutuqlaringizni kiriting: UniMatch dunyoning eng yaxshi 300 ta universitetini sizning imkoniyatingizga qarab saralaydi.")}</p></div>
    <div class="card um-step"><h4><i>1</i>${T("Qaysi bosqichga topshirasiz?")}</h4>
      <div class="seg um-seg">${[["bak", T("Bakalavriat")], ["mag", T("Magistratura")]].map(([k, t]) => `<button class="${um.lvl === k ? "on" : ""}" onclick="umSet('lvl','${k}')">${t}</button>`).join("")}</div></div>
    <div class="card um-step"><h4><i>2</i>${mag ? T("Diplom o'rtacha bahosi") : T("Attestat o'rtacha bahosi")}<b class="um-val" id="um-gpa">${(+um.gpa).toFixed(1)}</b></h4>
      <input type="range" min="3" max="5" step="0.1" value="${um.gpa}" oninput="umGpa(this.value)"><div class="um-scale"><span>3.0</span><span>${T("5 ballik tizim")}</span><span>5.0</span></div></div>
    <div class="card um-step"><h4><i>3</i>${T("Ingliz tili sertifikati")}</h4>
      <div class="um-row"><select onchange="umSet('eng',this.value)"><option value="none" ${um.eng === "none" ? "selected" : ""}>${T("Hozircha yo'q")}</option>${Object.entries(ENG).map(([k, e]) => `<option value="${k}" ${um.eng === k ? "selected" : ""}>${T(e.t)}</option>`).join("")}</select>
      ${E ? `<select onchange="umSet('engv',this.value)">${E.v.map((v) => `<option value="${v}" ${String(um.engv) === String(v) ? "selected" : ""}>${typeof v === "number" && um.eng === "ielts" ? v.toFixed(1) : v}</option>`).join("")}</select>` : ""}</div>
      ${um.eng !== "none" && um.eng !== "ielts" ? `<small class="um-hint">${T("IELTS bo'yicha taxminan {n}", { n: engEq().toFixed(1) })}</small>` : ""}</div>
    ${mag ? "" : `<div class="card um-step"><h4><i>4</i>SAT</h4>
      <div class="um-chips one">${SAT().map(([v, t]) => `<button class="${+um.sat === v ? "on" : ""}" onclick="umSet('sat',${v})">${t}</button>`).join("")}</div>
      <small class="um-hint">${T("AQSh universitetlari uchun ayniqsa muhim; ko'p universitetlarda ixtiyoriy.")}</small></div>`}
    <div class="card um-step"><h4><i>${mag ? 4 : 5}</i>${T("Yutuqlaringiz")}</h4>${chips(ACH(), "ach")}</div>
    <div class="card um-step"><h4><i>${mag ? 5 : 6}</i>${T("Siz uchun nima muhim?")}</h4>${chips(PRI(), "pri")}</div>
    <div class="card um-step"><h4><i>${mag ? 6 : 7}</i>${T("Qaysi davlatlarda o'qimoqchisiz?")}</h4>
      ${chips(UM_COUNTRIES.map((c) => [c, cn(c)]), "cty")}<small class="um-hint">${T("Hech birini tanlamasangiz, barcha davlatlar ko'rsatiladi.")}</small></div>
    <button class="btn-primary um-go" onclick="umRun()">${ic("target")} ${T("Mos universitetlarni ko'rish")}</button>`;
  }
  function UniMatchResult() {
    loadUni();
    if (!uni) return `${navbar("UniMatch")}${uniFail ? `<p class="note">${T("Ma'lumotni yuklab bo'lmadi. Internetni tekshirib, qayta oching.")}</p>` : spinner()}`;
    const S = strength(), all = matchList(), shown = all.filter((x) => x.cat !== "hard");
    const n = (c) => all.filter((x) => x.cat === c).length;
    const order = { fit: 0, reach: 1, safe: 2 };
    let rows = shown.filter((x) => umF.cat === "all" || x.cat === umF.cat);
    rows.sort(um.pri.includes("easy") ? (a, b) => b.pct - a.pct
      : (a, b) => (umF.cat === "all" ? order[a.cat] - order[b.cat] : 0) || (prefScore(b.r) - prefScore(a.r)) || rankNum(a.r) - rankNum(b.r));
    const level = S >= 75 ? T("Juda kuchli") : S >= 55 ? T("Kuchli") : S >= 35 ? T("O'rtacha") : T("Boshlang'ich");
    // what would open the most doors: a better English score, an SAT, an olympiad or research result
    const base = reachable(um), tips = [];
    const tryP = (ch, text) => { const k = reachable(Object.assign({}, um, ch)) - base; if (k > 0) tips.push([k, text(k)]); };
    if (engEq() < 7.5) tryP({ eng: "ielts", engv: engEq() < 6.5 ? 6.5 : engEq() < 7 ? 7 : 7.5 }, (k) => T("IELTS {b} bo'lsa, yana {n} ta universitet mos keladi", { b: (engEq() < 6.5 ? 6.5 : engEq() < 7 ? 7 : 7.5).toFixed(1), n: k }));
    if (um.lvl === "bak" && (!um.sat || um.sat < 1450)) tryP({ sat: 1450 }, (k) => T("SAT 1400+ natijasi yana {n} ta universitetni ochadi", { n: k }));
    if (!um.ach.includes("res")) tryP({ ach: um.ach.concat("res") }, (k) => T("Ilmiy maqola yoki tadqiqot yana {n} ta universitet imkoniyatini beradi", { n: k }));
    tips.sort((a, b) => b[0] - a[0]);
    const tag = { reach: T("Ambitsiyali"), fit: T("Mos"), safe: T("Ishonchli") };
    return `${navbar("UniMatch")}
    <div class="um-res">
      <div class="um-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg" style="stroke-dasharray:${(S / 100 * 326.7).toFixed(1)} 326.7"/></svg><div><b>${S}</b><small>/ 100</small></div></div>
      <div class="um-res-t"><small>${T("Profilingiz kuchi")}</small><h3>${level}</h3><p>${T("{n} ta universitet sizga mos yoki ishonchli", { n: n("fit") + n("safe") })}</p>
        <button class="um-edit" onclick="location.hash='#/unimatch'">${ic("pen")} ${T("Ma'lumotlarni o'zgartirish")}</button></div>
    </div>
    <div class="um-sum">${[["reach", "ic-reach"], ["fit", ""], ["safe", ""]].map(([c]) => `<span class="${c}"><b>${n(c)}</b>${tag[c]}</span>`).join("")}</div>
    ${tips.length ? `<div class="card um-tips"><h4>${ic("trend")} ${T("Imkoniyatingizni qanday oshirish mumkin")}</h4>${tips.slice(0, 3).map(([, t]) => `<p>${ic("chev")}${t}</p>`).join("")}</div>` : ""}
    <div class="seg um-filter">${[["all", T("Barchasi")], ["fit", tag.fit], ["reach", tag.reach], ["safe", tag.safe]].map(([k, t]) => `<button class="${umF.cat === k ? "on" : ""}" onclick="umCat('${k}')">${t}</button>`).join("")}</div>
    <div class="um-list">${rows.slice(0, umF.more).map((x) => `<button class="um-uni ${x.cat}" onclick="uniOpen(${x.i})">
        <span class="sd-rank">${esc(x.r[0])}</span><span class="notr"><b>${esc(x.r[1])}</b><small>${esc(cn(x.r[2]))}${x.short ? ` · <em>${T("IELTS {n} kerak", { n: x.need.toFixed(1) })}</em>` : ""}</small></span>
        <span class="um-pct"><b>${x.pct}%</b><i>${tag[x.cat]}</i></span></button>`).join("") || `<div class="card um-empty">${chip("search", "lg")}<p>${T("Hozircha mos universitet topilmadi. Davlatlar tanlovini kengaytiring yoki ingliz tili natijangizni yangilang.")}</p></div>`}</div>
    ${rows.length > umF.more ? `<button class="btn-ghost" onclick="umMore()">${T("Yana ko'rsatish ({n})", { n: rows.length - umF.more })}</button>` : ""}
    <button class="btn-primary um-apply" onclick="location.hash='#/ariza'">${ic("send")} ${T("Ariza topshirishga tayyorlanish")}</button>
    <p class="note">${T("Bu taxminiy baho: THE 2027 reytingi, qabul darajasi va kiritgan ma'lumotlaringiz asosida hisoblanadi. Yakuniy qarorni universitet insho, tavsiyanomalar va boshqa hujjatlarga qarab qabul qiladi.")}</p>`;
  }
  const umRefresh = () => { const y = scrollY; render(); scrollTo(0, y); };
  window.umSet = (k, v) => {
    um[k] = k === "sat" ? +v : k === "engv" ? (isNaN(+v) ? v : +v) : v;
    if (k === "eng" && ENG[v]) um.engv = ENG[v].v[Math.min(4, ENG[v].v.length - 1)];
    saveUm(); haptic("light"); umRefresh();
  };
  window.umGpa = (v) => { um.gpa = +v; saveUm(); const el = document.getElementById("um-gpa"); if (el) el.textContent = (+v).toFixed(1); };
  window.umToggle = (key, k) => { const a = um[key]; um[key] = a.includes(k) ? a.filter((x) => x !== k) : a.concat(k); saveUm(); haptic("light"); umRefresh(); };
  window.umRun = () => { haptic("medium"); umF.cat = "all"; umF.more = 30; location.hash = "#/unimatch-natija"; };
  window.umCat = (k) => { umF.cat = k; umF.more = 30; haptic("light"); umRefresh(); };
  window.umMore = () => { umF.more += 30; umRefresh(); };

  return { DTM, IELTS, Unis, UniMatch, UniMatchResult };
})();
window.Study = Study;
