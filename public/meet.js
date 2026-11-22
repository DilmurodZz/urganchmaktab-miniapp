// "Online meeting": the heart of Alumni Mentor. Alumni mentors meet students live.
// The video itself runs on Google Meet, a Telegram video chat or Zoom (best quality, screen sharing and their own chat,
// free); this section does everything around it: mentor accounts (strong password, photo), scheduling, "I'm coming",
// reminders from the bot, individual and public requests (a public one goes to the mentor at 10 supporters),
// the mentor's answer (accept, another time, decline), a live chat room for every meeting and a poster to share.
// Server side: share-worker/src/meet.js (+ the chat room in chat.js).
const Meet = (() => {
  let S = store.get("meet_cache", null), busy = false, tab = store.get("meet_tab", "meet");
  const api = async (path, body) => {
    const r = await fetch(SHARE_API + "/meet" + path, { method: "POST", headers: { "X-Init-Data": tgInit(), "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.status); return j;
  };
  const ERR = () => ({ wrong: T("Parol noto'g'ri"), too_many: T("Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring"), bound: T("Bu mentor hisobi boshqa Telegram akkauntga ulangan. Admin bilan bog'laning"),
    already_mentor: T("Siz allaqachon boshqa mentor hisobidasiz"), photo_required: T("Avval profil rasmingizni yuklang"), link: T("Havola Google Meet, Zoom, Telegram, Teams yoki Jitsi bo'lishi kerak"),
    fields: T("Barcha maydonlarni to'g'ri to'ldiring"),
    google_reconnect: T("Google ulanishi eskirdi. Mentor panelida Google'ni qayta ulang"), google_failed: T("Google Meet havolasini yaratib bo'lmadi. Qo'lda kiriting"),
    google_not_connected: T("Avval Google akkauntingizni ulang"), google_off: T("Google ulanishi hali yoqilmagan"), no_space: T("Bu uchrashuv avtomatik Google Meet bilan yaratilmagan"), weak: T("Parol kamida 12 belgi: katta va kichik harf, raqam va belgi bo'lsin"), photo_big: T("Rasm juda katta") });
  const fail = (e) => toast(ERR()[e.message] || T("Xatolik: {e}", { e: e.message }));
  // fresh data: when the page opens (at most every 20 seconds) and right after an action; the page is redrawn
  // only when something actually changed, so drawing never triggers another request
  let lastLoad = 0, again = false;
  function load(force) {
    if (!tgInit()) return;
    if (busy) { if (force) again = true; return; }
    if (!force && Date.now() - lastLoad < 20000) return;
    busy = true; lastLoad = Date.now();
    api("/state").then((d) => { const same = S && JSON.stringify(S) === JSON.stringify(d); S = d; if (!same) { store.set("meet_cache", d); if (/^#\/meet/.test(location.hash)) keep(); } paintBadge(); })
      .catch(() => {}).finally(() => { busy = false; if (again) { again = false; load(true); } });
  }
  const keep = () => { const y = scrollY; render(); scrollTo(0, y); };
  const photo = (m, cls = "") => m && m.photo ? `<img class="mt-ph ${cls}" src="${SHARE_API}/meet/photo/${m.id}?v=${m.photo}" alt="" crossorigin="anonymous">` : `<span class="mt-ph ${cls} none">${esc(((m && m.name) || "?")[0])}</span>`;
  const mentorOf = (id) => (S && S.mentors.find((x) => x.id === id)) || (S && S.me.mentor && S.me.mentor.id === id ? S.me.mentor : null);
  const PLATS = [[/meet\.google\.com/, "Google Meet"], [/zoom\.us/, "Zoom"], [/t\.me|telegram\.me/, "Telegram"], [/teams\./, "Microsoft Teams"], [/jit\.si/, "Jitsi"], [/webex/, "Webex"]];
  const plat = (u) => (PLATS.find(([r]) => r.test(u || "")) || [0, T("Havola")])[1];
  const hm = (ms) => new Date(ms).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const WD = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];
  const dayName = (d) => LANG === "uz" ? WD[d.getDay()] : d.toLocaleDateString(LANG, { weekday: "long" });
  const left = (ms) => { const m = Math.round((ms - Date.now()) / 60000); return m <= 0 ? null : m < 60 ? T("{n} daqiqadan keyin", { n: m }) : m < 1440 ? T("{n} soatdan keyin", { n: Math.round(m / 60) }) : T("{n} kundan keyin", { n: Math.round(m / 1440) }); };
  const live = (m) => Date.now() >= m.starts - 5 * 60000 && Date.now() < m.starts + m.dur * 60000;

  /* ---------- the page ---------- */
  function Screen() {
    if (!tgInit()) return `${navbar("Online meeting")}<div class="card ap-empty">${chip("video", "lg")}<p>${T("Online meeting faqat Telegram ichida ishlaydi. Mini ilovani bot orqali oching.")}</p></div>`;
    setTimeout(load, 0); store.set("meet_seen", Date.now()); setTimeout(paintBadge, 50);
    const isM = S && S.me.mentor;
    const tabs = [["meet", T("Uchrashuvlar"), "video"], ["mentors", T("Mentorlar"), "users"], ["req", T("So'rovlar"), "plus"]].concat(isM ? [["panel", T("Mentor paneli"), "briefcase"]] : []);
    if (!tabs.some(([k]) => k === tab)) tab = "meet";
    const body = !S ? spinner() : { meet: MeetTab, mentors: MentorsTab, req: ReqTab, panel: PanelTab }[tab]();
    return `${navbar("Online meeting")}
    <div class="mt-hero"><span class="mt-live">${ic("video")} Online meeting</span><h2>${T("Top universitet bitiruvchilari bilan jonli uchrashuvlar")}</h2>
      <p>${T("Savol bering, tajriba o'rganing va o'z yo'lingizni toping.")}</p></div>
    <div class="mt-tabs" style="grid-template-columns:repeat(${tabs.length},1fr)">${tabs.map(([k, t, i]) => `<button class="${tab === k ? "on" : ""}" onclick="mtTab('${k}')">${ic(i)}<span>${t}</span></button>`).join("")}</div>
    <div class="mt-body">${body}</div>`;
  }
  window.mtTab = (k) => { tab = k; store.set("meet_tab", k); haptic("light"); render(); };

  function meetCard(m) {
    const t = mentorOf(m.mentor_id) || { name: "Mentor" }, d = new Date(m.starts), going = S.going.includes(m.id), mine = S.me.mentor && S.me.mentor.id === m.mentor_id;
    const isLive = live(m), soon = left(m.starts);
    return `<div class="mt-card ${isLive ? "is-live" : ""}" id="mt-${m.id}">
      <div class="mt-who">${photo(t)}<span><b>${esc(t.name)}</b><small>${esc(t.uni || "")}${t.field ? " · " + esc(t.field) : ""}</small></span><i class="mt-kind ${m.kind}">${m.kind === "public" ? T("Ommaviy") : T("Shaxsiy")}</i></div>
      <h3 class="notr">${esc(m.topic)}</h3>${m.about ? `<p class="mt-about notr">${esc(m.about)}</p>` : ""}
      <div class="mt-when"><span>${ic("calc")}<b>${esc(fmtDay(d))}</b><small>${esc(dayName(d))}</small></span><span>${ic("clock")}<b>${hm(m.starts)}-${hm(m.starts + m.dur * 60000)}</b><small>${T("Toshkent vaqti")}</small></span></div>
      <div class="mt-status">${isLive ? `<em class="lv">${T("Hozir jonli")}</em>` : soon ? `<em>${soon}</em>` : ""}<span>${ic("users")} ${T("{n} kishi qatnashadi", { n: m.going || 0 })} · ${plat(m.link)}</span></div>
      <div class="mt-btns">
        <button class="btn-primary ${isLive ? "go" : ""}" onclick="mtJoin(${m.id})">${ic("video")} ${isLive ? T("Hozir qo'shilish") : T("Qo'shilish")}</button>
        ${mine ? "" : `<button class="btn-ghost ${going ? "on" : ""}" onclick="mtGo(${m.id},${!going})">${ic(going ? "check" : "bell")} ${going ? T("Qatnashasiz") : T("Qatnashaman")}</button>`}
      </div>
      <div class="mt-row3"><button onclick="mtChat(${m.id})">${ic("chat")}<span>${T("Uchrashuv chati")}</span></button><button onclick="mtPoster(${m.id})">${ic("share")}<span>${T("Ulashish")}</span></button>
        ${m.attend && Date.now() > m.starts ? `<button onclick="mtAttend(${m.id})">${ic("users")}<span>${T("Kim qatnashdi")}</span></button>` : ""}
        ${mine || S.me.admin ? `<button class="red" onclick="mtCancel(${m.id})">${ic("x")}<span>${T("Bekor qilish")}</span></button>` : ""}</div></div>`;
  }
  function MeetTab() {
    const list = S.meetings;
    return `${list.length ? list.map(meetCard).join("") : `<div class="card ap-empty">${chip("video", "lg")}<p>${T("Hozircha rejalashtirilgan uchrashuv yo'q. Mentorlardan uchrashuv so'rang!")}</p><button class="btn-ghost" onclick="mtTab('mentors')">${ic("users")} ${T("Mentorlar")}</button></div>`}`;
  }
  function MentorsTab() {
    const isM = S.me.mentor;
    return `${S.mentors.filter((t) => t.photo || (isM && isM.id === t.id)).map((t) => `<div class="card mt-mentor">${photo(t, "lg")}
      <div><b>${esc(t.name)}</b><small>${esc(t.uni || "")}${t.field ? " · " + esc(t.field) : ""}</small>${t.bio ? `<p class="notr">${esc(t.bio)}</p>` : ""}
      ${isM && isM.id === t.id ? `<em class="mt-you">${T("Bu sizsiz")}</em>` : `<button class="btn-primary" onclick="mtAsk(${t.id})">${ic("plus")} ${T("Uchrashuv so'rash")}</button>`}</div></div>`).join("")
      || `<div class="card ap-empty">${chip("users", "lg")}<p>${T("Mentorlar tez orada qo'shiladi.")}</p></div>`}
    ${isM ? "" : `<button class="btn-ghost mt-login" onclick="mtLogin()">${ic("shield")} ${T("Mentor sifatida kirish")}</button>`}`;
  }
  const ST = () => ({ open: T("Kutilmoqda"), ready: T("Mentorga yuborildi"), proposed: T("Yangi vaqt taklif qilindi"), accepted: T("Tasdiqlandi"), declined: T("Rad etildi") });
  // a group request: how many students are asking, and their names
  const whoList = (q) => { const who = q.who || [q.name || ""], n = Math.max(q.votes || 0, who.length);
    return `<div class="mt-who-list"><b>${T("{n} talaba so'ramoqda", { n })}</b><div>${who.slice(0, 30).map((w) => `<span class="notr">${esc(w)}</span>`).join("")}${n > 30 ? `<span>+${n - 30}</span>` : ""}</div></div>`; };
  function reqCard(q, mineView) {
    const t = mentorOf(q.mentor_id) || { name: "Mentor" }, pub = q.kind === "public";
    const prop = q.status === "proposed" && q.p_starts ? `<div class="mt-prop">${ic("clock")}<span><b>${T("Mentor taklifi")}: ${esc(fmtDay(new Date(q.p_starts)))}, ${hm(q.p_starts)}</b>${q.p_note ? `<small class="notr">${esc(q.p_note)}</small>` : ""}</span></div>` : "";
    return `<div class="card mt-req st-${q.status}" id="rq-${q.id}"><div class="mt-who sm">${photo(t)}<span><b>${esc(t.name)}</b><small>${pub ? T("Ommaviy so'rov") : T("Shaxsiy so'rov")} · ${ST()[q.status] || ""}</small></span></div>
      <h4 class="notr">${esc(q.topic)}</h4>${q.note ? `<p class="notr">${esc(q.note)}</p>` : ""}
      ${pub ? whoList(q) : ""}
      ${pub && q.status === "open" ? `<p class="mt-wait">${ic("clock")}<span>${T("Mentor so'rovni ko'rib chiqmoqda: uchrashuv o'tkazish yoki o'tkazmaslikni o'zi hal qiladi.")}</span></p>
        <div class="mt-btns">${q.voted ? `<button class="btn-ghost on">${ic("check")} ${T("Siz ham so'rayapsiz")}</button>` : `<button class="btn-primary" onclick="mtVote(${q.id})">${ic("plus")} ${T("Men ham qatnashaman")}</button>`}
        <button class="btn-ghost" onclick="mtInvite(${q.id})">${ic("send")} ${T("Do'stlarni chaqirish")}</button></div>` : ""}
      ${(q.status === "accepted" || q.status === "declined") && q.p_note ? `<div class="mt-cmt ${q.status}">${ic("chat")}<span><b>${T("Mentor izohi")}</b><small class="notr">${esc(q.p_note)}</small></span></div>` : ""}
      ${prop}${mineView && q.status === "proposed" && q.uid === S.me.uid ? `<div class="mt-btns"><button class="btn-primary" onclick="mtAnswer(${q.id},true)">${ic("check")} ${T("Tasdiqlash")}</button><button class="btn-ghost" onclick="mtAnswer(${q.id},false)">${T("Rad etish")}</button></div>` : ""}
      ${q.status === "accepted" && q.meeting_id ? `<button class="btn-ghost" onclick="mtTab('meet');setTimeout(()=>mtFocus('mt-${q.meeting_id}'),300)">${ic("video")} ${T("Uchrashuvni ko'rish")}</button>` : ""}</div>`;
  }
  function ReqTab() {
    const pubOpen = S.requests.filter((q) => q.kind === "public" && q.status === "open");
    const mine = S.requests.filter((q) => q.uid === S.me.uid && !(q.kind === "public" && q.status === "open"));
    return `<div class="mt-ways">
        <button class="mt-way one" onclick="mtPick('individual')"><i>${ic("user")}</i><b>${T("Shaxsiy so'rov")}</b><small>${T("Faqat siz va mentor. So'rov darhol mentorga boradi.")}</small><em>${ic("plus")} ${T("Yuborish")}</em></button>
        <button class="mt-way grp" onclick="mtPick('public')"><i>${ic("users")}</i><b>${T("Guruh so'rovi")}</b><small>${T("Boshqa talabalar ham qo'shiladi. So'rov darhol mentorga boradi, mentor o'zi hal qiladi.")}</small><em>${ic("plus")} ${T("Boshlash")}</em></button></div>
      <div class="section-title">${T("Guruh so'rovlari")}<small>${pubOpen.length}</small></div>
      ${pubOpen.map((q) => reqCard(q)).join("") || `<p class="note">${T("Hozircha guruh so'rovi yo'q. Yuqoridagi \"Guruh so'rovi\" tugmasi bilan birinchisini boshlang.")}</p>`}
      <div class="section-title">${T("Mening so'rovlarim")}<small>${mine.length}</small></div>
      ${mine.map((q) => reqCard(q, true)).join("") || `<p class="note">${T("Siz hali so'rov yubormagansiz.")}</p>`}`;
  }
  function PanelTab() {
    const me = S.me.mentor, inbox = S.requests.filter((q) => q.mentor_id === me.id && ["open", "ready", "proposed"].includes(q.status));
    const mineM = S.meetings.filter((m) => m.mentor_id === me.id);
    return `<div class="card mt-me">${photo(me, "lg")}<div><b>${esc(me.name)}</b><small>${esc(me.uni || "")}${me.field ? " · " + esc(me.field) : ""}</small>
        <button class="btn-ghost" onclick="mtProfile()">${ic("pen")} ${T("Profilni tahrirlash")}</button></div></div>
      ${me.photo ? "" : `<p class="um-warn">${ic("alert")}<span>${T("Uchrashuv e'lon qilish uchun profil rasmingizni yuklang.")}</span></p>`}
      ${S.me.googleReady ? `<div class="card mt-g ${me.google ? "on" : ""}"><span class="mt-gl">G</span><div><b>${me.google ? `${T("Google Meet ulangan")}<i class="mt-ok" aria-label="ok">${ic("check")}</i>` : T("Google Meet'ni ulang")}</b>
        <small class="notr">${me.google ? esc(me.google) : T("Ulasangiz, har bir uchrashuv uchun Meet havolasi avtomatik yaratiladi va kim qatnashganini ko'rasiz.")}</small></div>
        ${me.google ? `<button class="btn-ghost" onclick="mtGoogleOff()">${T("Uzish")}</button>` : `<button class="btn-primary" onclick="mtGoogle()">${T("Ulash")}</button>`}</div>` : ""}
      <button class="btn-primary mt-new" onclick="mtNew()">${ic("plus")} ${T("Uchrashuv rejalashtirish")}</button>
      <div class="section-title">${T("Kelgan so'rovlar")}<small>${inbox.length}</small></div>
      ${inbox.map((q) => `<div class="card mt-req" id="rq-${q.id}"><div class="mt-who sm"><span class="mt-ph none">${esc((q.name || "?")[0])}</span><span><b class="notr">${esc(q.name || "")}${q.kind === "public" && q.votes > 1 ? ` + ${q.votes - 1}` : ""}</b><small>${q.kind === "public" ? T("Ommaviy so'rov") : T("Shaxsiy so'rov")} · ${ST()[q.status]}</small></span></div>
        <h4 class="notr">${esc(q.topic)}</h4>${q.note ? `<p class="notr">${esc(q.note)}</p>` : ""}${q.kind === "public" ? whoList(q) : ""}${q.pref ? `<small class="mt-pref">${T("Qulay vaqt")}: ${esc(fmtDay(new Date(q.pref)))}, ${hm(q.pref)}</small>` : ""}
        ${q.status === "proposed" ? `<small class="mt-pref">${T("Siz taklif qilgan vaqt")}: ${esc(fmtDay(new Date(q.p_starts)))}, ${hm(q.p_starts)} · ${T("javob kutilmoqda")}</small>` : `<div class="mt-btns three">
          <button class="btn-primary" onclick="mtRespond(${q.id},'accept')">${ic("check")} ${T("Qabul qilish")}</button>${q.kind === "public" ? "" : `<button class="btn-ghost" onclick="mtRespond(${q.id},'propose')">${ic("clock")} ${T("Boshqa vaqt")}</button>`}<button class="btn-ghost red" onclick="mtDecline(${q.id})">${ic("x")} ${T("Rad etish")}</button></div>`}</div>`).join("")
        || `<p class="note">${T("Yangi so'rov yo'q.")}</p>`}
      <div class="section-title">${T("Mening uchrashuvlarim")}<small>${mineM.length}</small></div>
      ${mineM.map(meetCard).join("") || `<p class="note">${T("Siz hali uchrashuv rejalashtirmagansiz.")}</p>`}
      <div class="mt-acc"><button class="btn-ghost" onclick="mtPass()">${ic("shield")} ${T("Parolni o'zgartirish")}</button><button class="btn-ghost" onclick="mtLogout()">${ic("x")} ${T("Mentor rejimidan chiqish")}</button></div>`;
  }
  window.mtFocus = (id) => { const el = document.getElementById(id); if (!el) return; el.scrollIntoView({ block: "center", behavior: "smooth" }); el.classList.add("shared-glow"); setTimeout(() => el.classList.remove("shared-glow"), 2600); };

  /* ---------- student actions ---------- */
  const meetOf = (id) => S && S.meetings.find((m) => m.id === id);
  window.mtJoin = (id) => { const m = meetOf(id); if (!m) return; haptic("medium"); if (Date.now() < m.starts - 15 * 60000) toast(T("Uchrashuv hali boshlanmagan. Havola ochiladi, mentor boshlaganda kiring"));
    // outside Telegram's own browser, so a Google Meet link opens the Meet app (camera, screen sharing, chat) when it is installed
    try { if (tg && tg.openLink) return tg.openLink(m.link, { try_instant_view: false }); } catch {} window.open(m.link, "_blank"); };
  window.mtGo = (id, on) => { haptic("medium"); api("/rsvp", { id, on }).then(() => { if (on) toast(T("Boshlanishidan 1 soat oldin va boshlanganda eslatamiz")); load(true); }).catch(fail);
    S.going = on ? S.going.concat(id) : S.going.filter((x) => x !== id); const m = meetOf(id); if (m) m.going = (m.going || 0) + (on ? 1 : -1); keep(); };
  window.mtCancel = (id) => { const go = (ok) => { if (ok) api("/cancel", { id }).then(() => { toast(T("Uchrashuv bekor qilindi")); load(true); }).catch(fail); }; try { tg.showConfirm(T("Uchrashuvni bekor qilasizmi? Qatnashuvchilarga xabar boradi."), go); } catch { go(confirm(T("Uchrashuvni bekor qilasizmi? Qatnashuvchilarga xabar boradi."))); } };
  window.mtChat = (id) => { const m = meetOf(id); store.set("mchat", { room: "m_" + id, title: m ? m.topic : "Online meeting" }); location.hash = "#/mchat"; };
  window.mtVote = (id) => { haptic("medium"); api("/vote", { id }).then((r) => { toast(T("Qo'shildingiz. Hozir {n} talaba so'ramoqda", { n: r.votes })); load(true); }).catch(fail); };
  window.mtInvite = (id) => { const q = S.requests.find((x) => x.id === id); openTg(`https://t.me/share/url?url=${encodeURIComponent("https://t.me/" + BOT)}&text=${encodeURIComponent(T("Mentor bilan ommaviy uchrashuv uchun ovoz bering: \"{t}\". Alumni Mentor ilovasida So'rovlar bo'limini oching.", { t: q ? q.topic : "" }))}`); };
  window.mtAnswer = (id, okk) => { api("/answer", { id, ok: okk }).then(() => { toast(okk ? T("Uchrashuv tasdiqlandi!") : T("Taklif rad etildi")); load(true); }).catch(fail); };
  window.mtAsk = (mentorId, kind) => {
    const t = mentorOf(mentorId); haptic("light");
    sheet(`<div class="ap-sheet mt-form"><div class="mt-who">${photo(t)}<span><b>${esc(t.name)}</b><small>${esc(t.uni || "")}</small></span></div>
      <h3>${T("Uchrashuv so'rash")}</h3>
      <div class="seg mt-kindsel"><button class="on" data-k="individual" onclick="mtKind(this)">${ic("user")} ${T("Shaxsiy")}</button><button data-k="public" onclick="mtKind(this)">${ic("users")} ${T("Guruh (ommaviy)")}</button></div>
      <p class="mt-hint" id="mt-khint">${T("Faqat siz va mentor. Mentor qabul qilsa yoki boshqa vaqt taklif qilsa, xabar olasiz.")}</p>
      <label>${T("Mavzu")}<input id="mt-topic" maxlength="120" placeholder="${T("Masalan: Stanfordga hujjat topshirish")}"></label>
      <label>${T("Izoh")}<textarea id="mt-note" rows="3" maxlength="600" placeholder="${T("Nimani bilmoqchisiz?")}"></textarea></label>
      <label id="mt-prefbox">${T("Sizga qulay vaqt (ixtiyoriy)")}<input id="mt-pref" type="datetime-local"></label>
      <button class="btn-primary" onclick="mtSendReq(${mentorId})">${ic("send")} ${T("So'rov yuborish")}</button></div>`);
    if (kind === "public") { const b = document.querySelector('.mt-kindsel [data-k="public"]'); if (b) mtKind(b); }
  };
  // "Shaxsiy so'rov" / "Guruh so'rovi" from the Requests tab: first pick the mentor, then the form opens with that kind chosen
  window.mtPick = (kind) => {
    const list = S.mentors.filter((t) => t.photo && !(S.me.mentor && S.me.mentor.id === t.id)); haptic("light");
    if (!list.length) return toast(T("Mentorlar tez orada qo'shiladi."));
    sheet(`<div class="ap-sheet"><h3>${kind === "public" ? T("Guruh so'rovi") : T("Shaxsiy so'rov")}</h3><p>${T("Qaysi mentor bilan uchrashmoqchisiz?")}</p>
      <div class="mt-pick">${list.map((t) => `<button onclick="mtAsk(${t.id},'${kind}')">${photo(t)}<span><b>${esc(t.name)}</b><small>${esc(t.uni || "")}${t.field ? " · " + esc(t.field) : ""}</small></span>${ic("chev")}</button>`).join("")}</div></div>`);
  };
  window.mtKind = (b) => { b.parentNode.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); const pub = b.dataset.k === "public";
    document.getElementById("mt-khint").textContent = pub ? T("Boshqa talabalar ham qo'shiladi. So'rov darhol mentorga boradi, mentor o'zi hal qiladi.") : T("Faqat siz va mentor. Mentor qabul qilsa yoki boshqa vaqt taklif qilsa, xabar olasiz.");
    document.getElementById("mt-prefbox").style.display = pub ? "none" : ""; };
  window.mtSendReq = (mentorId) => {
    const kind = document.querySelector(".mt-kindsel .on").dataset.k, topic = document.getElementById("mt-topic").value.trim(), pv = document.getElementById("mt-pref").value;
    if (!topic) return toast(T("Mavzuni yozing"));
    api("/request", { mentorId, kind, topic, note: document.getElementById("mt-note").value, pref: pv ? new Date(pv).getTime() : null }).then(() => {
      closeSheet(); haptic("medium"); toast(kind === "public" ? T("Guruh so'rovi mentorga yuborildi. Do'stlaringizni chaqiring!") : T("So'rov mentorga yuborildi")); tab = "req"; store.set("meet_tab", "req"); load(true); render();
    }).catch(fail);
  };

  /* ---------- mentor: sign in, profile, password ---------- */
  window.mtLogin = () => sheet(`<div class="ap-sheet mt-form"><span class="mt-lock">${ic("shield")}</span><h3>${T("Mentor sifatida kirish")}</h3>
    <p class="mt-hint">${T("Admin sizga bergan maxsus parolni kiriting. Parol faqat bir marta, sizning Telegram akkauntingizga bog'lanadi.")}</p>
    <label>${T("Parol")}<input id="mt-pass" type="password" autocomplete="current-password" maxlength="64"></label>
    <button class="btn-primary" onclick="mtLoginGo()">${ic("check")} ${T("Kirish")}</button></div>`);
  window.mtLoginGo = () => { const p = document.getElementById("mt-pass").value; if (!p) return; api("/mentor/login", { pass: p }).then(() => { closeSheet(); haptic("medium"); toast(T("Xush kelibsiz, mentor!")); tab = "panel"; store.set("meet_tab", "panel"); load(true); setTimeout(() => { if (S && S.me.mentor && !S.me.mentor.photo) mtProfile(); }, 1200); }).catch(fail); };
  let newPhoto = null;
  window.mtProfile = () => {
    const me = S.me.mentor; newPhoto = null;
    sheet(`<div class="ap-sheet mt-form"><h3>${T("Mentor profili")}</h3>
      <label class="mt-photo">${photo(me, "xl")}<span>${ic("camera")} ${me.photo ? T("Rasmni almashtirish") : T("Rasm yuklash (majburiy)")}</span><input type="file" accept="image/*" onchange="mtPhoto(this)" hidden></label>
      <label>${T("Ism va familiya")}<input id="mp-name" maxlength="60" value="${esc(me.name)}"></label>
      <label>${T("Universitet")}<input id="mp-uni" maxlength="80" value="${esc(me.uni || "")}" placeholder="Stanford University"></label>
      <label>${T("O'zingiz haqingizda")}<textarea id="mp-bio" rows="4" maxlength="600">${esc(me.bio || "")}</textarea></label>
      <button class="btn-primary" onclick="mtSaveProfile()">${ic("check")} ${T("Saqlash")}</button></div>`);
  };
  // the photo: a centred square, 640 px, JPEG
  window.mtPhoto = (input) => {
    const f = input.files && input.files[0]; if (!f) return;
    const im = new Image(); im.onload = () => {
      const s = Math.min(im.width, im.height), c = document.createElement("canvas"); c.width = c.height = 640;
      c.getContext("2d").drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 640, 640);
      newPhoto = c.toDataURL("image/jpeg", .86);
      const box = document.querySelector(".mt-photo .mt-ph"); if (box) box.outerHTML = `<img class="mt-ph xl" src="${newPhoto}" alt="">`;
    }; im.src = URL.createObjectURL(f);
  };
  window.mtSaveProfile = () => {
    const v = (id) => document.getElementById(id).value;
    if (!newPhoto && !S.me.mentor.photo) return toast(T("Avval profil rasmingizni yuklang"));
    api("/mentor/profile", { name: v("mp-name"), uni: v("mp-uni"), field: "", bio: v("mp-bio"), photo: newPhoto }).then((r) => { S.me.mentor = r.mentor; closeSheet(); toast(T("Saqlandi")); load(true); keep(); }).catch(fail);
  };
  window.mtPass = () => sheet(`<div class="ap-sheet mt-form"><h3>${T("Parolni o'zgartirish")}</h3>
    <label>${T("Hozirgi parol")}<input id="mp-old" type="password" autocomplete="current-password"></label>
    <label>${T("Yangi parol")}<input id="mp-new" type="password" autocomplete="new-password" oninput="mtStrength(this.value)"></label>
    <div class="mt-meter"><i id="mp-meter"></i></div><p class="mt-hint">${T("Kamida 12 belgi: katta va kichik harf, raqam va belgi (!@#$...).")}</p>
    <button class="btn-primary" onclick="mtPassGo()">${ic("check")} ${T("Saqlash")}</button></div>`);
  window.mtStrength = (p) => { const n = [p.length >= 12, /[a-z]/.test(p), /[A-Z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length; const el = document.getElementById("mp-meter"); if (el) { el.style.width = n * 20 + "%"; el.className = n === 5 ? "ok" : n >= 3 ? "mid" : ""; } };
  window.mtPassGo = () => api("/mentor/password", { old: document.getElementById("mp-old").value, pass: document.getElementById("mp-new").value }).then(() => { closeSheet(); toast(T("Parol o'zgartirildi")); }).catch(fail);
  window.mtLogout = () => { const go = (ok) => { if (ok) api("/mentor/logout").then(() => { tab = "meet"; load(true); toast(T("Mentor rejimidan chiqdingiz")); }).catch(fail); }; try { tg.showConfirm(T("Mentor rejimidan chiqasizmi? Qayta kirish uchun parol kerak bo'ladi."), go); } catch { go(confirm(T("Mentor rejimidan chiqasizmi? Qayta kirish uchun parol kerak bo'ladi."))); } };

  /* ---------- mentor: Google Meet ---------- */
  // Google refuses sign-in inside app web views, so the sign-in page opens in the phone's browser; on return the panel refreshes
  window.mtGoogle = () => api("/google/ticket").then((r) => { haptic("medium"); try { tg.openLink(r.url, { try_instant_view: false }); } catch { window.open(r.url, "_blank"); }
    toast(T("Brauzerda Google bilan kiring, keyin shu yerga qayting")); }).catch(fail);
  window.mtGoogleOff = () => { const go = (ok) => { if (ok) api("/google/disconnect").then(() => { toast(T("Google uzildi")); load(true); }).catch(fail); }; try { tg.showConfirm(T("Google akkauntini uzasizmi?"), go); } catch { go(confirm(T("Google akkauntini uzasizmi?"))); } };
  document.addEventListener("visibilitychange", () => { if (!document.hidden && location.hash === "#/meet") load(true); });
  window.mtAttend = (id) => {
    sheet(`<div class="ap-sheet mt-att"><h3>${T("Kim qatnashdi")}</h3><div class="busy-in"><div class="run-spin"></div></div></div>`);
    api("/attendance", { id }).then((r) => { const box = document.querySelector(".mt-att"); if (!box) return;
      box.innerHTML = `<h3>${T("Kim qatnashdi")}</h3><p class="mt-hint">${T("{n} kishi", { n: r.people.length })} · Google Meet</p>
        ${r.people.map((p) => `<div class="mt-arow"><span class="mt-ph none">${esc(p.name[0] || "?")}</span><b class="notr">${esc(p.name)}</b><small>${T("{n} daqiqa", { n: p.mins })}</small></div>`).join("") || `<p class="note">${T("Hali hech kim qatnashmagan yoki ma'lumot tayyor emas. Uchrashuvdan keyin biroz kuting.")}</p>`}`;
    }).catch((e) => { closeSheet(); fail(e); });
  };

  /* ---------- mentor: schedule, accept, propose ---------- */
  const autoOn = () => !!(S && S.me.googleReady && S.me.mentor && S.me.mentor.google);
  const timeFields = (pfx, title) => { const d = new Date(Date.now() + 864e5); const ds = d.toISOString().slice(0, 10);
    return `<div class="mt-2"><label>${T("Sana")}<input id="${pfx}-date" type="date" value="${ds}" min="${new Date().toISOString().slice(0, 10)}"></label><label>${T("Vaqt")}<input id="${pfx}-time" type="time" value="18:00"></label></div>
    <label>${T("Davomiyligi")}<select id="${pfx}-dur">${[30, 45, 60, 90, 120].map((n) => `<option value="${n}" ${n === 60 ? "selected" : ""}>${T("{n} daqiqa", { n })}</option>`).join("")}</select></label>
    ${autoOn() ? `<label class="mt-auto"><input type="checkbox" id="${pfx}-auto" checked onchange="document.getElementById('${pfx}-manual').hidden=this.checked"><span><b>${T("Google Meet havolasi avtomatik yaratiladi")}</b><small class="notr">${esc(S.me.mentor.google)}</small></span></label>` : ""}
    <div id="${pfx}-manual" ${autoOn() ? "hidden" : ""}>
    <div class="mt-mk"><b>${ic("video")} Google Meet</b>
      <small>${T("1. Tugmani bosing: Google Meet yangi uchrashuv ochadi. 2. Havolani nusxalang (meet.google.com/...). 3. Shu yerga qo'ying.")}</small>
      <button onclick="mtMakeMeet()">${ic("plus")} ${T("Google Meet havolasi yaratish")}</button></div>
    <label>${T("Google Meet havolasi")}<input id="${pfx}-link" type="url" inputmode="url" placeholder="https://meet.google.com/abc-defg-hij" onblur="mtFixLink(this)"></label></div>`; };
  window.mtMakeMeet = () => { haptic("light"); try { if (tg && tg.openLink) return tg.openLink("https://meet.google.com/new", { try_instant_view: false }); } catch {} window.open("https://meet.google.com/new", "_blank"); };
  // "abc-defg-hij" or "meet.google.com/abc-defg-hij" become a full link
  window.mtFixLink = (el) => { let v = el.value.trim(); if (/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i.test(v)) v = "https://meet.google.com/" + v; else if (/^meet\.google\.com\//i.test(v)) v = "https://" + v; el.value = v; };
  const readTime = (pfx) => { const d = document.getElementById(pfx + "-date").value, t = document.getElementById(pfx + "-time").value; return { starts: d && t ? new Date(d + "T" + t).getTime() : NaN, dur: +document.getElementById(pfx + "-dur").value, link: document.getElementById(pfx + "-link").value.trim(), auto: !!(document.getElementById(pfx + "-auto") || {}).checked }; };
  window.mtNew = () => {
    if (!S.me.mentor.photo) { toast(T("Avval profil rasmingizni yuklang")); return mtProfile(); }
    sheet(`<div class="ap-sheet mt-form"><h3>${T("Uchrashuv rejalashtirish")}</h3>
      <label>${T("Mavzu")}<input id="mn-topic" maxlength="120" placeholder="${T("Masalan: Top universitetga insho yozish sirlari")}"></label>
      <label>${T("Tavsif")}<textarea id="mn-about" rows="3" maxlength="800" placeholder="${T("Uchrashuvda nima haqida gaplashamiz?")}"></textarea></label>
      ${timeFields("mn")}<p class="mt-hint">${T("E'lon qilingach, barcha foydalanuvchilarga bot orqali xabar boradi.")}</p>
      <button class="btn-primary" onclick="mtCreate()">${ic("send")} ${T("E'lon qilish")}</button></div>`);
  };
  window.mtCreate = () => {
    const x = readTime("mn"), topic = document.getElementById("mn-topic").value.trim(); if (!topic) return toast(T("Mavzuni yozing"));
    api("/create", { topic, about: document.getElementById("mn-about").value, ...x }).then((r) => { closeSheet(); haptic("medium"); S.meetings.push({ ...r.meeting, going: 0 }); S.meetings.sort((a, b) => a.starts - b.starts); toast(T("Uchrashuv e'lon qilindi!")); setTimeout(() => mtPoster(r.meeting.id), 400); load(true); }).catch(fail);
  };
  window.mtRespond = (id, action) => {
    const q = S.requests.find((x) => x.id === id);
    sheet(`<div class="ap-sheet mt-form"><h3>${action === "accept" ? T("So'rovni qabul qilish") : T("Boshqa vaqt taklif qilish")}</h3><p class="mt-hint notr">${esc(q ? q.topic : "")}</p>
      ${timeFields("mr")}<label>${T("Talabalarga qisqa izoh (ixtiyoriy)")}<input id="mr-note" maxlength="300" placeholder="${action === "propose" ? T("Masalan: bugun bandman, ertaga kechqurun bo'shman") : T("Masalan: savollaringizni oldindan tayyorlab keling")}"></label>
      <button class="btn-primary" onclick="mtRespondGo(${id},'${action}')">${ic(action === "accept" ? "check" : "send")} ${action === "accept" ? T("Tasdiqlash va e'lon qilish") : T("Taklifni yuborish")}</button></div>`);
    if (q && q.pref) { const d = new Date(q.pref); document.getElementById("mr-date").value = new Date(q.pref - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); document.getElementById("mr-time").value = hm(q.pref); }
  };
  window.mtRespondGo = (id, action) => { const x = readTime("mr"), note = (document.getElementById("mr-note") || {}).value || ""; api("/respond", { id, action, note, ...x }).then(() => { closeSheet(); haptic("medium"); toast(action === "accept" ? T("Uchrashuv e'lon qilindi!") : T("Taklif yuborildi")); load(true); }).catch(fail); };
  // declining: a short comment goes to every student who asked (no long chat, just the reason)
  window.mtDecline = (id) => { const q = S.requests.find((x) => x.id === id); haptic("light");
    sheet(`<div class="ap-sheet mt-form"><h3>${T("So'rovni rad etish")}</h3><p class="mt-hint notr">${esc(q ? q.topic : "")}</p>
      <label>${T("Talabalarga qisqa izoh")}<input id="md-note" maxlength="300" placeholder="${T("Masalan: bu mavzuda yaxshiroq mentor bor, unga yozing")}"></label>
      <button class="btn-primary zk-red" onclick="mtDeclineGo(${id})">${ic("x")} ${T("Rad etish va xabar berish")}</button></div>`); };
  window.mtDeclineGo = (id) => { const note = document.getElementById("md-note").value.trim(); api("/respond", { id, action: "decline", note }).then(() => { closeSheet(); toast(T("So'rov rad etildi")); load(true); }).catch(fail); };

  const loadImg = (src, cors) => new Promise((ok) => { const i = new Image(); if (cors) i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  function wrap(c, text, x, y, maxW, lh, maxLines) {
    const words = text.split(/\s+/), lines = []; let line = "";
    for (const w of words) { const t = line ? line + " " + w : w; if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    const out = lines.slice(0, maxLines); if (lines.length > maxLines) out[maxLines - 1] = out[maxLines - 1].replace(/\s*\S*$/, "…");
    out.forEach((l, i) => c.fillText(l, x, y + i * lh)); return out.length;
  }
  /* ---------- the poster: a premium invitation in burgundy and gold (logo, label, large photo, name, university,
     topic, day and time, the meeting link, how to join, a campus at dusk along the bottom) ---------- */
  const GOLD = (c, x0, y0, x1, y1) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, "#FBE3A6"); g.addColorStop(.45, "#E0B25A"); g.addColorStop(.75, "#F6D58E"); g.addColorStop(1, "#C08A32"); return g; };
  function swoosh(c, flip) {
    c.save(); if (flip) { c.translate(1080, 1350); c.rotate(Math.PI); }
    c.shadowColor = "rgba(255,210,130,.75)"; c.shadowBlur = 18; c.lineCap = "round";
    [[0, 7], [26, 2.5], [50, 1.2]].forEach(([o, w]) => { c.strokeStyle = GOLD(c, 0, 400, 420, 0); c.lineWidth = w; c.globalAlpha = w > 2 ? .95 : .6;
      c.beginPath(); c.moveTo(-30, 300 + o); c.bezierCurveTo(70 + o, 170 + o * .4, 190 + o, 70, 360 + o, -30); c.stroke(); });
    c.restore();
  }
  function campus(c) {
    // a calm silhouette of a university at dusk: a domed hall with columns and towered wings
    const glow = c.createRadialGradient(540, 1330, 20, 540, 1330, 560); glow.addColorStop(0, "rgba(255,180,120,.45)"); glow.addColorStop(1, "rgba(255,180,120,0)");
    c.fillStyle = glow; c.fillRect(0, 1000, 1080, 350);
    const fill = c.createLinearGradient(0, 1170, 0, 1350); fill.addColorStop(0, "rgba(120,30,40,.85)"); fill.addColorStop(1, "rgba(40,4,12,.98)");
    c.fillStyle = fill; c.beginPath();
    c.moveTo(0, 1350); c.lineTo(0, 1250); c.lineTo(40, 1250); c.lineTo(40, 1205); c.lineTo(70, 1205); c.lineTo(70, 1175); c.lineTo(85, 1150); c.lineTo(100, 1175); c.lineTo(100, 1205);
    c.lineTo(160, 1205); c.lineTo(160, 1235); c.lineTo(330, 1235); c.lineTo(330, 1215); c.lineTo(380, 1215); c.lineTo(380, 1250); c.lineTo(420, 1250); c.lineTo(420, 1236);
    c.lineTo(460, 1236); c.quadraticCurveTo(470, 1170, 540, 1160); c.quadraticCurveTo(610, 1170, 620, 1236); c.lineTo(660, 1236); c.lineTo(660, 1250); c.lineTo(700, 1250);
    c.lineTo(700, 1215); c.lineTo(750, 1215); c.lineTo(750, 1235); c.lineTo(920, 1235); c.lineTo(920, 1205); c.lineTo(980, 1205); c.lineTo(980, 1175); c.lineTo(995, 1150);
    c.lineTo(1010, 1175); c.lineTo(1010, 1205); c.lineTo(1040, 1205); c.lineTo(1040, 1250); c.lineTo(1080, 1250); c.lineTo(1080, 1350); c.closePath(); c.fill();
    c.fillStyle = "rgba(160,50,60,.7)"; c.fillRect(536, 1140, 8, 22);   // the dome's spire
    c.fillStyle = "rgba(255,205,140,.55)";
    for (let i = 0; i < 7; i++) c.fillRect(448 + i * 28, 1262, 10, 88);                 // columns
    [[60, 1270], [110, 1270], [190, 1258], [240, 1258], [290, 1258], [790, 1258], [840, 1258], [890, 1258], [960, 1270], [1010, 1270]]
      .forEach(([x, y]) => { c.fillRect(x, y, 14, 22); c.fillRect(x, y + 40, 14, 22); });
    const fade = c.createLinearGradient(0, 1100, 0, 1350); fade.addColorStop(0, "rgba(58,4,14,0)"); fade.addColorStop(1, "rgba(30,2,8,.55)");
    c.fillStyle = fade; c.fillRect(0, 1100, 1080, 250);
  }
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  function iconCal(c, x, y, s) {
    c.save(); c.strokeStyle = GOLD(c, x, y, x + s, y + s); c.fillStyle = c.strokeStyle; c.lineWidth = s * .09;
    rr(c, x, y + s * .14, s, s * .86, s * .16); c.stroke(); c.fillRect(x, y + s * .14, s, s * .24);
    c.fillRect(x + s * .2, y, s * .1, s * .26); c.fillRect(x + s * .7, y, s * .1, s * .26);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) c.fillRect(x + s * (.2 + k * .23), y + s * (.52 + r * .2), s * .14, s * .12);
    c.restore();
  }
  function iconClock(c, x, y, s) {
    c.save(); c.strokeStyle = GOLD(c, x, y, x + s, y + s); c.lineWidth = s * .1; c.lineCap = "round";
    c.beginPath(); c.arc(x + s / 2, y + s / 2, s * .44, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(x + s / 2, y + s * .24); c.lineTo(x + s / 2, y + s / 2); c.lineTo(x + s * .7, y + s * .62); c.stroke(); c.restore();
  }
  function iconVideo(c, x, y, s, col) {
    c.save(); c.fillStyle = col; rr(c, x, y + s * .18, s * .66, s * .64, s * .14); c.fill();
    c.beginPath(); c.moveTo(x + s * .7, y + s * .42); c.lineTo(x + s, y + s * .22); c.lineTo(x + s, y + s * .78); c.lineTo(x + s * .7, y + s * .58); c.closePath(); c.fill(); c.restore();
  }
  function iconMeet(c, x, y, s) {   // a small Google Meet style camera in the four Google colours
    c.save(); rr(c, x, y + s * .14, s * .7, s * .72, s * .12); c.clip();
    c.fillStyle = "#00832D"; c.fillRect(x, y, s, s); c.fillStyle = "#0066DA"; c.fillRect(x, y, s * .24, s);
    c.fillStyle = "#FFBA00"; c.fillRect(x + s * .24, y, s, s * .38); c.fillStyle = "#EA4335"; c.fillRect(x, y, s * .24, s * .38);
    c.fillStyle = "#00AC47"; c.fillRect(x + s * .24, y + s * .62, s, s); c.restore();
    c.save(); c.fillStyle = "#00832D"; c.beginPath(); c.moveTo(x + s * .72, y + s * .38); c.lineTo(x + s, y + s * .2); c.lineTo(x + s, y + s * .8); c.lineTo(x + s * .72, y + s * .62); c.closePath(); c.fill(); c.restore();
  }
  function iconPlane(c, x, y, s) {
    c.save(); c.fillStyle = GOLD(c, x, y, x + s, y + s); c.beginPath(); c.moveTo(x, y + s * .45); c.lineTo(x + s, y); c.lineTo(x + s * .72, y + s); c.lineTo(x + s * .45, y + s * .62); c.closePath(); c.fill();
    c.fillStyle = "rgba(60,8,18,.5)"; c.beginPath(); c.moveTo(x + s * .45, y + s * .62); c.lineTo(x + s, y); c.lineTo(x + s * .38, y + s * .56); c.closePath(); c.fill(); c.restore();
  }
  const fitFont = (c, text, weight, family, max, min, w) => { let f = max; for (; f > min; f -= 2) { c.font = `${weight} ${f}px ${family}`; if (c.measureText(text).width <= w) break; } return f; };
  async function poster(m) {
    const t = mentorOf(m.mentor_id) || { name: "Mentor" }, W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const c = cv.getContext("2d"), SERIF = "Cinzel, Georgia, serif", HEAD = "Georgia, 'Noto Serif', 'Times New Roman', serif", SANS = "Inter, Arial, sans-serif";
    try { await Promise.all([document.fonts.load("700 60px Cinzel"), document.fonts.load("800 60px Inter"), document.fonts.load("600 30px Inter")]); } catch {}
    const [logo, ph] = await Promise.all([loadImg("img/logo-dark.webp"), t.photo ? loadImg(`${SHARE_API}/meet/photo/${t.id}?v=${t.photo}`, true) : null]);
    // background: deep burgundy with a soft light in the middle, gold sweeps in two corners, the campus along the bottom
    const bg = c.createRadialGradient(540, 560, 60, 540, 620, 900); bg.addColorStop(0, "#8E1428"); bg.addColorStop(.55, "#6A0A1C"); bg.addColorStop(1, "#3A0410");
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    campus(c); swoosh(c, false); swoosh(c, true);
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    // logo
    if (logo) { const w = 262, h = logo.height * w / logo.width; c.drawImage(logo, (W - w) / 2, 28, w, h); }
    // the label pill
    const lbl = (m.kind === "public" ? T("Onlayn uchrashuv") : T("Mentor bilan uchrashuv")).toUpperCase();
    c.font = `800 34px ${SANS}`; const lw = c.measureText(lbl).width + 130, ly = 270;
    c.save(); c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = 16; c.shadowOffsetY = 6; c.fillStyle = GOLD(c, (W - lw) / 2, ly, (W + lw) / 2, ly + 62); rr(c, (W - lw) / 2, ly, lw, 62, 31); c.fill(); c.restore();
    iconVideo(c, (W - lw) / 2 + 30, ly + 12, 40, "#4A0712"); c.fillStyle = "#4A0712"; c.textAlign = "left"; c.fillText(lbl, (W - lw) / 2 + 88, ly + 44); c.textAlign = "center";
    // the photo: large, in a thick gold ring with a glow
    const cx = W / 2, cy = 512, r = 148;
    c.save(); c.shadowColor = "rgba(255,200,110,.6)"; c.shadowBlur = 40; c.beginPath(); c.arc(cx, cy, r + 14, 0, Math.PI * 2); c.fillStyle = GOLD(c, cx - r, cy - r, cx + r, cy + r); c.fill(); c.restore();
    c.save(); c.beginPath(); c.arc(cx, cy, r + 4, 0, Math.PI * 2); c.fillStyle = "#5A0716"; c.fill(); c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.clip();
    if (ph) { const k = Math.max(r * 2 / ph.width, r * 2 / ph.height), w = ph.width * k, h = ph.height * k; c.drawImage(ph, cx - w / 2, cy - h / 2, w, h); }
    else { c.fillStyle = "#8B0920"; c.fillRect(cx - r, cy - r, r * 2, r * 2); c.fillStyle = "#FFFFFF"; c.font = `700 140px ${SERIF}`; c.fillText((t.name || "?")[0], cx, cy + 50); }
    c.restore();
    // name and university
    c.fillStyle = "#FFFFFF"; c.save(); c.shadowColor = "rgba(0,0,0,.45)"; c.shadowBlur = 12;
    fitFont(c, t.name.toUpperCase(), 700, SERIF, 62, 36, 920); c.fillText(t.name.toUpperCase(), W / 2, 740); c.restore();
    let y = 760;
    if (t.uni) { c.font = `700 32px ${SANS}`; const uw = Math.min(700, c.measureText(t.uni).width + 70);
      c.fillStyle = "rgba(60,4,14,.55)"; rr(c, (W - uw) / 2, y, uw, 52, 26); c.fill(); c.strokeStyle = GOLD(c, 0, y, 0, y + 52); c.lineWidth = 2.5; c.stroke();
      c.fillStyle = "#F6D58E"; c.fillText(t.uni.slice(0, 40), W / 2, y + 37); y += 70; } else y += 16;
    // the topic in a gold bar (one line, or two for a long topic)
    let f = fitFont(c, m.topic, 800, HEAD, 66, 44, 780), two = c.measureText(m.topic).width > 780;
    const th = two ? 140 : 96, tw = 860;
    c.save(); c.shadowColor = "rgba(0,0,0,.4)"; c.shadowBlur = 20; c.shadowOffsetY = 8; c.fillStyle = GOLD(c, (W - tw) / 2, y, (W + tw) / 2, y + th); rr(c, (W - tw) / 2, y, tw, th, th / 2); c.fill(); c.restore();
    c.fillStyle = "#4A0712"; c.font = `800 ${two ? 46 : f}px ${HEAD}`;
    if (two) wrap(c, m.topic, W / 2, y + 64, 780, 54, 2); else c.fillText(m.topic, W / 2, y + th / 2 + f * .34);
    y += th + 30;
    // day and time
    const d = new Date(m.starts), bh = 120;
    c.fillStyle = "rgba(60,4,14,.45)"; rr(c, 100, y, 880, bh, 28); c.fill(); c.strokeStyle = GOLD(c, 100, y, 980, y + bh); c.lineWidth = 2.5; c.stroke();
    c.fillStyle = "rgba(240,200,130,.6)"; c.fillRect(539, y + 24, 2, bh - 48);
    iconCal(c, 140, y + 32, 56); iconClock(c, 580, y + 32, 56);
    c.textAlign = "left"; c.fillStyle = "#F0C46E"; c.font = `800 26px ${SANS}`; c.fillText(T("Sana").toUpperCase(), 216, y + 48); c.fillText(T("Vaqt").toUpperCase(), 656, y + 48);
    c.fillStyle = "#FFFFFF"; fitFont(c, `${fmtDay(d)}, ${dayName(d)}`, 700, SANS, 38, 26, 300); c.fillText(`${fmtDay(d)}, ${dayName(d)}`, 216, y + 92);
    c.font = `700 38px ${SANS}`; c.fillText(`${hm(m.starts)} (UZT)`, 656, y + 92);
    y += bh + 24;
    // where: the meeting link
    const isMeet = /meet\.google\.com/.test(m.link), where = `${plat(m.link)}:`, link = m.link.replace(/^https:\/\//, "");
    c.fillStyle = "rgba(60,4,14,.45)"; rr(c, 160, y, 760, 80, 40); c.fill(); c.strokeStyle = GOLD(c, 160, y, 920, y + 80); c.lineWidth = 2; c.stroke();
    c.font = `800 30px ${SANS}`; const ww = c.measureText(where).width; fitFont(c, link, 500, SANS, 30, 20, 760 - 140 - ww - 14);
    const lw2 = c.measureText(link).width, total = 52 + 14 + ww + 14 + lw2, x0 = (W - total) / 2;
    if (isMeet) iconMeet(c, x0, y + 17, 46); else iconVideo(c, x0, y + 17, 46, "#F0C46E");
    c.fillStyle = "#FFFFFF"; c.font = `800 30px ${SANS}`; c.fillText(where, x0 + 66, y + 51);
    fitFont(c, link, 500, SANS, 30, 20, 760 - 140 - ww - 14); c.fillStyle = "#F4E6D0"; c.fillText(link, x0 + 66 + ww + 14, y + 51);
    y += 80 + 48;
    // how to join
    const join = T("Qo'shilish: @{b}", { b: BOT }); c.font = `600 32px ${SANS}`; const jw = c.measureText(join).width, jx = (W - jw - 52) / 2;
    iconPlane(c, jx, y - 30, 38); c.fillStyle = "#FFFFFF"; c.fillText(join, jx + 52, y);
    c.textAlign = "center";
    return await new Promise((ok) => cv.toBlob(ok, "image/png"));
  }
  window.mtPoster = async (id) => {
    const m = meetOf(id); if (!m) return; haptic("light");
    sheet(`<div class="mt-poster"><div class="busy-in"><div class="run-spin"></div></div></div>`);
    let blob; try { blob = await poster(m); } catch { blob = null; }
    const box = document.querySelector(".mt-poster"); if (!box) return;
    if (!blob) { box.innerHTML = `<p class="note">${T("Rasm tayyorlab bo'lmadi")}</p>`; return; }
    const url = URL.createObjectURL(blob); window._mtBlob = blob;
    const t = mentorOf(m.mentor_id) || { name: "" }, d = new Date(m.starts);
    window._mtText = `${m.kind === "public" ? "Online meeting" : "Mentor meeting"}: ${m.topic}\n${t.name}${t.uni ? ", " + t.uni : ""}\n${fmtDay(d)}, ${hm(m.starts)} (Toshkent)\n${plat(m.link)}: ${m.link}\n\n@${BOT}`;
    box.innerHTML = `<img src="${url}" alt=""><button class="btn-primary" onclick="mtSharePoster()">${ic("send")} ${T("Telegramda ulashish")}</button>
      <button class="btn-ghost" onclick="mtShareText()">${ic("file")} ${T("Matn bilan ulashish")}</button>`;
  };
  window.mtSharePoster = async () => {
    haptic("medium");
    try {
      const r = await (await fetch(SHARE_API + "/file?t=png&as=photo&n=meeting&c=" + encodeURIComponent(window._mtText.slice(0, 300)), { method: "POST", headers: { "X-Init-Data": tgInit() }, body: window._mtBlob })).json();
      if (r.id && tg && tg.shareMessage) tg.shareMessage(r.id); else toast(T("Rasm bot bilan chatingizga yuborildi"));
    } catch { toast(T("Yuborib bo'lmadi")); }
  };
  window.mtShareText = () => openTg(`https://t.me/share/url?url=${encodeURIComponent("https://t.me/" + BOT)}&text=${encodeURIComponent(window._mtText)}`);

  // a small number on the Home tile: meetings announced since the student last looked
  function paintBadge() {
    const seen = store.get("meet_seen", 0), n = S ? S.meetings.filter((m) => m.created > seen && m.kind === "public").length : 0;
    document.querySelectorAll("[data-mb]").forEach((el) => { el.textContent = n > 9 ? "9+" : n || ""; el.classList.toggle("on", n > 0); });
  }
  if (tgInit()) setTimeout(load, 2500);
  return { Screen, load, paintBadge };
})();
window.Meet = Meet;
