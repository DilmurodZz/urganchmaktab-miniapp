// "Top 10 universitetlarga kirish video darslari": video lessons by Bobirjon Bakhtiyorov (IELTS 9.0, SAT 1600, Johns Hopkins).
// Nothing of a video is downloaded until the student taps "Ko'rish" (the page shows only the poster picture), and
// "Yuklab olish" saves the file to the phone through Telegram, so it can be watched later without internet.
// Videos are streamed straight from the network (sw.js never caches them), so they cannot slow the app down.
window.Lessons = (() => {
  const LESSONS = [
    { id: 1, file: "video/dars-1.mp4", t: () => T("1-dars. Amerika universitetlarida o'qish"), d: () => T("AQSh universitetlariga qanday tayyorlanish kerak, nimadan boshlash va qanday xatolardan qochish"), len: "11:16", mb: 35 },
  ];
  const abs = (f) => new URL(f, location.href).href;
  function Screen() {
    return `${navbar(T("Video darslar"))}
    <div class="ls-hero"><img src="img/lessons/poster.webp" alt="" decoding="async"></div>
    <div class="card ls-who"><img src="img/lessons/icon.webp" alt="" width="64" height="64">
      <div><b class="notr">Bobirjon Bakhtiyorov</b>
        <p class="ls-tags"><em>IELTS 9.0</em><em>SAT 1600</em></p>
        <small><b>Johns Hopkins University</b> ${T("bitiruvchisi")} · ${T("BS SAT Academy hammuassisi")}</small></div></div>
    <button class="btn-ghost ls-tg" onclick="openTg('https://t.me/BobirjonsThoughts')">${ic("send")} ${T("Telegram kanali")}: @BobirjonsThoughts</button>
    <div class="section-title">${T("Darslar")}<small>${LESSONS.length}</small></div>
    ${LESSONS.map((l) => `<div class="card ls-item" id="ls-${l.id}">
      <div class="ls-player" id="lsp-${l.id}"><button class="ls-thumb" onclick="lsPlay(${l.id})" aria-label="${T("Ko'rish")}">
        <img src="img/lessons/poster.webp" alt="" loading="lazy"><i>${ic("play")}</i><s>${l.len}</s></button></div>
      <b>${esc(l.t())}</b><p>${esc(l.d())}</p>
      <div class="ls-btns"><button class="btn-primary" onclick="lsPlay(${l.id})">${ic("play")} ${T("Ko'rish")}</button>
        <button class="btn-ghost" onclick="lsSave(${l.id})">${ic("download")} ${T("Yuklab olish")} · ${l.mb} MB</button></div></div>`).join("")}
    <p class="note">${T("Video faqat \"Ko'rish\" bosilganda yuklanadi. Internet sekin bo'lsa, videoni yuklab oling va keyin internetsiz ko'ring.")}</p>
    <p class="note">${T("Yangi darslar tez orada qo'shiladi.")}</p>`;
  }
  // the video element is made only now, so nothing is downloaded before the tap
  window.lsPlay = (id) => {
    const l = LESSONS.find((x) => x.id === id), box = document.getElementById("lsp-" + id); if (!l || !box) return;
    haptic("light");
    if (box.querySelector("video")) { box.querySelector("video").play().catch(() => {}); return; }
    box.innerHTML = `<video controls autoplay playsinline preload="auto" poster="img/lessons/poster.webp" src="${l.file}" controlslist="nodownload"></video>`;
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
