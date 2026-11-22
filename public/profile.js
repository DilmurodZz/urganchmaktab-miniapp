// Profil extras: usage statistics (for everyone), language choice, and the admin section (two Telegram ids only).
// The numbers come from the share server (share-worker/, Cloudflare D1): every section a user opens is counted once a day.
const ADMIN_IDS = [5199387523, 957578083];   // the two admins; the server checks this list again (ADMIN_IDS in wrangler.toml)
const isAdmin = () => ADMIN_IDS.includes(Number(user.id));
const APP_LINK = `https://t.me/${BOT}`;

/* ---------- tracking ---------- */
const SECTION_OF = { "#/": "home", "#/kompas": "kompas", "#/natija": "natija", "#/kurslar": "kurslar", "#/kurs": "kurs", "#/profil": "profil",
  "#/oyin": "oyin", "#/duo": "duo", "#/vositalar": "vositalar", "#/cv": "cv", "#/admin": "admin" };
const tkDay = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10);   // Tashkent date
function track(route) {
  const s = SECTION_OF[route]; if (!s || !tg || !tg.initData) return;
  const key = "tr_" + tkDay() + "_" + s; if (store.get(key, false)) return;
  fetch(SHARE_API + "/track?s=" + s, { method: "POST", headers: { "X-Init-Data": tg.initData } })
    .then((r) => { if (r.ok) store.set(key, true); }).catch(() => {});
}

/* ---------- statistics card ---------- */
const SECTION_NAME = () => ({ kompas: T("UniMatch"), natija: T("Kompas natijasi"), kurslar: T("Kurslar"), kurs: T("Kurs sahifalari"), tanlov: T("Tanlov"), profil: T("Profil"),
  oyin: T("O'yin"), duo: T("Do'st bilan o'yin"), vositalar: T("Foydali vositalar"), cv: T("CV va rezyume"), chegirma: T("Chegirmalar") });
let appStats = store.get("app_stats", null), statsAt = 0;
function loadStats(force) {
  if (!force && Date.now() - statsAt < 60e3) return;
  statsAt = Date.now();
  fetch(SHARE_API + "/stats").then((r) => r.json()).then((s) => {
    if (typeof s.total !== "number") return;
    const changed = JSON.stringify(s) !== JSON.stringify(appStats);
    appStats = s; store.set("app_stats", s);
    if (changed && (location.hash === "#/profil" || location.hash === "#/admin")) render();
  }).catch(() => {});
}
function statsCard() {
  setTimeout(loadStats, 0);
  const s = appStats;
  if (!s) return `<div class="card box"><h4>${ic("chart")} ${T("Ilova statistikasi")}</h4><p>${T("Yuklanmoqda…")}</p></div>`;
  const tile = (n, l, sub) => `<span class="st-tile"><b>${fmtN(n)}</b><small>${l}</small>${sub ? `<em>${sub}</em>` : ""}</span>`;
  // always the last 7 days, empty days as short grey bars
  const got = Object.fromEntries((s.days || []).map((d) => [d.d, d.n]));
  const days = [...Array(7)].map((_, i) => { const d = new Date(Date.parse((s.day || tkDay()) + "T12:00:00") - (6 - i) * 864e5).toISOString().slice(0, 10); return { d, n: got[d] || 0 }; });
  const max = Math.max(1, ...days.map((d) => d.n));
  const top = s.top || [], tmax = Math.max(1, ...top.map((t) => t.n)), names = SECTION_NAME();
  const wd = (d) => new Date(d + "T12:00:00").toLocaleDateString(LANG === "uz" ? "uz-Latn-UZ" : LANG, { weekday: "short" }).replace(".", "");
  return `<div class="card box stats-card">
    <h4>${ic("chart")} ${T("Ilova statistikasi")}</h4>
    <div class="st-grid">
      ${tile(s.total, T("Jami foydalanuvchilar"), s.newToday ? T("bugun +{n}", { n: fmtN(s.newToday) }) : "")}
      ${tile(s.dau, T("Bugun faol (DAU)"), T("kecha: {n}", { n: fmtN(s.dauYesterday) }))}
      ${tile(s.wau, T("7 kunda faol (WAU)"))}
      ${tile(s.mau, T("30 kunda faol (MAU)"))}
    </div>
    ${days.some((d) => d.n) ? `<div class="st-sub">${T("Kunlik faol foydalanuvchilar")}</div>
    <div class="st-bars">${days.map((d) => `<span><i class="${d.n ? "" : "zero"}" style="height:${Math.max(6, (d.n / max) * 100)}%">${d.n ? `<b>${d.n}</b>` : ""}</i><small>${wd(d.d)}</small></span>`).join("")}</div>` : ""}
    ${top.length ? `<div class="st-sub">${T("Eng ko'p ochilgan bo'limlar (7 kun)")}</div>
    <div class="st-top">${top.map((t) => `<div><span>${esc(names[t.s] || t.s)}</span><i><em style="width:${(t.n / tmax) * 100}%"></em></i><b>${fmtN(t.n)}</b></div>`).join("")}</div>` : ""}
    <p class="st-note">${T("Har bir foydalanuvchi kuniga bir marta sanaladi. Hisob 17.11.2026 dan boshlangan.")}</p>
  </div>`;
}

