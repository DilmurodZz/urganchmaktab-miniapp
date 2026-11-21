// Online meeting: the server side.
// - Mentors are created by an admin; each gets a strong random password (shown to the admin once, stored only as a
//   PBKDF2 hash). The first Telegram account that signs in with it becomes that mentor; an admin can reset it.
// - Mentors schedule public meetings or answer requests; students say "I'm coming", request individual meetings,
//   or start a public request that goes to the mentor once 10 students support it.
// - The mentor can accept a request, propose another time ("tomorrow, not today") or decline; the student confirms.
// - Every notification goes into the outbox; the cron (every minute) sends up to 40 and adds the 1 hour and
//   "starting now" reminders for people who said they are coming.
import { googleReady, createSpace, attendance } from "./google.js";
const enc = new TextEncoder();
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const VOTES_NEEDED = 10, PHOTO_MAX = 450_000;
const LINK_OK = /^https:\/\/(meet\.google\.com|([a-z0-9-]+\.)?zoom\.us|t\.me|telegram\.me|teams\.microsoft\.com|teams\.live\.com|meet\.jit\.si|([a-z0-9-]+\.)?webex\.com)\//i;

async function hashPass(pass, salt) {
  const key = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
  return b64(new Uint8Array(bits));
}
// 18 characters from letters, digits and symbols (no look-alike characters), at least one of each kind
function newPassword() {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "!@#$%&*?+="], all = sets.join("");
  const r = crypto.getRandomValues(new Uint32Array(18));
  const out = sets.map((s, i) => s[r[i] % s.length]);
  for (let i = sets.length; i < 18; i++) out.push(all[r[i] % all.length]);
  for (let i = out.length - 1; i > 0; i--) { const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out.join("");
}
const strong = (p) => typeof p === "string" && p.length >= 12 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);
const clip = (s, n) => String(s || "").trim().slice(0, n);

