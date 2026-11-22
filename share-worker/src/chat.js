// The students' chat: one shared room (a Durable Object with its own SQLite storage).
// Every connection is a WebSocket opened with Telegram's signed initData, checked by the Worker before it reaches here,
// so a message always carries the real Telegram user (first name and photo only). The room keeps the messages and the
// pictures (compressed JPEGs, up to ~600 KB), sends the last 60 on connect and older ones on request, and lets people
// reply, edit and delete their own messages. Admins (ADMIN_IDS) can also delete any message and pin one.
// WebSocket hibernation keeps it free of cost while nobody is typing.
import { DurableObject } from "cloudflare:workers";

const MAX_TEXT = 4000, MAX_IMG = 900_000, PAGE = 60;

export class ChatRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS msgs (id INTEGER PRIMARY KEY AUTOINCREMENT, uid INTEGER, name TEXT, photo TEXT, text TEXT, img INTEGER,
      sticker TEXT, reply INTEGER, edited INTEGER DEFAULT 0, deleted INTEGER DEFAULT 0, ts INTEGER)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS imgs (id INTEGER PRIMARY KEY AUTOINCREMENT, data BLOB, type TEXT)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)`);
    try { this.sql.exec("ALTER TABLE msgs ADD COLUMN mentor TEXT"); } catch {}   // older rooms: add the mentor badge column once
    this.env = env;
    this.admins = String(env.ADMIN_IDS || "").split(",").map((x) => Number(x.trim())).filter(Boolean);
  }

  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/chat/img/")) {
      const id = Number(url.pathname.split("/").pop());
      const row = this.sql.exec("SELECT data, type FROM imgs WHERE id = ?", id).toArray()[0];
      if (!row) return new Response("not found", { status: 404 });
      return new Response(row.data, { headers: { "Content-Type": row.type || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" } });
    }
    if (url.pathname === "/chat/recent") return Response.json({ msgs: this.page(), pin: this.pinned() });
    if (req.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
    const user = JSON.parse(req.headers.get("X-User") || "null");
    if (!user || !user.id) return new Response("unauthorized", { status: 401 });
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    const me = { id: Number(user.id), name: String(user.first_name || "").slice(0, 40) || "Talaba", photo: String(user.photo_url || "").slice(0, 500), admin: this.admins.includes(Number(user.id)) || !!user.mod, mentor: String(user.mentor || "").slice(0, 60), hits: [] };
    pair[1].serializeAttachment(me);
    pair[1].send(JSON.stringify({ t: "hello", me: { id: me.id, admin: me.admin, mentor: me.mentor }, msgs: this.page(), pin: this.pinned(), online: this.ctx.getWebSockets().length }));
    this.broadcast({ t: "online", n: this.ctx.getWebSockets().length });
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  row(m) {
    if (!m) return null;
    const r = m.reply ? this.sql.exec("SELECT id, uid, name, text, img, sticker, deleted FROM msgs WHERE id = ?", m.reply).toArray()[0] : null;
    return { id: m.id, uid: m.uid, name: m.name, photo: m.photo, text: m.deleted ? "" : m.text, img: m.deleted ? null : m.img, sticker: m.deleted ? null : m.sticker,
      edited: !!m.edited, deleted: !!m.deleted, ts: m.ts, mentor: m.mentor || "", 
      reply: r ? { id: r.id, uid: r.uid, name: r.name, text: r.deleted ? "" : (r.text || "").slice(0, 120), img: !r.deleted && !!r.img, sticker: !r.deleted && !!r.sticker } : null };
  }
  get(id) { return this.sql.exec("SELECT * FROM msgs WHERE id = ?", id).toArray()[0]; }
  page(before) {
    const rows = before ? this.sql.exec("SELECT * FROM msgs WHERE id < ? AND deleted = 0 ORDER BY id DESC LIMIT ?", before, PAGE).toArray() : this.sql.exec("SELECT * FROM msgs WHERE deleted = 0 ORDER BY id DESC LIMIT ?", PAGE).toArray();
    return rows.reverse().map((m) => this.row(m));
  }
  pinned() { const v = this.sql.exec("SELECT v FROM meta WHERE k = 'pin'").toArray()[0]; const m = v && this.get(Number(v.v)); return m && !m.deleted ? this.row(m) : null; }
  broadcast(obj, except) { const s = JSON.stringify(obj); for (const ws of this.ctx.getWebSockets()) { if (ws === except) continue; try { ws.send(s); } catch {} } }

  async webSocketMessage(ws, raw) {
    let me = ws.deserializeAttachment(), d;
    try { d = JSON.parse(raw); } catch { return; }
    const err = (e) => ws.send(JSON.stringify({ t: "err", e }));
    if (d.t === "ping") return ws.send('{"t":"pong"}');
    if (d.t === "more") return ws.send(JSON.stringify({ t: "older", msgs: this.page(Number(d.before) || 1) }));
    if (d.t === "typing") return this.broadcast({ t: "typing", uid: me.id, name: me.name }, ws);
    if (d.t === "send") {
      // a few messages a minute at most, so nobody can flood the room
      const now = Date.now(); me.hits = (me.hits || []).filter((x) => now - x < 30000);
      if (me.hits.length >= 15) return err("slow");
      me.hits.push(now); ws.serializeAttachment(me);
      const text = String(d.text || "").slice(0, MAX_TEXT).trim(), sticker = d.sticker ? String(d.sticker).slice(0, 16) : null;
      let img = null;
      if (d.img) {
        const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(d.img));
        if (!m) return err("img");
        const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
        if (bytes.length > MAX_IMG) return err("big");
        img = this.sql.exec("INSERT INTO imgs (data, type) VALUES (?, ?) RETURNING id", bytes, m[1]).one().id;
      }
      if (!text && !img && !sticker) return;
      const reply = d.reply && this.get(Number(d.reply)) ? Number(d.reply) : null;
      const id = this.sql.exec("INSERT INTO msgs (uid, name, photo, text, img, sticker, reply, ts, mentor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
        me.id, me.name, me.photo, text, img, sticker, reply, now, me.mentor || null).one().id;
      // a mentor answering a student's question: the student also hears about it from the bot
      const to = reply && this.get(reply);
      if (me.mentor && to && to.uid !== me.id && this.env.DB) {
        const btn = JSON.stringify({ text: "Chatni ochish", web_app: { url: "https://dilmurodzz.github.io/urganchmaktab-miniapp/#/chat" } });
        try { await this.env.DB.prepare("INSERT INTO outbox (chat, text, btn, created) VALUES (?1, ?2, ?3, ?4)")
          .bind(to.uid, `Mentor ${me.name} chatda savolingizga javob berdi:

${(text || "Rasm").slice(0, 400)}`, btn, now).run(); } catch {}
      }
      const msg = this.row(this.get(id));
      ws.send(JSON.stringify({ t: "msg", m: msg, tmp: d.tmp }));
      return this.broadcast({ t: "msg", m: msg }, ws);
    }
    const m = d.id && this.get(Number(d.id));
    if (!m) return;
    if (d.t === "edit") {
      if (m.uid !== me.id || m.deleted) return err("forbidden");
      const text = String(d.text || "").slice(0, MAX_TEXT).trim(); if (!text && !m.img && !m.sticker) return;
      this.sql.exec("UPDATE msgs SET text = ?, edited = 1 WHERE id = ?", text, m.id);
      return this.broadcast({ t: "upd", m: this.row(this.get(m.id)) });
    }
    if (d.t === "del") {
      if (m.uid !== me.id && !me.admin) return err("forbidden");
      this.sql.exec("UPDATE msgs SET deleted = 1, text = '' WHERE id = ?", m.id);
      if (m.img) this.sql.exec("DELETE FROM imgs WHERE id = ?", m.img);
      this.broadcast({ t: "upd", m: this.row(this.get(m.id)) });
      const p = this.sql.exec("SELECT v FROM meta WHERE k = 'pin'").toArray()[0];
      if (p && Number(p.v) === m.id) { this.sql.exec("DELETE FROM meta WHERE k = 'pin'"); this.broadcast({ t: "pin", m: null }); }
      return;
    }
    if (d.t === "pin" || d.t === "unpin") {
      if (!me.admin) return err("forbidden");
      if (d.t === "pin") this.sql.exec("INSERT INTO meta (k, v) VALUES ('pin', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v", String(m.id));
      else this.sql.exec("DELETE FROM meta WHERE k = 'pin'");
      return this.broadcast({ t: "pin", m: d.t === "pin" ? this.row(this.get(m.id)) : null });
    }
  }
  async webSocketClose(ws) { try { ws.close(); } catch {} this.broadcast({ t: "online", n: Math.max(0, this.ctx.getWebSockets().length - 1) }, ws); }
  async webSocketError(ws) { this.webSocketClose(ws); }
}