/* ---------- language ---------- */
function langCard() {
  return `<div class="card box">
    <h4>${ic("globe")} ${T("Ilova tili")}</h4><p>${T("Interfeys tilini tanlang")}</p>
    <div class="seg">${Object.entries(LANGS).map(([k, l]) => `<button class="${k === LANG ? "on" : ""}" onclick="setLang('${k}')">${l}</button>`).join("")}</div>
  </div>`;
}

// admins: the admin tools open right here in Profil as dropdowns (no separate admin page, one step less)
let admOpen = "";
const adminCard = () => {
  if (!isAdmin()) return "";
  const secs = adminSections();
  return `<div class="section-title">${T("Admin bo'limi")}</div>
  ${secs.map(([k, icn, title, sub, html]) => `<details class="card adm-dd" ${admOpen === k ? "open" : ""} ontoggle="admToggle('${k}', this.open)">
    <summary><i class="adm-ic">${ic(icn)}</i><span><b>${title}</b><small>${sub}</small></span>${ic("chev", "adm-chev")}</summary>
    <div class="adm-body">${admOpen === k ? html() : ""}</div></details>`).join("")}`;
};
// a section's content is built when it opens, so its data loads only then
window.admToggle = (k, on) => {
  if (on) { admOpen = k; document.querySelectorAll(".adm-dd[open]").forEach((d) => { if (!d.getAttribute("ontoggle").includes(`'${k}'`)) d.open = false; });
    const sec = adminSections().find((x) => x[0] === k), el = document.querySelector(`.adm-dd[open] .adm-body`); if (sec && el && !el.innerHTML) el.innerHTML = sec[4](); }
  else if (admOpen === k) admOpen = "";
};

/* ---------- admin screen ---------- */
let adminInfo = null, adminInfo_busy = false;
const adminFetch = (path, body) => fetch(SHARE_API + "/admin/" + path, body ? { method: "POST", headers: { "X-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify(body) } : { headers: { "X-Init-Data": (tg && tg.initData) || "" } })
  .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.status); return j; });
const confirmAsk = (text) => new Promise((res) => { try { tg.showConfirm(text, res); } catch { res(window.confirm(text)); } });

