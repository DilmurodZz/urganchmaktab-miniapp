// "Ariza topshirish": the application hub.
// 1) The official application platforms (Common App, UCAS, EducationUSA, DAAD, Kaplan Pathways): what each is for,
//    the steps, and a button that opens the platform's own site, where the student signs up and applies.
//    Their sign-in pages are never copied or embedded here: the password is typed only on the official site.
// 2) "Mening arizalarim": the student's own application tracker. The Telegram account is the sign-in (no password);
//    each university has its platform, deadline, status and a document checklist. Kept on the phone (store "apps").
const Ariza = (() => {
  const PLAT = () => ({
    commonapp: { name: "Common App", sub: T("AQSh universitetlariga ariza topshirish"), url: "https://www.commonapp.org/", btn: T("Platformaga kirish"), logo: ["common", "app"], cls: "ca",
      d: [T("1 000 dan ortiq kollej va universitetga bitta umumiy ariza bilan topshirish platformasi. Asosan AQSh universitetlari, shuningdek boshqa davlatlardagi ayrim universitetlar ham qabul qiladi."),
        T("Hisob ochish bepul. Har bir universitet o'z ariza to'lovini belgilaydi, ayrimlarida ariza bepul; to'lovni to'lay olmaydigan talabalar to'lovdan ozod qilishni (fee waiver) so'rashi mumkin.")],
      steps: [T("commonapp.org saytida hisob oching"), T("Profil, ta'lim, baholar va test natijalarini to'ldiring"), T("Asosiy inshoni yozing (650 so'zgacha)"), T("Maktab maslahatchisi va o'qituvchilardan tavsiyanoma so'rang"), T("Universitetlarni tanlab, har biriga alohida topshiring")],
      when: T("Erta muddatlar (Early Decision, Early Action) ko'pincha 1-noyabr, asosiy muddat (Regular Decision) ko'pincha yanvar boshida. Har bir universitet muddatini saytidan tekshiring.") },
    ucas: { name: "UCAS", sub: T("Buyuk Britaniya universitetlari"), url: "https://www.ucas.com/", btn: T("Platformaga kirish"), logo: ["UCAS"], cls: "uc",
      d: [T("Buyuk Britaniya universitetlarining bakalavriatiga yagona ariza tizimi. Bitta arizada 5 tagacha kurs tanlanadi."),
        T("Shaxsiy bayonot (personal statement) uchta savolga javob shaklida yoziladi. Ariza uchun to'lov bor; miqdorini ucas.com saytidan tekshiring.")],
      steps: [T("ucas.com saytida ro'yxatdan o'ting"), T("5 tagacha kursni tanlang"), T("Shaxsiy bayonotni yozing"), T("O'qituvchingizdan tavsiyanoma (reference) oling"), T("To'lovni qilib, arizani yuboring")],
      when: T("Oksford, Kembrij, tibbiyot va stomatologiya: odatda 15-oktabr. Boshqa ko'p kurslar: yanvar oxiri.") },
    educationusa: { name: "EducationUSA", sub: T("AQShda o'qish va stipendiyalar bo'yicha rasmiy maslahatlar"), url: "https://educationusa.state.gov/", btn: T("Rasmiy sayt"), logo: ["Education", "USA"], cls: "eu",
      d: [T("AQSh Davlat departamentining xalqaro maslahat tarmog'i. Universitet tanlash, hujjatlar, testlar va moliyaviy yordam bo'yicha bepul maslahat va vebinarlar beradi."),
        T("Iqtidorli, ammo moliyaviy imkoniyati cheklangan talabalar uchun Opportunity Funds dasturi ham bor.")],
      steps: [T("Saytdan eng yaqin maslahat markazini toping"), T("Bepul vebinar va uchrashuvlarga yoziling"), T("Universitetlar ro'yxatingizni maslahatchi bilan tuzing")],
      when: T("Tayyorgarlikni topshirishdan 12-18 oy oldin boshlash tavsiya etiladi.") },
    daad: { name: "DAAD", sub: T("Germaniyada ta'lim imkoniyatlari"), url: "https://www.daad.de/en/", btn: T("Rasmiy sayt"), logo: ["DAAD"], cls: "da",
      d: [T("Germaniya akademik almashinuv xizmati: Germaniyadagi dasturlar va stipendiyalarning rasmiy bazasi."),
        T("Germaniyaning davlat universitetlarida o'qish asosan bepul yoki juda arzon (Baden-Vyurtemberg bundan mustasno). Ko'p universitetlarga ariza uni-assist.de orqali yoki to'g'ridan-to'g'ri universitetga topshiriladi.")],
      steps: [T("DAAD bazasidan dastur va stipendiyalarni qidiring"), T("Til talabini tekshiring: nemis yoki ingliz tili"), T("uni-assist yoki universitet sayti orqali topshiring")],
      when: T("Qishki semestr uchun ko'pincha 15-iyul, yozgi semestr uchun 15-yanvar. DAAD stipendiyalari muddati alohida.") },
    kaplan: { name: "Kaplan Pathways", sub: T("Hamkor universitetlarga hujjat topshirish"), url: "https://www.kaplanpathways.com/", btn: T("Rasmiy sayt"), logo: ["KAPLAN"], cls: "kp",
      d: [T("Tayyorlov (foundation) va o'tish (pathway) dasturlari: hamkor universitetlarga to'g'ridan-to'g'ri kirishga ballingiz yetmasa, avval tayyorlov yilini o'qib, keyin universitetga o'tasiz."),
        T("Buyuk Britaniya, AQSh, Avstraliya va boshqa davlatlardagi hamkor universitetlar bilan ishlaydi.")],
      steps: [T("Dastur va hamkor universitetni tanlang"), T("Onlayn ariza va hujjatlarni yuboring"), T("Qabul xatini olib, viza jarayonini boshlang")],
      when: T("Bir yilda bir necha marta qabul bo'ladi; muddatlarni saytdan tekshiring.") },
    direct: { name: T("Universitet sayti"), sub: T("To'g'ridan-to'g'ri universitetga"), url: "", btn: "", logo: ["UNI"], cls: "di", d: [], steps: [], when: "" },
  });
  const MAIN = ["commonapp", "ucas", "educationusa", "daad", "kaplan"];
  const STATUS = () => [["plan", T("Rejada")], ["prep", T("Tayyorlanmoqda")], ["sent", T("Topshirildi")], ["ok", T("Qabul qilindi")], ["wait", T("Kutish ro'yxati")], ["no", T("Rad etildi")]];
  const DOCS = () => ({
    commonapp: [["essay", T("Asosiy insho (Personal essay)")], ["supp", T("Qo'shimcha insholar")], ["rec", T("2 ta o'qituvchi tavsiyanomasi")], ["school", T("Maktab hisoboti va transkript")], ["eng", T("Ingliz tili natijasi")], ["sat", T("SAT natijasi (ixtiyoriy)")], ["fee", T("Ariza to'lovi yoki fee waiver")]],
    ucas: [["ps", T("Shaxsiy bayonot (Personal statement)")], ["ref", T("Tavsiyanoma (Reference)")], ["grades", T("Transkript va kutilayotgan baholar")], ["eng", T("Ingliz tili natijasi")], ["fee", T("UCAS to'lovi")]],
    other: [["mot", T("Motivatsion xat")], ["rec", T("Tavsiyanoma")], ["tr", T("Transkript yoki attestat")], ["eng", T("Ingliz tili natijasi")], ["pass", T("Pasport nusxasi")], ["cv", T("CV")]],
  });
  const docsOf = (a) => DOCS()[a.plat === "commonapp" || a.plat === "ucas" ? a.plat : "other"];
  const list = () => store.get("apps", []);
  const save = (l) => store.set("apps", l);
  const logo = (p) => `<span class="ap-logo ${p.cls}">${p.logo.map((t) => `<b>${t}</b>`).join("")}</span>`;
  const daysLeft = (d) => { if (!d) return null; const t = new Date(d + "T23:59:59"); return Math.ceil((t - Date.now()) / 864e5); };

  function Screen() {
    const P = PLAT(), apps = list();
    const name = esc((user.first_name || "") + (user.last_name ? " " + user.last_name : ""));
    return `${navbar(T("Universitetga ariza"))}
    <div class="ap-me">${user.photo_url ? `<img src="${esc(user.photo_url)}" alt="">` : `<span>${esc((user.first_name || "A")[0])}</span>`}
      <div><small>${T("Arizalar kabinetingiz")}</small><b class="notr">${name || "Alumni Mentor"}</b><em>${ic("shield")} ${T("Telegram hisobingiz orqali kirdingiz, parol kerak emas")}</em></div></div>
    <div class="section-title">${T("Mening arizalarim")}<small>${apps.length}</small></div>
    ${apps.length ? apps.map(appCard).join("") : `<div class="card ap-empty">${chip("cap", "lg")}<p>${T("Hali ariza qo'shilmagan. Universitet qo'shing yoki UniMatch orqali sizga mos universitetlarni toping.")}</p>
      <button class="btn-ghost" onclick="location.hash='#/unimatch'">${ic("target")} UniMatch</button></div>`}
    <button class="btn-primary ap-add" onclick="apNew()">${ic("plus")} ${T("Universitet qo'shish")}</button>
    <div class="section-title">${T("Ariza platformalari")}</div>
    <div class="card ap-plats">${MAIN.map((k) => { const p = P[k]; return `<button class="ap-plat" onclick="apPlat('${k}')">${logo(p)}
      <span><b>${p.name}</b><small>${p.sub}</small><u>${p.btn} ${ic("ext", "ap-arrow")}</u></span></button>`; }).join("")}</div>
    <div class="card ap-safe">${ic("shield")}<p>${T("Ro'yxatdan o'tish va ariza topshirish platformaning rasmiy saytida bo'ladi. Parolingizni faqat rasmiy saytga kiriting: Alumni Mentor parol so'ramaydi.")}</p></div>
    <div class="section-title">${T("Tayyorgarlik uchun")}</div>
    <div class="ap-more">
      <a href="#/cv">${chip("file", "sm")}<span>${T("CV va rezyume")}</span></a>
      <a href="#/ielts">${chip("globe", "sm")}<span>${T("IELTS ball kalkulyatori")}</span></a>
      <a href="#/unis" onclick="store.set('uni_tab','grant')">${chip("coin", "sm")}<span>${T("Grant va sertifikatlar")}</span></a>
    </div>`;
  }
  function appCard(a) {
    const P = PLAT(), p = P[a.plat] || P.direct, docs = docsOf(a), done = docs.filter(([k]) => a.docs && a.docs[k]).length;
    const left = daysLeft(a.deadline), st = STATUS().find(([k]) => k === a.status) || STATUS()[0];
    return `<details class="card ap-app st-${a.status}" id="ap-${a.id}"><summary>
      <span class="ap-top"><b class="notr">${esc(a.name)}</b><i class="ap-st">${st[1]}</i></span>
      <small>${esc(p.name)}${a.country ? " · " + esc(cnUz(a.country)) : ""}${left != null ? ` · <em class="${left < 0 ? "late" : left <= 14 ? "soon" : ""}">${left < 0 ? T("Muddat o'tgan") : left === 0 ? T("Bugun oxirgi kun") : T("{n} kun qoldi", { n: left })}</em>` : ""}</small>
      <span class="ap-prog"><i style="width:${Math.round(done / docs.length * 100)}%"></i></span><small class="ap-pn">${T("Hujjatlar: {a} / {b}", { a: done, b: docs.length })}</small></summary>
      <div class="ap-body">
        <label>${T("Holati")}<select onchange="apSet(${a.id},'status',this.value)">${STATUS().map(([k, t]) => `<option value="${k}" ${k === a.status ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label>${T("Topshirish muddati")}<input type="date" value="${esc(a.deadline || "")}" onchange="apSet(${a.id},'deadline',this.value)"></label>
        <div class="ap-docs">${docs.map(([k, t]) => `<button class="${a.docs && a.docs[k] ? "on" : ""}" onclick="apDoc(${a.id},'${k}')">${ic("check")}<span>${t}</span></button>`).join("")}</div>
        <div class="ap-btns">${p.url ? `<button class="btn-primary" onclick="openExt('${encodeURIComponent(p.url)}')">${ic("globe")} ${p.name}</button>` : a.site ? `<button class="btn-primary" onclick="openExt('${encodeURIComponent(a.site)}')">${ic("globe")} ${T("Rasmiy sayt")}</button>` : ""}
          <button class="btn-ghost" onclick="apDel(${a.id})">${ic("x")} ${T("O'chirish")}</button></div>
      </div></details>`;
  }
  window.apPlat = (k) => {
    const p = PLAT()[k]; haptic("light");
    sheet(`<div class="ap-sheet">${logo(p)}<h3>${p.name}</h3><p class="ap-sub">${p.sub}</p>
      ${p.d.map((t) => `<p>${t}</p>`).join("")}
      <h4>${T("Qadamlar")}</h4><ol>${p.steps.map((t) => `<li>${t}</li>`).join("")}</ol>
      ${p.when ? `<div class="ap-when">${ic("clock")}<span>${p.when}</span></div>` : ""}
      <button class="btn-primary" onclick="openExt('${encodeURIComponent(p.url)}')">${ic("globe")} ${p.btn}</button>
      <p class="note">${T("Sayt Telegram ichidagi brauzerda ochiladi. Ro'yxatdan o'tganingizdan keyin bu yerga qaytib, arizangizni kuzatib boring.")}</p></div>`);
  };
  // a new application: a university from the Top 300 list (search) or any other one typed in
  let top = null;
  window.apNew = () => {
    haptic("light");
    if (!top) fetch("top300.json").then((r) => r.json()).then((d) => { top = d.rows; const q = document.getElementById("ap-q"); if (q) apFind(q.value); }).catch(() => {});
    sheet(`<div class="ap-sheet ap-new"><h3>${T("Universitet qo'shish")}</h3>
      <label class="km-search">${ic("search")}<input id="ap-q" placeholder="${T("Universitet nomi")}" autocomplete="off" oninput="apFind(this.value)"></label>
      <div id="ap-found"></div>
      <label>${T("Ariza platformasi")}<select id="ap-plat">${Object.entries(PLAT()).map(([k, p]) => `<option value="${k}">${p.name}</option>`).join("")}</select></label>
      <label>${T("Topshirish muddati")}<input type="date" id="ap-dl"></label>
      <button class="btn-primary" onclick="apSaveNew()">${ic("check")} ${T("Saqlash")}</button></div>`);
    setTimeout(() => { const q = document.getElementById("ap-q"); if (q) q.focus(); }, 300);
  };
  let picked = null;
  window.apFind = (v) => {
    const box = document.getElementById("ap-found"); if (!box) return; picked = null;
    const q = v.trim().toLowerCase(); if (!q || !top) { box.innerHTML = ""; return; }
    const hits = top.map((r, i) => [r, i]).filter(([r]) => r[1].toLowerCase().includes(q)).slice(0, 5);
    box.innerHTML = hits.map(([r, i]) => `<button class="ap-hit" onclick="apPick(${i})"><span class="sd-rank">${esc(r[0])}</span><span class="notr">${esc(r[1])}</span></button>`).join("");
  };
  window.apPick = (i) => {
    const r = top[i]; picked = r; document.getElementById("ap-q").value = r[1]; document.getElementById("ap-found").innerHTML = "";
    document.getElementById("ap-plat").value = guessPlat(r[2]); haptic("light");
  };
  window.apSaveNew = () => {
    const name = document.getElementById("ap-q").value.trim(); if (!name) return toast(T("Universitet nomini kiriting"));
    const r = picked && picked[1] === name ? picked : null;
    appsAdd({ name, country: r ? r[2] : "", site: r ? r[14] : "", plat: document.getElementById("ap-plat").value, deadline: document.getElementById("ap-dl").value });
    closeSheet(); render();
  };
  const upd = (id, f) => { const l = list(), a = l.find((x) => x.id === id); if (a) { f(a); save(l); } };
  window.apSet = (id, k, v) => { upd(id, (a) => { a[k] = v; }); haptic("light"); keepOpen(id); };
  window.apDoc = (id, k) => { upd(id, (a) => { a.docs = a.docs || {}; a.docs[k] = !a.docs[k]; }); haptic("light"); keepOpen(id); };
  window.apDel = (id) => { if (!confirm(T("Bu arizani o'chirasizmi?"))) return; save(list().filter((x) => x.id !== id)); render(); };
  const keepOpen = (id) => { const y = scrollY; render(); const d = document.getElementById("ap-" + id); if (d) d.open = true; scrollTo(0, y); };
  return { Screen };
})();
window.Ariza = Ariza;
