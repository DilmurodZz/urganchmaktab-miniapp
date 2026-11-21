// Google Meet for mentors: sign in with Google once, then every scheduled meeting gets its Meet link created
// automatically (Meet REST API, spaces.create), and after the meeting the mentor can see who joined and for how long.
// Scopes: openid + email (to show which account is connected) and meetings.space.created (only spaces this app creates).
// The refresh token is stored encrypted (AES-GCM, key derived from GOOGLE_CLIENT_SECRET) and never leaves the server.
// Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (wrangler secrets); without them the app keeps the manual link flow.
const SCOPES = "openid email https://www.googleapis.com/auth/meetings.space.created";
const enc = new TextEncoder(), dec = new TextDecoder();
const b64u = (u8) => btoa(String.fromCharCode(...u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
export const googleReady = (env) => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
const redirect = (url) => url.origin + "/google/callback";

async function key(env) {
  const raw = await crypto.subtle.digest("SHA-256", enc.encode("am-google:" + env.GOOGLE_CLIENT_SECRET));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function seal(env, text) { const iv = crypto.getRandomValues(new Uint8Array(12)); const c = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(env), enc.encode(text))); return b64u(iv) + "." + b64u(c); }
async function open(env, s) { const [iv, c] = s.split("."); return dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64u(iv) }, await key(env), unb64u(c))); }

const page = (title, text, ok) => new Response(`<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#F7F3EE;color:#111}main{max-width:360px;margin:24px;padding:28px;border-radius:24px;background:#fff;text-align:center;box-shadow:0 12px 30px -16px rgba(0,0,0,.3)}
b{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 14px;border-radius:50%;font-size:30px;color:#fff;background:${ok ? "#165936" : "#8B0920"}}h1{font-size:20px;margin:0 0 8px}p{color:#555;line-height:1.5}a{display:inline-block;margin-top:14px;padding:12px 20px;border-radius:999px;background:#8B0920;color:#fff;text-decoration:none;font-weight:600}</style></head>
<body><main><b>${ok ? "&#10003;" : "!"}</b><h1>${title}</h1><p>${text}</p><a href="https://t.me/urganchmaktab_bot">Telegramga qaytish</a></main></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });

// GET /google/start?t=<one-time ticket>: the mini app opens this in the phone's browser (Google refuses sign-in inside app web views)
// GET /google/callback: Google sends the user back here with a code
export async function googleRoutes(req, env, url) {
  if (!googleReady(env)) return page("Hali sozlanmagan", "Google ulanishi hali yoqilmagan. Admin bilan bog'laning.", false);
  if (url.pathname === "/google/start") {
    const t = url.searchParams.get("t") || "", mentorId = await env.COLORS.get("gticket:" + t);
    if (!mentorId) return page("Havola eskirgan", "Ilovaga qaytib, \"Google bilan ulash\" tugmasini qayta bosing.", false);
    await env.COLORS.delete("gticket:" + t);
    const state = b64u(crypto.getRandomValues(new Uint8Array(18)));
    await env.COLORS.put("gstate:" + state, mentorId, { expirationTtl: 900 });
    const q = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirect(url), response_type: "code", scope: SCOPES, access_type: "offline", prompt: "consent", include_granted_scopes: "true", state });
    return Response.redirect("https://accounts.google.com/o/oauth2/v2/auth?" + q, 302);
  }
  if (url.pathname === "/google/callback") {
    const state = url.searchParams.get("state") || "", mentorId = await env.COLORS.get("gstate:" + state);
    if (!mentorId) return page("Havola eskirgan", "Ilovaga qaytib, qayta urinib ko'ring.", false);
    await env.COLORS.delete("gstate:" + state);
    if (url.searchParams.get("error")) return page("Ulanmadi", "Google ruxsat bermadi. Ilovaga qaytib, qayta urinib ko'ring.", false);
    const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: url.searchParams.get("code") || "", client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirect(url), grant_type: "authorization_code" }) });
    const j = await r.json().catch(() => ({}));
    if (!j.refresh_token) return page("Ulanmadi", "Google kalit bermadi. Ilovaga qaytib, qayta urinib ko'ring.", false);
    if (!String(j.scope || "").includes("meetings.space.created")) return page("Ruxsat yetarli emas", "Google Meet uchrashuvi yaratishga ruxsat belgilanmagan. Qayta urinib, barcha ruxsatlarni belgilang.", false);
    let email = "";
    try { email = JSON.parse(new TextDecoder().decode(unb64u(j.id_token.split(".")[1]))).email || ""; } catch {}
    await env.DB.prepare("UPDATE mentors SET g_email = ?1, g_token = ?2 WHERE id = ?3").bind(email, await seal(env, j.refresh_token), Number(mentorId)).run();
    return page("Google Meet ulandi!", `${email} akkaunti ulandi. Endi uchrashuv rejalashtirganingizda Google Meet havolasi avtomatik yaratiladi.`, true);
  }
  return new Response("not found", { status: 404 });
}

async function accessToken(env, mentor) {
  if (!mentor.g_token) throw new Error("google_not_connected");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: await open(env, mentor.g_token), client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, grant_type: "refresh_token" }) });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) {
    // the mentor revoked access, or the token expired (7 days while the Google app is in "Testing")
    if (j.error === "invalid_grant") await env.DB.prepare("UPDATE mentors SET g_token = NULL WHERE id = ?1").bind(mentor.id).run();
    throw new Error("google_reconnect");
  }
  return j.access_token;
}
// a new Meet space; anyone with the link can join without waiting to be let in (if the account allows it)
export async function createSpace(env, mentor) {
  const tok = await accessToken(env, mentor);
  const make = (body) => fetch("https://meet.googleapis.com/v2/spaces", { method: "POST", headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  let r = await make({ config: { accessType: "OPEN", entryPointAccess: "ALL" } });
  if (!r.ok) r = await make({});
  const j = await r.json().catch(() => ({}));
  if (!j.meetingUri) throw new Error("google_failed");
  return { link: j.meetingUri, space: j.name };
}
// who joined a meeting and for how long (all sessions of that space)
export async function attendance(env, mentor, space) {
  const tok = await accessToken(env, mentor), H = { Authorization: "Bearer " + tok };
  const recs = await (await fetch("https://meet.googleapis.com/v2/conferenceRecords?filter=" + encodeURIComponent(`space.name = "${space}"`), { headers: H })).json();
  const people = {};
  for (const rec of recs.conferenceRecords || []) {
    let pageToken = "";
    do {
      const p = await (await fetch(`https://meet.googleapis.com/v2/${rec.name}/participants?pageSize=100${pageToken ? "&pageToken=" + pageToken : ""}`, { headers: H })).json();
      for (const x of p.participants || []) {
        const name = (x.signedinUser && x.signedinUser.displayName) || (x.anonymousUser && x.anonymousUser.displayName) || (x.phoneUser && x.phoneUser.displayName) || "Mehmon";
        const mins = Math.max(0, Math.round(((x.latestEndTime ? Date.parse(x.latestEndTime) : Date.now()) - Date.parse(x.earliestStartTime)) / 60000));
        people[name] = (people[name] || 0) + mins;
      }
      pageToken = p.nextPageToken || "";
    } while (pageToken);
  }
  return { sessions: (recs.conferenceRecords || []).length, people: Object.entries(people).map(([name, mins]) => ({ name, mins })).sort((a, b) => b.mins - a.mins) };
}
