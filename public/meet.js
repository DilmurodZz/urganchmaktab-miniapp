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
      ${S.me.googleReady ? `<div class="card mt-g ${me.google ? "on" : ""}"><span class="mt-gl">G</span><div><b>${me.google ? T("Google Meet ulangan") : T("Google Meet'ni ulang")}</b>
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
      <label>${T("Yo'nalish va bitirgan yil")}<input id="mp-field" maxlength="80" value="${esc(me.field || "")}" placeholder="Computer Science, 2024"></label>
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
    api("/mentor/profile", { name: v("mp-name"), uni: v("mp-uni"), field: v("mp-field"), bio: v("mp-bio"), photo: newPhoto }).then((r) => { S.me.mentor = r.mentor; closeSheet(); toast(T("Saqlandi")); load(true); keep(); }).catch(fail);
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

  /* ---------- the poster: mentor, photo, topic, day, time, link, over a campus at dusk ---------- */
  const SKY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350"><defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A0208"/><stop offset=".55" stop-color="#6E0A1C"/><stop offset="1" stop-color="#B8862F"/></linearGradient>
    <radialGradient id="g" cx=".5" cy=".78" r=".6"><stop offset="0" stop-color="#FFD98A" stop-opacity=".55"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>
    <linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A0610"/><stop offset="1" stop-color="#1A0206"/></linearGradient></defs>
    <rect width="1080" height="1350" fill="url(#s)"/><rect width="1080" height="1350" fill="url(#g)"/>
    <g fill="#fff" opacity=".55"><circle cx="120" cy="90" r="2"/><circle cx="300" cy="160" r="1.5"/><circle cx="520" cy="70" r="2"/><circle cx="760" cy="130" r="1.6"/><circle cx="960" cy="80" r="2.2"/><circle cx="880" cy="260" r="1.4"/><circle cx="200" cy="300" r="1.4"/><circle cx="640" cy="230" r="1.2"/></g>
    <g transform="translate(0 120)"><g fill="url(#b)" stroke="#E3B866" stroke-opacity=".35" stroke-width="2">
      <path d="M0 1350V1110h60v-60h20v-90l30-50 30 50v90h20v60h70v240z"/>
      <path d="M220 1350V1060h40v-40h-14l44-70 44 70h-14v40h40v290z"/>
      <path d="M360 1350V1090h40v-30c0-80 60-140 140-150v-40h10v-30h10v30h10v40c80 10 140 70 140 150v30h40v260z"/>
      <path d="M760 1350V1040h30v-120l-12-6 37-90 37 90-12 6v120h30v310z"/>
      <path d="M890 1350V1100h50v-70h30v-40h30v40h30v70h50v250z"/></g>
    <g fill="#E3B866" opacity=".35">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${410 + i * 48}" y="1120" width="16" height="230"/>`).join("")}</g>
    <g fill="#FFD98A" opacity=".75"><rect x="245" y="1110" width="14" height="22" rx="7"/><rect x="281" y="1110" width="14" height="22" rx="7"/><rect x="790" y="1090" width="12" height="20" rx="6"/><rect x="822" y="1090" width="12" height="20" rx="6"/><rect x="930" y="1150" width="14" height="22" rx="7"/><rect x="1010" y="1150" width="14" height="22" rx="7"/><rect x="95" y="1150" width="12" height="20" rx="6"/></g></g>
  </svg>`;
  const loadImg = (src, cors) => new Promise((ok) => { const i = new Image(); if (cors) i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  function wrap(c, text, x, y, maxW, lh, maxLines) {
    const words = text.split(/\s+/), lines = []; let line = "";
    for (const w of words) { const t = line ? line + " " + w : w; if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    const out = lines.slice(0, maxLines); if (lines.length > maxLines) out[maxLines - 1] = out[maxLines - 1].replace(/\s*\S*$/, "…");
    out.forEach((l, i) => c.fillText(l, x, y + i * lh)); return out.length;
  }
  async function poster(m) {
    const t = mentorOf(m.mentor_id) || { name: "Mentor" }, W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    try { await Promise.all([document.fonts.load("700 60px Cinzel"), document.fonts.load("800 60px Inter"), document.fonts.load("600 30px Inter")]); } catch {}
    const [bg, logo, ph] = await Promise.all([loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(SKY)), loadImg("img/logo-dark.webp"), t.photo ? loadImg(`${SHARE_API}/meet/photo/${t.id}?v=${t.photo}`, true) : null]);
    if (bg) c.drawImage(bg, 0, 0, W, H);
    c.fillStyle = "rgba(20,2,6,.28)"; c.fillRect(0, 0, W, H);
    if (logo) { const w = 250, h = logo.height * w / logo.width; c.drawImage(logo, (W - w) / 2, 48, w, h); }
    c.textAlign = "center";
    // the label
    c.font = "700 30px Inter, sans-serif"; const lbl = m.kind === "public" ? "ONLINE MEETING" : "MENTOR MEETING", lw = c.measureText(lbl).width + 64;
    c.fillStyle = "#E3B866"; c.beginPath(); c.roundRect((W - lw) / 2, 290, lw, 58, 29); c.fill(); c.fillStyle = "#3A0610"; c.fillText(lbl, W / 2, 330);
    // mentor photo with a gold ring
    const cx = W / 2, cy = 520, r = 130;
    c.save(); c.beginPath(); c.arc(cx, cy, r + 12, 0, Math.PI * 2); const gr = c.createLinearGradient(cx - r, cy - r, cx + r, cy + r); gr.addColorStop(0, "#FFF1CC"); gr.addColorStop(.5, "#D9A748"); gr.addColorStop(1, "#F6DCA0"); c.fillStyle = gr; c.fill();
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.clip();
    if (ph) c.drawImage(ph, cx - r, cy - r, r * 2, r * 2); else { c.fillStyle = "#8B0920"; c.fillRect(cx - r, cy - r, r * 2, r * 2); c.fillStyle = "#fff"; c.font = "700 120px Cinzel, serif"; c.fillText((t.name || "?")[0], cx, cy + 42); }
    c.restore();
    c.fillStyle = "#FFFFFF"; c.font = "700 54px Cinzel, Georgia, serif"; c.fillText(t.name, W / 2, 735);
    c.fillStyle = "#F6DCA0"; c.font = "600 32px Inter, sans-serif"; c.fillText([t.uni, t.field].filter(Boolean).join(" · ").slice(0, 60), W / 2, 785);
    // the topic
    c.fillStyle = "#FFFFFF"; c.font = "800 58px Inter, sans-serif"; const n = wrap(c, m.topic, W / 2, 880, 900, 70, 3);
    // day and time
    const by = 880 + n * 70 + 20, d = new Date(m.starts);
    c.fillStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.roundRect(110, by, 860, 150, 30); c.fill(); c.strokeStyle = "rgba(227,184,102,.6)"; c.lineWidth = 2; c.stroke();
    c.fillStyle = "#F6DCA0"; c.font = "600 26px Inter, sans-serif"; c.fillText(T("SANA").toUpperCase(), 325, by + 50); c.fillText(T("VAQT").toUpperCase(), 755, by + 50);
    c.fillStyle = "#FFFFFF"; c.font = "800 44px Inter, sans-serif"; c.fillText(`${fmtDay(d)}, ${dayName(d)}`.slice(0, 22), 325, by + 108); c.fillText(`${hm(m.starts)} (UZT)`, 755, by + 108);
    c.fillStyle = "rgba(227,184,102,.6)"; c.fillRect(539, by + 30, 2, 90);
    // where
    c.fillStyle = "#FFFFFF"; c.font = "600 30px Inter, sans-serif"; c.fillText(`${plat(m.link)}: ${m.link.replace(/^https:\/\//, "")}`.slice(0, 58), W / 2, by + 210);
    c.fillStyle = "#F6DCA0"; c.font = "600 28px Inter, sans-serif"; c.fillText(T("Qo'shilish: @{b} → Online meeting", { b: BOT }), W / 2, H - 50);
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
