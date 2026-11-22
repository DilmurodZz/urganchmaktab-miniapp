// "Chat": one shared room where the students talk to each other, close to how a Telegram group works.
// Text, pictures (with a small editor: rotate, crop, draw), stickers, replies, editing and deleting your own messages,
// a pinned message (admins pin), who is online and who is typing. Only the first name and the Telegram photo are shown.
// The room lives on the share server (share-worker/src/chat.js) and talks over one WebSocket signed with Telegram's initData.
// When the keyboard opens, the typing bar rides up with it (visualViewport), so the student always sees what they type.
const Chat = (() => {
  const STICKERS = ["😀", "😂", "🥰", "😎", "🤩", "🥳", "😮", "😢", "😡", "🤔", "🙏", "👍", "👏", "💪", "🔥", "❤️", "🎓", "📚", "🏆", "✅", "🚀", "⭐", "☕", "🎉"];
  const COLORS = ["#8B0920", "#165936", "#1565C0", "#B07C1E", "#6D28D9", "#0E7490", "#BE185D", "#4D7C0F"];
  let ws = null, me = null, msgs = [], byId = {}, pin = null, online = 0, typing = {}, reply = null, editing = null, alive = false, retry = 0, retryT = null, noMore = false, loadingOld = false;
  let lastTypingSent = 0, pingT = null, tmpN = 0, ready = false, live = false, saveT = null;
  // the latest messages of each room are kept on the phone, so the chat opens with them at once; the server then refreshes them
  const CK = (r) => "chat_c_" + (r || room);
  const saveCache = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { store.set(CK(), { msgs: msgs.filter((m) => !m.tmp).slice(-60), pin }); } catch {} }, 600); };
  const take = (d) => { msgs = d.msgs || []; byId = {}; msgs.forEach((m) => { byId[m.id] = m; }); pin = d.pin || null; noMore = msgs.length < 60; ready = true; };
  // history over plain HTTP (faster than waiting for the live connection), for first-time visitors too
  function fetchRecent(r, paint) {
    if (!initData()) return;
    fetch(SHARE_API + "/chat/recent?room=" + r, { headers: { "X-Init-Data": initData() } }).then((x) => x.ok ? x.json() : null).then((d) => {
      if (!d) return;
      try { store.set(CK(r), { msgs: d.msgs, pin: d.pin }); } catch {}
      if (r === "main" && window.paintUnread) paintUnread();
      if (paint && !live && room === r && $("ch-msgs")) { take(d); paintAll(); paintPin(); chatBottom(); }
    }).catch(() => {});
  }
  function warm() { if (initData()) fetchRecent("main", false); }
  // unread messages in the main chat (for the red number on the Chat tab): newer than the last one seen, not your own
  const myId = () => (me && me.id) || (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) || 0;
  const lastId = (list) => list.reduce((x, m) => (m.id > x ? m.id : x), 0);
  function markSeen() { if (room !== "main" || !location.hash.startsWith("#/chat")) return; const id = lastId(msgs.filter((m) => !m.tmp)); if (id > store.get("chat_seen", 0)) store.set("chat_seen", id); window.paintUnread && paintUnread(); }
  function unread() {
    const c = store.get(CK("main"), null), list = (c && c.msgs) || []; if (!list.length) return 0;
    const seen = store.get("chat_seen", null), top = lastId(list);
    if (seen == null) { store.set("chat_seen", top); return 0; }   // first time: start counting from now
    return list.filter((m) => m.id > seen && m.uid !== myId() && !m.deleted).length;
  }
  const poll = () => fetchRecent("main", false);
  const initData = () => tgInit();
  // which room: "main" for the students' chat, "m_<id>" for one meeting's chat (#/mchat)
  let room = "main", wsRoom = null;
  const roomNow = () => (location.hash === "#/mchat" ? (store.get("mchat", {}).room || "main") : "main");
  const $ = (id) => document.getElementById(id);
  const tm = (t) => new Date(t).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const dayKey = (t) => new Date(t).toDateString();
  const dayLabel = (t) => { const d = new Date(t), now = new Date(), y = new Date(Date.now() - 864e5);
    return d.toDateString() === now.toDateString() ? T("Bugun") : d.toDateString() === y.toDateString() ? T("Kecha") : fmtDay(d); };
  const imgUrl = (id) => room === "main" ? `${SHARE_API}/chat/img/${id}` : `${SHARE_API}/chat/img/${room}/${id}`;
  const linkify = (s) => esc(s).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="#" onclick="openExt('${encodeURIComponent(u.replace(/&amp;/g, "&"))}');return false">${u}</a>`).replace(/\n/g, "<br>");
  const avatar = (m) => m.photo ? `<img class="ca" src="${esc(m.photo)}" alt="" referrerpolicy="no-referrer" onerror="this.outerHTML='<span class=\\'ca\\' style=\\'background:${COLORS[m.uid % COLORS.length]}\\'>${esc((m.name || "?")[0])}</span>'">`
    : `<span class="ca" style="background:${COLORS[m.uid % COLORS.length]}">${esc((m.name || "?")[0])}</span>`;

  /* ---------- the page ---------- */
  function Screen() {
    room = roomNow();
    if (!initData()) return `${navbar("Chat")}<div class="card ap-empty">${chip("chat", "lg")}<p>${T("Chat faqat Telegram ichida ishlaydi. Mini ilovani bot orqali oching.")}</p></div>`;
    return `<div class="ch">
      <div class="ch-top"><button class="icon-btn" onclick="goBack()">${ic("back")}</button>
        <div class="ch-title"><b class="notr">${room === "main" ? T("Talabalar chati") : esc(store.get("mchat", {}).title || "Online meeting")}</b><small id="ch-st">${T("Ulanmoqda…")}</small></div><span class="ch-logo"><img src="img/logo-emblem-light.webp" alt=""></span></div>
      <div id="ch-pin"></div>
      <div class="ch-list" id="ch-list"><div class="ch-older" id="ch-older"></div><div id="ch-msgs"></div></div>
      <button class="ch-down" id="ch-down" onclick="chatBottom(true)" hidden>${ic("down")}<em id="ch-new"></em></button>
      <div class="ch-bar" id="ch-bar">
        <div id="ch-ctx"></div>
        <div class="ch-stk" id="ch-stk" hidden>${STICKERS.map((s) => `<button onclick="chatSticker('${s}')">${s}</button>`).join("")}</div>
        <div class="ch-row">
          <label class="ch-btn" aria-label="${T("Rasm")}">${ic("image")}<input type="file" accept="image/*" onchange="chatPick(this)" hidden></label>
          <textarea id="ch-in" rows="1" maxlength="4000" placeholder="${T("Xabar yozing…")}"></textarea>
          <button class="ch-btn" onclick="chatStickers()" aria-label="${T("Stiker")}">${ic("heart")}</button>
          <button class="ch-send" id="ch-send" onclick="chatSend()" aria-label="${T("Yuborish")}">${ic("send")}</button>
        </div>
      </div></div>`;
  }
  function mount() {
    if (!initData()) return;
    room = roomNow();
    if (wsRoom !== room) { try { ws && ws.close(); } catch {} ws = null; msgs = []; byId = {}; pin = null; reply = null; editing = null; noMore = false; ready = false; }
    live = false;
    if (!me) { try { const u = tg.initDataUnsafe && tg.initDataUnsafe.user; if (u) me = { id: u.id, admin: false }; } catch {} }
    if (!msgs.length) { const c = store.get(CK(), null); if (c && c.msgs) take(c); }
    fetchRecent(room, true);
    paintAll(); paintPin(); paintStatus(); paintCtx();
    const inp = $("ch-in");
    inp.addEventListener("input", () => { inp.style.height = "auto"; inp.style.height = Math.min(inp.scrollHeight, 120) + "px"; if (Date.now() - lastTypingSent > 3000 && inp.value.trim()) { lastTypingSent = Date.now(); send({ t: "typing" }); } });
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !/Android|iPhone|iPad/i.test(navigator.userAgent)) { e.preventDefault(); chatSend(); } });
    inp.addEventListener("focus", () => setTimeout(() => chatBottom(), 300));
    const list = $("ch-list");
    list.addEventListener("scroll", () => {
      const near = list.scrollHeight - list.scrollTop - list.clientHeight < 120;
      $("ch-down").hidden = near; if (near) { $("ch-new").textContent = ""; }
      if (list.scrollTop < 80) older();
    }, { passive: true });
    keyboard(); connect(); chatBottom();
  }
  function unmount() { alive = false; wsRoom = null; clearTimeout(retryT); clearInterval(pingT); try { ws && ws.close(); } catch {} ws = null; if (vvOff) vvOff(); }

  /* ---------- connection ---------- */
  function connect() {
    alive = true; if (ws && ws.readyState <= 1) return;
    wsRoom = room;
    ws = new WebSocket(SHARE_API.replace(/^http/, "ws") + "/chat/ws?room=" + room + "&init=" + encodeURIComponent(initData()));
    ws.onopen = () => { retry = 0; clearInterval(pingT); pingT = setInterval(() => send({ t: "ping" }), 25000); };
    ws.onmessage = (e) => { let d; try { d = JSON.parse(e.data); } catch { return; } onData(d); };
    ws.onclose = () => { clearInterval(pingT); paintStatus(true); if (alive) { retryT = setTimeout(connect, Math.min(15000, 1000 * 2 ** retry++)); } };
  }
  const send = (o) => { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(o)); return true; } return false; };
  function onData(d) {
    if (d.t === "hello") { me = d.me; online = d.online; live = true; take(d); paintAll(); paintPin(); paintStatus(); chatBottom(); saveCache(); markSeen(); return; }
    if (d.t === "msg") {
      if (d.tmp) { msgs = msgs.filter((x) => x.tmp !== d.tmp); if (!byId[d.m.id]) { msgs.push(d.m); byId[d.m.id] = d.m; } paintAll(); chatBottom(); saveCache(); return; }
      if (byId[d.m.id]) return;
      const list = $("ch-list"), near = list && list.scrollHeight - list.scrollTop - list.clientHeight < 160;
      msgs.push(d.m); byId[d.m.id] = d.m; append(d.m);
      if (d.m.uid === (me && me.id) || near) chatBottom(true); else { const n = $("ch-new"); if (n) n.textContent = String((+n.textContent || 0) + 1); }
      if (d.m.uid !== (me && me.id)) haptic(d.m.reply && d.m.reply.uid === myId() ? "medium" : "light");
      saveCache(); markSeen(); return;
    }
    if (d.t === "upd" && d.m.deleted) {   // a deleted message disappears for everyone, as in Telegram
      delete byId[d.m.id]; msgs = msgs.filter((x) => x.id !== d.m.id); paintAll(); saveCache();
      if (pin && pin.id === d.m.id) { pin = null; paintPin(); } return;
    }
    if (d.t === "upd") { byId[d.m.id] = d.m; const i = msgs.findIndex((x) => x.id === d.m.id); if (i >= 0) msgs[i] = d.m; const el = document.querySelector(`.cm[data-id="${d.m.id}"]`); if (el) el.outerHTML = msgHTML(d.m, i); if (pin && pin.id === d.m.id) { pin = d.m.deleted ? null : d.m; paintPin(); } return; }
    if (d.t === "older") { loadingOld = false; noMore = d.msgs.length < 60; const list = $("ch-list"); const h = list.scrollHeight; d.msgs.forEach((m) => { byId[m.id] = m; }); msgs = d.msgs.concat(msgs); paintAll(); list.scrollTop = list.scrollHeight - h; return; }
    if (d.t === "pin") { pin = d.m; paintPin(); return; }
    if (d.t === "online") { online = d.n; paintStatus(); return; }
    if (d.t === "typing") { typing[d.uid] = [d.name, Date.now()]; paintStatus(); setTimeout(paintStatus, 4200); return; }
    if (d.t === "err") toast(d.e === "slow" ? T("Biroz sekinroq yozing") : d.e === "big" ? T("Rasm juda katta") : T("Bajarib bo'lmadi"));
  }
  function older() { if (noMore || loadingOld || !msgs.length) return; loadingOld = true; $("ch-older").innerHTML = `<div class="run-spin"></div>`; send({ t: "more", before: msgs.find((m) => m.id)?.id || 1 }) || (loadingOld = false); }

  /* ---------- drawing ---------- */
  function msgHTML(m, i) {
    const prev = msgs[i - 1], mine = me && m.uid === me.id, cont = prev && prev.uid === m.uid && !prev.deleted && m.ts - prev.ts < 5 * 60000 && dayKey(prev.ts) === dayKey(m.ts);
    const day = !prev || dayKey(prev.ts) !== dayKey(m.ts) ? `<div class="cday"><span>${dayLabel(m.ts)}</span></div>` : "";
    if (m.deleted) return `${day}<div class="cm del ${mine ? "me" : ""}" data-id="${m.id}"><div class="cb"><i>${T("Xabar o'chirildi")}</i></div></div>`;
    const toMe = m.reply && m.reply.uid === myId() && !mine;
    const rp = m.reply ? `<button class="crp" onclick="event.stopPropagation();chatJump(${m.reply.id})"><b>@${esc(m.reply.name)}${toMe ? ` · ${T("sizga javob")}` : ""}</b><span>${m.reply.text ? esc(m.reply.text) : m.reply.img ? T("Rasm") : m.reply.sticker ? T("Stiker") : T("Xabar o'chirildi")}</span></button>` : "";
    const body = m.sticker && !m.text && !m.img ? `<div class="cstk">${esc(m.sticker)}</div>`
      : `${rp}${m.img ? `<img class="cimg" src="${imgUrl(m.img)}" alt="" loading="lazy" onclick="event.stopPropagation();chatView(${m.img})">` : ""}${m.sticker ? `<div class="cstk sm">${esc(m.sticker)}</div>` : ""}${m.text ? `<div class="ct">${linkify(m.text)}</div>` : ""}`;
    const badge = m.mentor ? `<em class="cmt-b">${ic("cap")} Mentor${m.mentor !== "Mentor" ? " · " + esc(m.mentor) : ""}</em>` : "";
    const quick = me && me.mentor && !mine && !m.tmp ? `<button class="cq" onclick="event.stopPropagation();chatReply(${m.id})">${ic("back")} ${T("Javob")}</button>` : "";
    return `${day}<div class="cm ${mine ? "me" : ""} ${m.mentor ? "mentor" : ""} ${toMe ? "tome" : ""} ${cont ? "cont" : ""} ${m.sticker && !m.text && !m.img ? "stk" : ""} ${m.tmp ? "sending" : ""}" data-id="${m.id || ""}" ${m.tmp ? `data-tmp="${m.tmp}"` : ""}>
      ${mine ? "" : cont ? `<span class="ca sp"></span>` : avatar(m)}
      <div class="cb" onclick="chatMenu(${m.id || 0})">${!mine && (!cont || m.mentor) ? `<b class="cn" style="color:${m.mentor ? "#B07C1E" : COLORS[m.uid % COLORS.length]}">${esc(m.name)}${badge}</b>` : ""}${body}
        <span class="cmeta">${m.edited ? T("tahrirlangan") + " · " : ""}${tm(m.ts)}${mine ? ` ${ic(m.tmp ? "clock" : "check")}` : ""}</span></div>${quick}</div>`;
  }
  function paintAll() { const box = $("ch-msgs"); if (!box) return; box.innerHTML = msgs.length ? msgs.map(msgHTML).join("") : !ready ? `<div class="ch-skel"><i></i><i class="me"></i><i></i><i class="me s"></i><i class="s"></i></div>` : `<div class="ch-empty">${chip("chat", "lg")}<p>${T("Hali xabar yo'q. Birinchi bo'lib salom bering!")}</p></div>`; const o = $("ch-older"); if (o) o.innerHTML = noMore && msgs.length ? `<small>${T("Chat boshi")}</small>` : ""; }
  function append(m) { const box = $("ch-msgs"); if (!box) return; if (box.querySelector(".ch-empty")) box.innerHTML = ""; box.insertAdjacentHTML("beforeend", msgHTML(m, msgs.indexOf(m))); }
  function paintPin() { const el = $("ch-pin"); if (!el) return; el.innerHTML = pin ? `<button class="ch-pinbar" onclick="chatJump(${pin.id})">${ic("pin")}<span><b>${T("Qadalgan xabar")}</b><small>${esc(pin.text || (pin.img ? T("Rasm") : T("Stiker")))}</small></span>${me && me.admin ? `<i onclick="event.stopPropagation();chatPin(${pin.id},true)">${ic("x")}</i>` : ""}</button>` : ""; }
  function paintStatus(off) {
    const el = $("ch-st"); if (!el) return;
    const now = Date.now(), who = Object.values(typing).filter(([, t]) => now - t < 4000).map(([n]) => n);
    el.textContent = off || !ws || ws.readyState !== 1 ? T("Ulanmoqda…") : who.length ? T("{n} yozmoqda…", { n: who.slice(0, 2).join(", ") }) : T("{n} kishi onlaynda", { n: online });
    el.classList.toggle("typing", !!who.length);
  }
  function paintCtx() {
    const el = $("ch-ctx"); if (!el) return;
    const m = editing || reply;
    el.innerHTML = m ? `<div class="ch-ctx">${ic(editing ? "pen" : "back")}<span><b>${editing ? T("Tahrirlash") : T("{n} ga javob", { n: "@" + esc(m.name) })}</b><small>${esc(m.text || (m.img ? T("Rasm") : T("Stiker")))}</small></span><button onclick="chatCancel()">${ic("x")}</button></div>` : "";
  }
  window.chatBottom = (smooth) => { const l = $("ch-list"); if (l) l.scrollTo({ top: l.scrollHeight, behavior: smooth ? "smooth" : "auto" }); };
  window.chatJump = (id) => { const el = document.querySelector(`.cm[data-id="${id}"]`); if (!el) return toast(T("Xabar eskiroq, yuqoriga suring")); el.scrollIntoView({ block: "center", behavior: "smooth" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1400); };

  /* ---------- sending ---------- */
  window.chatSend = () => {
    const inp = $("ch-in"); if (!inp) return; const text = inp.value.trim(); if (!text) return;
    if (editing) { if (send({ t: "edit", id: editing.id, text })) { editing = null; inp.value = ""; paintCtx(); } else toast(T("Internet yo'q")); inp.style.height = "auto"; return; }
    const tmp = "t" + (++tmpN), o = { t: "send", text, reply: reply && reply.id, tmp };
    if (!send(o)) return toast(T("Internet yo'q"));
    const m = { tmp, uid: me.id, name: "", text, ts: Date.now(), reply: reply ? { id: reply.id, uid: reply.uid, name: reply.name, text: reply.text } : null };
    msgs.push(m); append(m); chatBottom(true);
    inp.value = ""; inp.style.height = "auto"; reply = null; paintCtx(); haptic("light"); inp.focus();
  };
  window.chatStickers = () => { const p = $("ch-stk"); if (p) { p.hidden = !p.hidden; haptic("light"); if (!p.hidden) chatBottom(); } };
  window.chatSticker = (s) => { if (send({ t: "send", sticker: s, reply: reply && reply.id })) { reply = null; paintCtx(); $("ch-stk").hidden = true; haptic("medium"); } else toast(T("Internet yo'q")); };
  window.chatCancel = () => { if (editing) { const inp = $("ch-in"); if (inp) inp.value = ""; } editing = null; reply = null; paintCtx(); };

  /* ---------- the message menu: reply, copy, edit, delete, pin ---------- */
  window.chatMenu = (id) => {
    const m = byId[id]; if (!m || m.deleted || !me) return; haptic("light");
    const mine = m.uid === me.id, b = (fn, icn, t, cls = "") => `<button class="ch-act ${cls}" onclick="closeSheet();${fn}">${ic(icn)}<span>${t}</span></button>`;
    sheet(`<div class="ch-menu">${m.text ? `<p class="notr">${esc(m.text.slice(0, 200))}</p>` : ""}
      ${b(`chatReply(${id})`, "back", T("Javob berish"))}
      ${m.text ? b(`chatCopy(${id})`, "file", T("Nusxa olish")) : ""}
      ${mine && (m.text || m.img) ? b(`chatEdit(${id})`, "pen", T("Tahrirlash")) : ""}
      ${me.admin ? b(`chatPin(${id},${pin && pin.id === id})`, "pin", pin && pin.id === id ? T("Qadashni bekor qilish") : T("Qadash")) : ""}
      ${mine || me.admin ? b(`chatDel(${id})`, "x", T("O'chirish"), "red") : ""}</div>`);
  };
  window.chatReply = (id) => { reply = byId[id]; editing = null; paintCtx(); $("ch-in").focus(); };
  window.chatEdit = (id) => { editing = byId[id]; reply = null; const inp = $("ch-in"); inp.value = editing.text || ""; paintCtx(); inp.focus(); inp.dispatchEvent(new Event("input")); };
  window.chatCopy = async (id) => { try { await navigator.clipboard.writeText(byId[id].text); toast(T("Nusxa olindi")); } catch { toast(T("Nusxa olib bo'lmadi")); } };
  window.chatDel = (id) => { const go = (ok) => { if (ok) send({ t: "del", id }); }; try { tg.showConfirm(T("Xabarni o'chirasizmi?"), go); } catch { go(confirm(T("Xabarni o'chirasizmi?"))); } };
  window.chatPin = (id, un) => { send({ t: un ? "unpin" : "pin", id }); haptic("medium"); };
  window.chatView = (img) => { sheet(`<img class="ch-full" src="${imgUrl(img)}" alt="">`); };

  /* ---------- picture editor: rotate, crop, draw, caption ---------- */
  const ED = { img: null, rot: 0, crop: 0, strokes: [], color: "#FFFFFF", draw: false };
  const CROPS = [["Asl", 0], ["1:1", 1], ["4:5", .8], ["16:9", 16 / 9]];
  window.chatPick = (input) => {
    const f = input.files && input.files[0]; input.value = ""; if (!f) return;
    const im = new Image(); im.onload = () => { Object.assign(ED, { img: im, rot: 0, crop: 0, strokes: [], draw: false }); openEditor(); }; im.onerror = () => toast(T("Rasmni ochib bo'lmadi"));
    im.src = URL.createObjectURL(f);
  };
  function openEditor() {
    const el = document.createElement("div"); el.className = "ch-ed"; el.id = "ch-ed";
    el.innerHTML = `<div class="ch-ed-top"><button class="icon-btn" onclick="chatEdClose()">${ic("x")}</button><b>${T("Rasmni tahrirlash")}</b><button class="icon-btn" onclick="chatEdUndo()">${ic("refresh")}</button></div>
      <div class="ch-ed-stage"><canvas id="ch-cv"></canvas></div>
      <div class="ch-ed-tools">
        <button onclick="chatEdRot()">${ic("refresh")}<span>${T("Burish")}</span></button>
        <button id="ch-crop" onclick="chatEdCrop()">${ic("image")}<span>${T("Kesish")}: ${CROPS[0][0]}</span></button>
        <button id="ch-draw" onclick="chatEdDraw()">${ic("pen")}<span>${T("Chizish")}</span></button></div>
      <div class="ch-ed-colors" id="ch-colors" hidden>${["#FFFFFF", "#111111", "#E11D48", "#F59E0B", "#16A34A", "#2563EB", "#8B0920"].map((c) => `<button style="background:${c}" onclick="chatEdColor('${c}',this)" class="${c === ED.color ? "on" : ""}"></button>`).join("")}</div>
      <div class="ch-ed-send"><input id="ch-cap" maxlength="1000" placeholder="${T("Izoh qo'shing…")}"><button class="ch-send" onclick="chatEdSend()">${ic("send")}</button></div>`;
    document.body.appendChild(el); drawEd(); bindDraw();
  }
  function drawEd() {
    const cv = $("ch-cv"); if (!cv || !ED.img) return;
    const r = ED.rot % 180 !== 0, w0 = r ? ED.img.height : ED.img.width, h0 = r ? ED.img.width : ED.img.height;
    let cw = w0, chh = h0; const ratio = CROPS[ED.crop][1];
    if (ratio) { if (w0 / h0 > ratio) cw = h0 * ratio; else chh = w0 / ratio; }
    const k = Math.min(1, 1280 / Math.max(cw, chh)); cv.width = Math.round(cw * k); cv.height = Math.round(chh * k);
    const c = cv.getContext("2d"); c.save(); c.translate(cv.width / 2, cv.height / 2); c.rotate(ED.rot * Math.PI / 180);
    const s = k, iw = ED.img.width * s, ih = ED.img.height * s; c.drawImage(ED.img, -iw / 2, -ih / 2, iw, ih); c.restore();
    c.lineCap = "round"; c.lineJoin = "round";
    ED.strokes.forEach((st) => { c.strokeStyle = st.c; c.lineWidth = st.w; c.beginPath(); st.p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); });
  }
  function bindDraw() {
    const cv = $("ch-cv"); let cur = null;
    const pos = (e) => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * cv.width / b.width, (e.clientY - b.top) * cv.height / b.height]; };
    cv.addEventListener("pointerdown", (e) => { if (!ED.draw) return; cv.setPointerCapture(e.pointerId); cur = { c: ED.color, w: Math.max(4, cv.width / 120), p: [pos(e)] }; ED.strokes.push(cur); });
    cv.addEventListener("pointermove", (e) => { if (!cur) return; cur.p.push(pos(e)); drawEd(); });
    const end = () => { cur = null; }; cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  }
  window.chatEdRot = () => { ED.rot = (ED.rot + 90) % 360; ED.strokes = []; drawEd(); haptic("light"); };
  window.chatEdCrop = () => { ED.crop = (ED.crop + 1) % CROPS.length; ED.strokes = []; $("ch-crop").querySelector("span").textContent = `${T("Kesish")}: ${CROPS[ED.crop][0]}`; drawEd(); haptic("light"); };
  window.chatEdDraw = () => { ED.draw = !ED.draw; $("ch-draw").classList.toggle("on", ED.draw); $("ch-colors").hidden = !ED.draw; haptic("light"); };
  window.chatEdColor = (c, b) => { ED.color = c; document.querySelectorAll("#ch-colors button").forEach((x) => x.classList.toggle("on", x === b)); };
  window.chatEdUndo = () => { ED.strokes.pop(); drawEd(); };
  window.chatEdClose = () => { const el = $("ch-ed"); if (el) el.remove(); ED.img = null; };
  window.chatEdSend = () => {
    const cv = $("ch-cv"); let q = .85, data = cv.toDataURL("image/jpeg", q);
    while (data.length > 1_150_000 && q > .4) { q -= .1; data = cv.toDataURL("image/jpeg", q); }
    const text = ($("ch-cap").value || "").trim();
    if (!send({ t: "send", img: data, text, reply: reply && reply.id })) return toast(T("Internet yo'q"));
    reply = null; paintCtx(); chatEdClose(); haptic("medium"); toast(T("Yuborilmoqda…"));
  };

  /* ---------- the keyboard: keep the typing bar right above it ---------- */
  let vvOff = null;
  function keyboard() {
    const vv = window.visualViewport; if (!vv) return;
    const fit = () => {
      const bar = $("ch-bar"), page = document.querySelector(".ch"); if (!bar || !page) return;
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      page.style.setProperty("--kb", kb + "px"); page.style.height = vv.height + "px"; page.style.transform = `translateY(${vv.offsetTop}px)`;
      chatBottom();
    };
    vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit);
    try { tg.onEvent("viewportChanged", fit); } catch {}
    vvOff = () => { vv.removeEventListener("resize", fit); vv.removeEventListener("scroll", fit); try { tg.offEvent("viewportChanged", fit); } catch {} vvOff = null; };
    fit();
  }
  return { Screen, mount, unmount, warm, unread, poll };
})();
window.Chat = Chat;