export async function meet(req, env, url, origin, { json, verifyInitData, tg, APP_URL }) {
  const path = url.pathname.slice(5);   // after "/meet"
  if (path.startsWith("/photo/") && req.method === "GET") {
    const v = await env.COLORS.get("mphoto:" + Number(path.split("/")[2]), { type: "arrayBuffer" });
    return v ? new Response(v, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=604800", "Access-Control-Allow-Origin": "*" } }) : new Response("no photo", { status: 404 });
  }
  if (req.method !== "POST") return json({ error: "method" }, 405, origin);
  const user = await verifyInitData(req.headers.get("X-Init-Data"), env.BOT_TOKEN, 7 * 86400);
  if (!user || !user.id) return json({ error: "unauthorised" }, 401, origin);
  const uid = Number(user.id), name = clip(user.first_name, 40) || "Talaba";
  const body = await req.json().catch(() => ({}));
  const DB = env.DB, now = Date.now();
  const admins = String(env.ADMIN_IDS || "").split(",").map((x) => Number(x.trim()));
  const isAdmin = admins.includes(uid);
  const one = (sql, ...a) => DB.prepare(sql).bind(...a).first();
  const all = async (sql, ...a) => (await DB.prepare(sql).bind(...a).all()).results;
  const run = (sql, ...a) => DB.prepare(sql).bind(...a).run();
  const meMentor = await one("SELECT * FROM mentors WHERE tg_id = ?1 AND active = 1", uid);
  const ok = (x = {}) => json({ ok: true, ...x }, 200, origin), bad = (e, s = 400) => json({ error: e }, s, origin);
  const pubMentor = (m) => m && { id: m.id, name: m.name, uni: m.uni, field: m.field, bio: m.bio, photo: m.photo, bound: !!m.tg_id };
  const btn = (key, t) => JSON.stringify({ text: t, web_app: { url: APP_URL + "?shared=" + key } });
  const notify = (chat, text, key, t = "Ochish") => run("INSERT INTO outbox (chat, text, btn, created) VALUES (?1, ?2, ?3, ?4)", chat, text, key ? btn(key, t) : null, now);
  const when = (ms) => new Date(ms + 5 * 3600e3).toISOString().replace("T", " ").slice(0, 16) + " (Toshkent)";
  async function publishAll(m, mentor) {
    // a new public meeting: every user the bot can write to hears about it (sent by the cron, 40 a minute)
    const text = `Yangi online uchrashuv!\n\n${mentor.name}${mentor.uni ? ", " + mentor.uni : ""}\nMavzu: ${m.topic}\nVaqt: ${when(m.starts)}\n\nAlumni Mentor ilovasida "Qatnashaman" tugmasini bosing, boshlanishidan oldin eslatamiz.`;
    await run("INSERT INTO outbox (chat, text, btn, created) SELECT id, ?1, ?2, ?3 FROM users WHERE blocked = 0", text, btn("m_" + m.id, "Uchrashuvni ochish"), now);
  }
  async function createMeeting(o, mentor) {
    const r = await one(`INSERT INTO meetings (mentor_id, kind, topic, about, starts, dur, link, for_uid, request_id, g_space, created) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11) RETURNING *`,
      mentor.id, o.kind, o.topic, o.about || "", o.starts, o.dur, o.link, o.forUid || null, o.requestId || null, o.space || null, now);
    if (r.kind === "public") await publishAll(r, mentor);
    else if (r.for_uid) await notify(r.for_uid, `Shaxsiy uchrashuvingiz tasdiqlandi!\n\nMentor: ${mentor.name}\nMavzu: ${r.topic}\nVaqt: ${when(r.starts)}`, "m_" + r.id, "Uchrashuvni ochish");
    return r;
  }
  // the Meet link: made by Google for the mentor (body.auto) or pasted by hand
  async function meetLink(body) {
    if (body.auto && googleReady(env) && meMentor && meMentor.g_token) return createSpace(env, meMentor);
    return { link: clip(body.link, 300), space: null };
  }
  const checkTime = (s, d) => Number.isFinite(s) && s > now - 3600e3 && s < now + 120 * 864e5 && [30, 45, 60, 90, 120].includes(d);

  /* ---------- everything the screen needs, in one call ---------- */
  if (path === "/state") {
    const mentors = (await all("SELECT * FROM mentors WHERE active = 1 ORDER BY name")).map(pubMentor);
    const meetings = await all(`SELECT m.*, (SELECT COUNT(*) FROM rsvps r WHERE r.meeting_id = m.id) going FROM meetings m
      WHERE m.status = 'scheduled' AND m.starts + m.dur * 60000 > ?1 AND (m.kind = 'public' OR m.for_uid = ?2 OR m.mentor_id = ?3) ORDER BY m.starts LIMIT 60`, now, uid, meMentor ? meMentor.id : -1);
    const going = (await all("SELECT meeting_id FROM rsvps WHERE uid = ?1", uid)).map((r) => r.meeting_id);
    const reqs = await all(`SELECT q.*, (SELECT COUNT(*) FROM request_votes v WHERE v.request_id = q.id) votes,
      EXISTS (SELECT 1 FROM request_votes v WHERE v.request_id = q.id AND v.uid = ?1) voted FROM requests q
      WHERE (q.uid = ?1 AND q.created > ?3) OR (q.kind = 'public' AND q.status IN ('open', 'ready', 'proposed')) OR (q.mentor_id = ?2 AND q.status IN ('open', 'ready', 'proposed') AND (q.kind = 'individual' OR q.status != 'open'))
      ORDER BY q.created DESC LIMIT 80`, uid, meMentor ? meMentor.id : -1, now - 30 * 864e5);
    const me = { uid, admin: isAdmin, mentor: meMentor ? { ...pubMentor(meMentor), google: meMentor.g_token ? meMentor.g_email || "Google" : null } : null, googleReady: googleReady(env) };
    meetings.forEach((m) => { m.attend = !!m.g_space && meMentor && m.mentor_id === meMentor.id; delete m.g_space; });
    return ok({ me, mentors, meetings, going, requests: reqs, need: VOTES_NEEDED });
  }

  /* ---------- mentor sign-in and profile ---------- */
  if (path === "/mentor/login") {
    const tries = Number(await env.COLORS.get("mlogin:" + uid)) || 0;
    if (tries >= 6) return bad("too_many", 429);
    const pass = String(body.pass || "");
    for (const m of await all("SELECT * FROM mentors WHERE active = 1")) {
      if ((await hashPass(pass, unb64(m.pass_salt))) !== m.pass_hash) continue;
      if (m.tg_id && m.tg_id !== uid) return bad("bound", 403);
      const other = await one("SELECT id FROM mentors WHERE tg_id = ?1 AND id != ?2", uid, m.id);
      if (other) return bad("already_mentor", 409);
      await run("UPDATE mentors SET tg_id = ?1 WHERE id = ?2", uid, m.id);
      await env.COLORS.delete("mlogin:" + uid);
      return ok({ mentor: pubMentor({ ...m, tg_id: uid }) });
    }
    await env.COLORS.put("mlogin:" + uid, String(tries + 1), { expirationTtl: 900 });
    return bad("wrong", 403);
  }
  if (path === "/mentor/profile") {
    if (!meMentor) return bad("not_mentor", 403);
    let photo = meMentor.photo;
    if (body.photo) {
      const m = /^data:image\/jpeg;base64,(.+)$/.exec(String(body.photo)); if (!m) return bad("photo");
      const bytes = unb64(m[1]); if (bytes.length > PHOTO_MAX) return bad("photo_big");
      await env.COLORS.put("mphoto:" + meMentor.id, bytes); photo = now;
    }
    if (!photo) return bad("photo_required");
    await run("UPDATE mentors SET name = ?1, uni = ?2, field = ?3, bio = ?4, photo = ?5 WHERE id = ?6",
      clip(body.name, 60) || meMentor.name, clip(body.uni, 80), clip(body.field, 80), clip(body.bio, 600), photo, meMentor.id);
    return ok({ mentor: pubMentor(await one("SELECT * FROM mentors WHERE id = ?1", meMentor.id)) });
  }
  if (path === "/mentor/password") {
    if (!meMentor) return bad("not_mentor", 403);
    if ((await hashPass(String(body.old || ""), unb64(meMentor.pass_salt))) !== meMentor.pass_hash) return bad("wrong", 403);
    if (!strong(body.pass)) return bad("weak");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    await run("UPDATE mentors SET pass_hash = ?1, pass_salt = ?2 WHERE id = ?3", await hashPass(body.pass, salt), b64(salt), meMentor.id);
    return ok();
  }
  /* ---------- Google Meet: connect, disconnect, attendance ---------- */
  if (path === "/google/ticket") {
    if (!meMentor) return bad("not_mentor", 403);
    if (!googleReady(env)) return bad("google_off");
    const t = b64(crypto.getRandomValues(new Uint8Array(18))).replace(/[+/=]/g, "");
    await env.COLORS.put("gticket:" + t, String(meMentor.id), { expirationTtl: 300 });
    return ok({ url: url.origin + "/google/start?t=" + t });
  }
  if (path === "/google/disconnect") { if (meMentor) await run("UPDATE mentors SET g_token = NULL, g_email = NULL WHERE id = ?1", meMentor.id); return ok(); }
  if (path === "/attendance") {
    const m = await one("SELECT * FROM meetings WHERE id = ?1", Number(body.id));
    if (!m || !meMentor || m.mentor_id !== meMentor.id) return bad("forbidden", 403);
    if (!m.g_space) return bad("no_space");
    try { return ok(await attendance(env, meMentor, m.g_space)); } catch (e) { return bad(e.message); }
  }
  if (path === "/mentor/logout") { if (meMentor) await run("UPDATE mentors SET tg_id = NULL WHERE id = ?1", meMentor.id); return ok(); }

  /* ---------- meetings ---------- */
  if (path === "/create") {
    if (!meMentor) return bad("not_mentor", 403);
    if (!meMentor.photo) return bad("photo_required");
    const o = { kind: "public", topic: clip(body.topic, 120), about: clip(body.about, 800), starts: Number(body.starts), dur: Number(body.dur) };
    if (!o.topic || !checkTime(o.starts, o.dur)) return bad("fields");
    try { Object.assign(o, await meetLink(body)); } catch (e) { return bad(e.message); }
    if (!LINK_OK.test(o.link)) return bad("link");
    return ok({ meeting: await createMeeting(o, meMentor) });
  }
  if (path === "/cancel") {
    const m = await one("SELECT * FROM meetings WHERE id = ?1", Number(body.id)); if (!m) return bad("none", 404);
    if (!(meMentor && m.mentor_id === meMentor.id) && !isAdmin) return bad("forbidden", 403);
    await run("UPDATE meetings SET status = 'cancelled' WHERE id = ?1", m.id);
    await run("INSERT INTO outbox (chat, text, btn, created) SELECT uid, ?1, NULL, ?2 FROM rsvps WHERE meeting_id = ?3", `Uchrashuv bekor qilindi: ${m.topic} (${when(m.starts)}).`, now, m.id);
    if (m.for_uid) await notify(m.for_uid, `Uchrashuv bekor qilindi: ${m.topic} (${when(m.starts)}).`);
    return ok();
  }
  if (path === "/rsvp") {
    const m = await one("SELECT * FROM meetings WHERE id = ?1 AND status = 'scheduled'", Number(body.id)); if (!m) return bad("none", 404);
    if (body.on) await run("INSERT OR IGNORE INTO rsvps (meeting_id, uid, name, created) VALUES (?1, ?2, ?3, ?4)", m.id, uid, name, now);
    else await run("DELETE FROM rsvps WHERE meeting_id = ?1 AND uid = ?2", m.id, uid);
    return ok();
  }

  /* ---------- requests ---------- */
  if (path === "/request") {
    const mentor = await one("SELECT * FROM mentors WHERE id = ?1 AND active = 1", Number(body.mentorId)); if (!mentor) return bad("none", 404);
    const kind = body.kind === "public" ? "public" : "individual", topic = clip(body.topic, 120); if (!topic) return bad("fields");
    const open = await one("SELECT COUNT(*) n FROM requests WHERE uid = ?1 AND status IN ('open', 'ready', 'proposed')", uid);
    if (open.n >= 5) return bad("too_many", 429);
    const pref = Number(body.pref) || null;
    const r = await one("INSERT INTO requests (kind, mentor_id, uid, name, topic, note, pref, created) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) RETURNING id",
      kind, mentor.id, uid, name, topic, clip(body.note, 600), pref, now);
    if (kind === "public") await run("INSERT INTO request_votes (request_id, uid) VALUES (?1, ?2)", r.id, uid);
    else if (mentor.tg_id) await notify(mentor.tg_id, `Yangi shaxsiy uchrashuv so'rovi\n\n${name}: ${topic}${pref ? "\nQulay vaqt: " + when(pref) : ""}`, "r_" + r.id, "So'rovni ochish");
    return ok({ id: r.id });
  }
  if (path === "/vote") {
    const q = await one("SELECT * FROM requests WHERE id = ?1 AND kind = 'public' AND status = 'open'", Number(body.id)); if (!q) return bad("none", 404);
    await run("INSERT OR IGNORE INTO request_votes (request_id, uid) VALUES (?1, ?2)", q.id, uid);
    const n = (await one("SELECT COUNT(*) n FROM request_votes WHERE request_id = ?1", q.id)).n;
    if (n >= VOTES_NEEDED) {
      await run("UPDATE requests SET status = 'ready' WHERE id = ?1 AND status = 'open'", q.id);
      const mentor = await one("SELECT * FROM mentors WHERE id = ?1", q.mentor_id);
      if (mentor && mentor.tg_id) await notify(mentor.tg_id, `${n} ta talaba siz bilan ommaviy uchrashuv so'ramoqda!\n\nMavzu: ${q.topic}`, "r_" + q.id, "So'rovni ochish");
    }
    return ok({ votes: n });
  }
  if (path === "/respond") {
    if (!meMentor) return bad("not_mentor", 403);
    const q = await one("SELECT * FROM requests WHERE id = ?1 AND mentor_id = ?2", Number(body.id), meMentor.id); if (!q) return bad("none", 404);
    if (!(q.status === "open" && q.kind === "individual") && q.status !== "ready" && q.status !== "proposed") return bad("state");
    const askers = q.kind === "public" ? (await all("SELECT uid FROM request_votes WHERE request_id = ?1", q.id)).map((r) => r.uid) : [q.uid];
    if (body.action === "decline") {
      await run("UPDATE requests SET status = 'declined', p_note = ?1 WHERE id = ?2", clip(body.note, 300), q.id);
      for (const u of askers) await notify(u, `Mentor ${meMentor.name} hozircha "${q.topic}" uchrashuvini o'tkaza olmaydi.${body.note ? "\nIzoh: " + clip(body.note, 300) : ""}`);
      return ok();
    }
    const s = Number(body.starts), d = Number(body.dur) || 60;
    if (!checkTime(s, d)) return bad("fields");
    let made; try { made = await meetLink(body); } catch (e) { return bad(e.message); }
    const link = made.link; if (!LINK_OK.test(link)) return bad("link");
    if (!meMentor.photo) return bad("photo_required");
    if (body.action === "accept") {
      const m = await createMeeting({ kind: q.kind, topic: q.topic, about: q.note, starts: s, dur: d, link, space: made.space, forUid: q.kind === "individual" ? q.uid : null, requestId: q.id }, meMentor);
      await run("UPDATE requests SET status = 'accepted', meeting_id = ?1 WHERE id = ?2", m.id, q.id);
      if (q.kind === "public") for (const u of askers) await run("INSERT OR IGNORE INTO rsvps (meeting_id, uid, created) VALUES (?1, ?2, ?3)", m.id, u, now);
      return ok({ meeting: m });
    }
    if (body.action === "propose") {
      await run("UPDATE requests SET status = 'proposed', p_starts = ?1, p_dur = ?2, p_link = ?3, p_note = ?4 WHERE id = ?5", s, d, link, clip(body.note, 300), q.id);
      if (made.space) await env.COLORS.put("pspace:" + q.id, made.space, { expirationTtl: 120 * 86400 });
      await notify(q.uid, `Mentor ${meMentor.name} boshqa vaqt taklif qildi\n\nMavzu: ${q.topic}\nTaklif: ${when(s)}${body.note ? "\nIzoh: " + clip(body.note, 300) : ""}\n\nIlovada tasdiqlang yoki rad eting.`, "r_" + q.id, "Javob berish");
      return ok();
    }
    return bad("action");
  }
  if (path === "/answer") {
    const q = await one("SELECT * FROM requests WHERE id = ?1 AND uid = ?2 AND status = 'proposed'", Number(body.id), uid); if (!q) return bad("none", 404);
    const mentor = await one("SELECT * FROM mentors WHERE id = ?1", q.mentor_id);
    if (body.ok) {
      const space = await env.COLORS.get("pspace:" + q.id);
      const m = await createMeeting({ kind: q.kind, topic: q.topic, about: q.note, starts: q.p_starts, dur: q.p_dur || 60, link: q.p_link, space, forUid: q.kind === "individual" ? q.uid : null, requestId: q.id }, mentor);
      await run("UPDATE requests SET status = 'accepted', meeting_id = ?1 WHERE id = ?2", m.id, q.id);
      if (q.kind === "public") await run("INSERT OR IGNORE INTO rsvps (meeting_id, uid, created) SELECT ?1, uid, ?2 FROM request_votes WHERE request_id = ?3", m.id, now, q.id);
      if (mentor.tg_id) await notify(mentor.tg_id, `${name} taklifingizni tasdiqladi: ${q.topic}, ${when(q.p_starts)}.`, "m_" + m.id, "Uchrashuvni ochish");
      return ok({ meeting: m });
    }
    await run("UPDATE requests SET status = 'declined' WHERE id = ?1", q.id);
    if (mentor.tg_id) await notify(mentor.tg_id, `${name} taklif qilingan vaqtni rad etdi: ${q.topic}.`);
    return ok();
  }

  /* ---------- admin: mentor accounts ---------- */
  if (path.startsWith("/admin/")) {
    if (!isAdmin) return bad("forbidden", 403);
    if (path === "/admin/mentors") return ok({ mentors: (await all("SELECT * FROM mentors ORDER BY active DESC, name")).map((m) => ({ ...pubMentor(m), active: !!m.active })) });
    if (path === "/admin/add" || path === "/admin/reset") {
      const pass = newPassword(), salt = crypto.getRandomValues(new Uint8Array(16)), h = await hashPass(pass, salt);
      if (path === "/admin/add") {
        const nm = clip(body.name, 60); if (!nm) return bad("fields");
        const r = await one("INSERT INTO mentors (name, uni, field, pass_hash, pass_salt, created) VALUES (?1, ?2, ?3, ?4, ?5, ?6) RETURNING id", nm, clip(body.uni, 80), clip(body.field, 80), h, b64(salt), now);
        return ok({ id: r.id, password: pass });
      }
      await run("UPDATE mentors SET pass_hash = ?1, pass_salt = ?2, tg_id = NULL, active = 1 WHERE id = ?3", h, b64(salt), Number(body.id));
      return ok({ password: pass });
    }
    if (path === "/admin/remove") { await run("UPDATE mentors SET active = 0, tg_id = NULL WHERE id = ?1", Number(body.id)); return ok(); }
  }
  return bad("not found", 404);
}

// the cron: reminders, then up to 40 queued messages a minute (well inside Telegram's limits)
export async function meetCron(env, { tg, APP_URL }) {
  const now = Date.now(), DB = env.DB;
  const btn = (key, t) => JSON.stringify({ text: t, web_app: { url: APP_URL + "?shared=" + key } });
  const soon = (await DB.prepare("SELECT * FROM meetings WHERE status = 'scheduled' AND remind < 2 AND starts - ?1 < 3600000 AND starts + 600000 > ?1").bind(now).all()).results;
  for (const m of soon) {
    const stage = m.starts - now <= 5 * 60000 ? 2 : 1;
    if (stage <= m.remind) continue;
    const text = stage === 2 ? `Uchrashuv boshlanmoqda: ${m.topic}\n\nHavola: ${m.link}` : `1 soatdan keyin uchrashuv: ${m.topic}\n\nHavola: ${m.link}`;
    await DB.prepare("INSERT INTO outbox (chat, text, btn, created) SELECT uid, ?1, ?2, ?3 FROM rsvps WHERE meeting_id = ?4").bind(text, btn("m_" + m.id, "Uchrashuvni ochish"), now, m.id).run();
    if (m.for_uid) await DB.prepare("INSERT INTO outbox (chat, text, btn, created) VALUES (?1, ?2, ?3, ?4)").bind(m.for_uid, text, btn("m_" + m.id, "Uchrashuvni ochish"), now).run();
    const mentor = await DB.prepare("SELECT tg_id FROM mentors WHERE id = ?1").bind(m.mentor_id).first();
    if (mentor && mentor.tg_id) await DB.prepare("INSERT INTO outbox (chat, text, btn, created) VALUES (?1, ?2, ?3, ?4)").bind(mentor.tg_id, "Siz uchun eslatma. " + text, btn("m_" + m.id, "Uchrashuvni ochish"), now).run();
    await DB.prepare("UPDATE meetings SET remind = ?1 WHERE id = ?2").bind(stage, m.id).run();
  }
  const out = (await DB.prepare("SELECT * FROM outbox ORDER BY id LIMIT 40").all()).results;
  for (const o of out) {
    try {
      await tg(env.BOT_TOKEN, "sendMessage", JSON.stringify({ chat_id: o.chat, text: o.text, disable_web_page_preview: true, ...(o.btn ? { reply_markup: { inline_keyboard: [[JSON.parse(o.btn)]] } } : {}) }));
    } catch (e) {
      if (/blocked|deactivated|chat not found|can't initiate/i.test(String(e.message))) await DB.prepare("UPDATE users SET blocked = 1 WHERE id = ?1").bind(o.chat).run();
    }
    await DB.prepare("DELETE FROM outbox WHERE id = ?1").bind(o.id).run();
  }
}