const admHere = () => location.hash === "#/admin" || location.hash === "#/profil";
const admRefresh = () => { if (admHere()) { const y = scrollY; render(); scrollTo(0, y); } };
// the old #/admin address opens Profil, where the admin tools now live
function AdminScreen() { location.replace("#/profil"); return ""; }
function adminSections() {
  if (!adminInfo && !adminInfo_busy && admOpen === "bc") {
    adminInfo_busy = true;
    adminFetch("info").then((j) => { adminInfo = j; }).catch((e) => toast(T("Xatolik: {e}", { e: e.message }))).finally(() => { setTimeout(() => { adminInfo_busy = false; }, 5000); });
  }
  const box = (id, title, sub, extra) => `<div class="card box adm">
    <h4>${ic(id === "bc" ? "users" : "megaphone")} ${title}</h4><p>${sub}</p>
    ${extra || ""}
    <textarea id="${id}-text" rows="5" maxlength="4000" placeholder="${T("Xabar matni")}"></textarea>
    <div class="adm-row"><input id="${id}-bt" maxlength="60" placeholder="${T("Tugma matni (ixtiyoriy)")}"><input id="${id}-bu" placeholder="https://… ${T("havola")}"></div>
    <div class="adm-row"><button class="btn-ghost" onclick="admSend('${id}', 'test')">${T("Avval o'zimga sinash")}</button>
    <button class="btn-primary" onclick="admSend('${id}', '${id === "bc" ? "broadcast" : "channel"}')">${ic("send")} ${id === "bc" ? T("Hammaga yuborish") : T("Kanalga yuborish")}</button></div>
    <div class="adm-st" id="${id}-st"></div>
  </div>`;
  return [
    ["mentors", "video", T("Mentorlar (Online meeting)"), T("Mentor qo'shish, parol va ro'yxat"), mentorAdminCard],
    ["bc", "users", T("Barcha foydalanuvchilarga xabar"), T("Bot orqali hammaga xabar yuborish"), () => box("bc", T("Barcha foydalanuvchilarga xabar"), T("Xabar bot orqali har bir foydalanuvchining shaxsiy chatiga boradi."))],
    ["links", "send", T("Havolalar"), T("Nusxa olish yoki do'stlarga ulashish"), () => `<div class="card box">
    ${[[T("Mini ilova"), APP_LINK], [T("Ustoz AI ilovasi (Android)"), PLAY_URL], [T("Ustoz AI ilovasi (iPhone)"), STORE_URL], [T("Ustoz AI kanali"), "https://t.me/ustozai"]]
      .map(([l, u]) => `<div class="adm-link"><span><b>${l}</b><small>${u}</small></span><button class="icon-btn" onclick="admCopy('${u}')" aria-label="copy">${ic("file")}</button><button class="icon-btn" onclick="admShare('${u}')" aria-label="share">${ic("send")}</button></div>`).join("")}
  </div>`],
  ];
}
window.admCopy = (u) => { const b = evBtn(); navigator.clipboard.writeText(u).then(() => copyTick(b)).catch(() => toast(u)); };
window.admShare = (u) => { const url = `https://t.me/share/url?url=${encodeURIComponent(u)}`; if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, "_blank"); };
window.admTpl = (k, id) => {
  const $ = (x) => document.getElementById(x);
  let text = "", bt = T("Ochish"), bu = APP_LINK;
  if (k === "app") text = T("Ustoz AI mini ilovasi: Kasb Kompasi, 119 ta kurs va mehnat bozori tahlili, bepul CV yaratish va qiziqarli o'yin. Hammasi Telegram ichida, bepul.");
  if (k === "cv") { text = T("Professional CV va rezyumeni 5 daqiqada bepul tayyorlang: tayyor namunalar, rasmli CV, PDF, Word yoki PNG formatida. Ustoz AI mini ilovasida."); bt = T("CV yaratish"); }
  if (k === "kompas") { text = T("90 soniyada o'zingizga mos kasbni toping: Ustoz AI Kasb Kompasi sizga mos kasb va kurslarni tavsiya qiladi."); bt = T("Kompasni boshlash"); }
  if (k === "course") {
    const c = ((Kurslar.data() || {}).courses || []).find((x) => x.id === id); if (!c) return;
    const g = Kurslar.data().groups[c.g];
    text = `${c.title}\n${T("Ustoz: {t}", { t: c.teacher || "Ustoz AI" })}${c.rating ? `\n${T("Reyting: {r}", { r: String(c.rating).replace(".", ",") })}` : ""}${c.students ? `, ${T("{n} o'quvchi", { n: fmtN(c.students) })}` : ""}${g && g.kind === "job" ? `\n${T("hh.uz'da bu yo'nalishda {n} ta ish o'rni", { n: fmtN(g.related) })}` : ""}\n\n${(c.about || "").slice(0, 400)}`;
    bt = T("Kursni ochish"); bu = c.url;
  }
  $("ch-text").value = text; $("ch-bt").value = bt; $("ch-bu").value = bu;
  haptic("light");
};
window.admSend = async (id, route) => {
  const $ = (x) => document.getElementById(x), st = $(id + "-st");
  const body = { text: $(id + "-text").value.trim(), btnText: $(id + "-bt").value.trim(), btnUrl: $(id + "-bu").value.trim() };
  if (!body.text) return toast(T("Xabar matnini yozing"));
  if (body.btnText && !/^https:\/\//.test(body.btnUrl)) return toast(T("Tugma uchun https:// bilan boshlanadigan havola kiriting"));
  if (route === "broadcast" && !(await confirmAsk(T("Xabar {n} ta foydalanuvchiga yuboriladi. Davom etasizmi?", { n: fmtN((adminInfo && adminInfo.reachable) || 0) })))) return;
  if (route === "channel" && !(await confirmAsk(T("Post {c} kanaliga joylanadi. Davom etasizmi?", { c: (adminInfo && adminInfo.channel) || "@ustozai" })))) return;
  haptic("medium");
  try {
    if (route !== "broadcast") { st.textContent = T("Yuborilmoqda…"); await adminFetch(route, body); st.textContent = route === "test" ? T("Sinov xabari sizga yuborildi") : T("Kanalga joylandi"); return; }
    let after = 0, sent = 0, failed = 0;
    do {
      const r = await adminFetch("broadcast", { ...body, after });
      sent += r.sent; failed += r.failed; after = r.next;
      st.textContent = T("Yuborildi: {s}, yetib bormadi: {f}", { s: fmtN(sent), f: fmtN(failed) }) + (after ? "…" : "");
    } while (after);
    try { tg.HapticFeedback.notificationOccurred("success"); } catch {}
    adminInfo = null;
  } catch (e) { st.textContent = T("Xatolik: {e}", { e: e.message }); }
};

/* ---------- admin: mentor accounts for Online meeting ----------
   Adding a mentor makes a strong random password on the server (stored only as a hash). It is shown here once:
   send it to the mentor privately. The first Telegram account that signs in with it becomes that mentor. */
let mentorList = null;
const meetAdmin = (path, body) => fetch(SHARE_API + "/meet/admin/" + path, { method: "POST", headers: { "X-Init-Data": tgInit(), "Content-Type": "application/json" }, body: JSON.stringify(body || {}) })
  .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.status); return j; });
