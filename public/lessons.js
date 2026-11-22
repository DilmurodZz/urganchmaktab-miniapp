// "Top 10 universitetlarga kirish video darslari": video lessons by Bobirjon Bakhtiyorov (IELTS 9.0, SAT 1600, Johns Hopkins).
// Nothing of a video is downloaded until the student taps "Ko'rish" (the page shows only the poster picture), and
// "Yuklab olish" saves the file to the phone through Telegram, so it can be watched later without internet.
// Videos are streamed straight from the network (sw.js never caches them), so they cannot slow the app down.
window.Lessons = (() => {
  const LESSONS = [
    { id: 1, file: "video/dars-1.mp4", t: () => T("1-dars. Amerika universitetlarida o'qish"), d: () => T("AQSh universitetlariga qanday tayyorlanish kerak, nimadan boshlash va qanday xatolardan qochish"), len: "11:16", mb: 35, img: "img/lessons/poster.webp" },
    { id: 2, file: "video/dars-2.mp4", t: () => T("2-dars. Ivy League (Pechak ligasi) haqida"), d: () => T("Ivy League qaysi universitetlardan iborat, ular nimasi bilan farq qiladi va ularga qanday tayyorlanish kerak"), len: "12:22", mb: 28, img: "img/lessons/dars-2.webp" },
    { id: 3, file: "video/dars-3.mp4", t: () => T("3-dars. Top universitetlar uchun qanday natijalar kerak"), d: () => T("Top universitetlarda raqobatbardosh bo'lish uchun baholar, SAT, IELTS va boshqa akademik ko'rsatkichlar"), len: "15:25", mb: 29, img: "img/lessons/dars-3.webp" },
  ];
  const abs = (f) => new URL(f, location.href).href;
  function Screen() {
    // the navbar with the TOP 100 UNI logo in a circle on the right
    return `<div class="navbar"><button class="icon-btn" onclick="goBack()">${ic("back")}</button><h1>${T("Video darslar")}</h1><img class="ls-brand" src="img/lessons/top100.webp" alt="TOP 100 UNI"></div>
    <div class="ls-hero"><img src="img/lessons/poster.webp" alt="" decoding="async"></div>
    <div class="card ls-who"><img src="img/lessons/icon.webp" alt="" width="64" height="64">
      <div><b class="notr">Bobirjon Bakhtiyorov</b>
        <p class="ls-tags"><em>IELTS 9.0</em><em>SAT 1600</em></p>
        <small><b>Johns Hopkins University</b> ${T("bitiruvchisi")} · ${T("BS SAT Academy hammuassisi")}</small></div></div>
    <button class="btn-ghost ls-tg" onclick="openTg('https://t.me/BobirjonsThoughts')">${ic("send")} ${T("Telegram kanali")}: @BobirjonsThoughts</button>
    <div class="section-title">${T("Darslar")}<small>${LESSONS.length}</small></div>
    ${LESSONS.map((l) => `<div class="card ls-item" id="ls-${l.id}">
      <div class="ls-player" id="lsp-${l.id}"><button class="ls-thumb" onclick="lsPlay(${l.id})" aria-label="${T("Ko'rish")}">
        <img src="${l.img}" alt="" loading="lazy"><i>${ic("play")}</i><s>${l.len}</s></button></div>
      <b>${esc(l.t())}</b><p>${esc(l.d())}</p>
      <div class="ls-btns"><button class="ls-b go" onclick="lsPlay(${l.id})">${ic("play")}<span>${T("Ko'rish")}</span></button>
        <button class="ls-b dl" onclick="lsSave(${l.id})">${ic("download")}<span>${T("Yuklab olish")}</span><small>${l.mb} MB</small></button></div></div>`).join("")}
    <p class="note">${T("Video faqat \"Ko'rish\" bosilganda yuklanadi. Internet sekin bo'lsa, videoni yuklab oling va keyin internetsiz ko'ring.")}</p>
    <p class="note">${T("Yangi darslar tez orada qo'shiladi.")}</p>`;
  }
  // the video element is made only now, so nothing is downloaded before the tap
  window.lsPlay = (id) => {
    const l = LESSONS.find((x) => x.id === id), box = document.getElementById("lsp-" + id); if (!l || !box) return;
    haptic("light");
    if (box.querySelector("video")) { box.querySelector("video").play().catch(() => {}); return; }
    box.innerHTML = `<video controls autoplay playsinline preload="auto" poster="${l.img}" src="${l.file}" controlslist="nodownload"></video>`;
    const v = box.querySelector("video");
    v.onerror = () => toast(T("Videoni ochib bo'lmadi. Internetni tekshiring."));
    v.play().catch(() => {});
  };
  // saving to the phone: Telegram's own download (Bot API 8.0), or the browser's link as a fallback
  window.lsSave = (id) => {
    const l = LESSONS.find((x) => x.id === id); if (!l) return; haptic("medium");
    const url = abs(l.file), name = `Top10-${l.id}-dars.mp4`;
    try { if (tg && tg.downloadFile && tg.isVersionAtLeast && tg.isVersionAtLeast("8.0")) return tg.downloadFile({ url, file_name: name }, (ok) => { if (ok) toast(T("Video yuklab olinmoqda. Telegram yuklamalarida ko'ring.")); }); } catch {}
    const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  };
  function unmount() { document.querySelectorAll(".ls-player video").forEach((v) => { try { v.pause(); v.removeAttribute("src"); v.load(); } catch {} }); }
  return { Screen, unmount };
})();
