# Urganch maktab Mini App: handoff

A copy of the Ustoz AI Telegram Mini App (v66, 21 Nov 2026), prepared for a teacher's bot.
Start a new Claude Code session in this folder and say: "Read HANDOFF.md and continue building this Mini App."

## What this copy is

- Bot: **@urganchmaktab_bot**. Its token is in `.env` (git-ignored). Never print it, never commit it, never paste it into chat.
  It was pasted in a chat once, so regenerate it in @BotFather (`/revoke`) when convenient and update `.env` and the Worker secret.
- App name shown in the top bar, the first-open intro and the game wall: `APP_NAME` at the top of `public/app.js` (now "Urganch maktab").
- Bot username used in share links: `BOT` in `public/app.js`.
- Removed from the original: the Turon Bank and Ustoz AI logos, the Tanlov section (contest, winners, road map, posters),
  and the Top 20 chegirmalar (discounts) section. The bottom bar now has Asosiy, Kurslar, Vositalar, Profil.
  Home has two tiles: O'yin and Foydali vositalar.

## What is inside (all plain HTML/CSS/JS, no build step)

`public/` is the whole site (served by GitHub Pages):

| File | What it does |
|---|---|
| `index.html` | loads the scripts; every script and CSS has `?v=NN` |
| `sw.js` | offline cache; `CACHE = "maktab-vNN"` |
| `app.js` | router (`ROUTES`), Home, bottom bar, icons (`ICONS`), sheets, share links, start-up |
| `i18n.js`, `i18n-ru.js`, `i18n-en.js` | uz/ru/en; `T("Uzbek text")` looks up the translation, Uzbek is the key |
| `courses.js` + `data/kurslar.json` | Kurslar page (course list, demand, jobs that fit the CV) |
| `kompas.js` | Kasb Kompasi (29-question course finder) |
| `tools.js` | Foydali vositalar list, CV / rezyume / obyektivka maker, job matching |
| `study.js` + `otm.json` + `top300.json` | DTM calculator, IELTS calculator, Top 300 universities, grants guide |
| `news.js` | news ribbon on Foydali vositalar (from the Worker's `/news`) |
| `profile.js` | Profile, statistics, admin section |
| `game.js`, `run-world.js`, `run-audio.js`, `models/`, `music/`, `lib/` | the 3D runner game |
| `duo.js` | two-player game |

`share-worker/` is the Cloudflare Worker (the app's server): initData check, statistics (D1), file sending, admin messages,
news (with Workers AI translation), and the bot's `/start` reply (webhook). `tools/` has data builders (`build_kurslar.py`, `i18n_missing.js`).

## First-time setup (do these once)

1. **GitHub**: create a repository `urganchmaktab-miniapp` under the same account (DilmurodZz), push this folder.
   In Settings > Pages choose "GitHub Actions". `.github/workflows/pages.yml` publishes `public/` on every push to `main`.
   The site will be `https://dilmurodzz.github.io/urganchmaktab-miniapp/` (already set as `APP_URL` in the Worker).
   If the account or repo name differs, change `APP_URL` and `ALLOWED_ORIGIN` in `share-worker/src/index.js`.
2. **Worker** (inside `share-worker/`):
   - `npm install`
   - `npx wrangler kv namespace create COLORS` and put the id into `wrangler.toml`
   - `npx wrangler d1 create urganch-stats`, put the id into `wrangler.toml`, then run `migrations/0001_init.sql`
     (`npx wrangler d1 execute urganch-stats --remote --file migrations/0001_init.sql`)
   - `npx wrangler secret put BOT_TOKEN` and paste the token from `.env` (it is never written into a file in git)
   - set `ADMIN_IDS` in `wrangler.toml` (Telegram user ids of the admins; now only 5199387523) and `CHANNEL` if a channel is used
   - `npx wrangler deploy`. The URL must match `SHARE_API` in `public/app.js` (`https://urganch-share.chorsu-share.workers.dev`).
3. **Bot**: in @BotFather set the menu button / Mini App URL to the GitHub Pages address.
   Then point the bot's webhook to the Worker so `/start` links work (shared sections open with a button):
   `https://api.telegram.org/bot<TOKEN>/setWebhook` with `url = <worker>/tg/<key>`, `secret_token = <key>`,
   where `<key>` = first 32 hex characters of SHA-256 of `"hook:" + TOKEN` (see `hookKey` in the Worker).
   Ask the user before changing the webhook: it changes how the live bot answers.

## Still Ustoz AI specific (change when the teacher decides)

- **Kurslar and Kasb Kompasi** show Ustoz AI platform courses (`data/kurslar.json`, links to ustoz.ai, "Ilovada ochish" opens the Ustoz AI app).
  Replace with the teacher's courses or remove the routes `#/kurslar`, `#/kurs`, `#/kompas`, `#/natija` and the Home banners.
- **Profile** links: Ustoz AI app (Play Store / App Store) and the @ustozai channel (`profile.js`, the links list).
- Texts that mention "Ustoz AI": share texts, the CV footer "Ustoz AI mini ilovasida tayyorlandi", the news caption, the Kompas share text.
  Find them with: `grep -rn "Ustoz AI" public/*.js`.
- The news pins (`NEWS_PINNED` in the Worker) and the hero banner text on Home.
- Colours: the theme picker is in Profile; default colours are the CSS variables at the top of `styles.css`.

## Working rules (keep these)

- All user-facing text in Uzbek Latin, polite "siz" form. No long dashes (— or –), no emojis. Professional line or 3D icons only.
- Every new `T("...")` text gets ru and en translations; check with `node tools/i18n_missing.js` (lists keys without translation).
- After every change: test at phone size (375 x 812) in a local preview (`python -m http.server` in `public/`), then commit, push, and check the live `sw.js`.
- Every deploy bumps **both** `CACHE = "maktab-vNN"` in `sw.js` and every `?v=NN` in `index.html` (now v1).
- Commit with the user's name; never commit `.env`, never print tokens.
- Report plainly what was and was not checked (for example, not tested inside Telegram).