function mentorAdminCard() {
  if (!mentorList) meetAdmin("mentors").then((j) => { mentorList = j.mentors; admRefresh(); }).catch(() => { mentorList = []; admRefresh(); });
  return `<div class="card box adm">
    <h4>${ic("video")} ${T("Mentorlar (Online meeting)")}</h4><p>${T("Mentor qo'shing: tizim kuchli parol yaratadi. Parolni mentorga shaxsan yuboring, u faqat bir marta ko'rinadi.")}</p>
    ${(mentorList || []).map((m) => `<div class="adm-link"><span><b>${esc(m.name)}${m.active ? "" : " · " + T("o'chirilgan")}</b><small>${esc(m.uni || "")} · ${m.bound ? T("kirgan") : T("hali kirmagan")}${m.photo ? "" : " · " + T("rasm yo'q")}</small></span>
      <button class="icon-btn" onclick="admMentorReset(${m.id})" aria-label="reset">${ic("refresh")}</button>${m.active ? `<button class="icon-btn" onclick="admMentorDel(${m.id})" aria-label="x">${ic("x")}</button>` : ""}</div>`).join("") || `<p class="st-note">${mentorList ? T("Hali mentor yo'q.") : T("Yuklanmoqda…")}</p>`}
    <div class="adm-row"><input id="am-name" maxlength="60" placeholder="${T("Ism va familiya")}"><input id="am-uni" maxlength="80" placeholder="${T("Universitet")}"></div>
    <button class="btn-primary" onclick="admMentorAdd()">${ic("plus")} ${T("Mentor qo'shish va parol yaratish")}</button>
  </div>`;
}
const showPass = (name, pass) => sheet(`<div class="ap-sheet mt-form"><span class="mt-lock">${ic("shield")}</span><h3>${T("Mentor paroli")}</h3><p class="mt-hint">${esc(name)}</p>
  <div class="mt-passbox notr">${esc(pass)}</div>
  <button class="btn-primary" onclick="admCopyPass()">${ic("file")} ${T("Nusxa olish")}</button>
  <p class="mt-hint">${T("Bu parol faqat hozir ko'rinadi. Uni mentorga shaxsiy xabarda yuboring: Online meeting, Mentorlar, \"Mentor sifatida kirish\". Kirgandan keyin mentor parolni o'zgartirishi mumkin.")}</p></div>`) || (window._admPass = pass);
window.admCopyPass = () => { const b = evBtn(); navigator.clipboard.writeText(window._admPass).then(() => copyTick(b)).catch(() => toast(T("Nusxa olib bo'lmadi"))); };
window.admMentorAdd = () => {
  const v = (id) => document.getElementById(id).value.trim(), name = v("am-name");
  if (!name) return toast(T("Mentor ismini yozing"));
  meetAdmin("add", { name, uni: v("am-uni") }).then((j) => { window._admPass = j.password; mentorList = null; admRefresh(); showPass(name, j.password); }).catch((e) => toast(T("Xatolik: {e}", { e: e.message })));
};
window.admMentorReset = (id) => {
  const m = (mentorList || []).find((x) => x.id === id);
  confirmAsk(T("{n} uchun yangi parol yaratilsinmi? Eski parol ishlamay qoladi va mentor qayta kirishi kerak.", { n: m ? m.name : "" })).then((ok) => { if (!ok) return;
    meetAdmin("reset", { id }).then((j) => { window._admPass = j.password; mentorList = null; admRefresh(); showPass(m ? m.name : "", j.password); }).catch((e) => toast(T("Xatolik: {e}", { e: e.message }))); });
};
window.admMentorDel = (id) => confirmAsk(T("Mentorni o'chirasizmi? U endi uchrashuv e'lon qila olmaydi.")).then((ok) => { if (ok) meetAdmin("remove", { id }).then(() => { mentorList = null; admRefresh(); }).catch((e) => toast(T("Xatolik: {e}", { e: e.message }))); });
