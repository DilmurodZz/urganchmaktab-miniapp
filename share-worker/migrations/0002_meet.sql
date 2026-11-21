-- Online meeting: mentors, their meetings, who is coming, meeting requests and the bot's outgoing messages
CREATE TABLE IF NOT EXISTS mentors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tg_id INTEGER UNIQUE,                 -- the Telegram account that signed in with the password (NULL until then)
  name TEXT NOT NULL, uni TEXT, field TEXT, bio TEXT,
  photo INTEGER DEFAULT 0,              -- photo version (0 = no photo yet); the picture is in KV "mphoto:<id>"
  pass_hash TEXT NOT NULL, pass_salt TEXT NOT NULL,
  active INTEGER DEFAULT 1, created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentor_id INTEGER NOT NULL, kind TEXT NOT NULL,       -- 'public' | 'individual'
  topic TEXT NOT NULL, about TEXT, starts INTEGER NOT NULL, dur INTEGER NOT NULL,
  link TEXT NOT NULL, status TEXT DEFAULT 'scheduled',  -- 'scheduled' | 'cancelled'
  for_uid INTEGER, request_id INTEGER, remind INTEGER DEFAULT 0, created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS meetings_starts ON meetings(starts);
CREATE TABLE IF NOT EXISTS rsvps (meeting_id INTEGER NOT NULL, uid INTEGER NOT NULL, name TEXT, created INTEGER, PRIMARY KEY (meeting_id, uid));
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL, mentor_id INTEGER NOT NULL, uid INTEGER NOT NULL, name TEXT,
  topic TEXT NOT NULL, note TEXT, pref INTEGER,
  status TEXT DEFAULT 'open',          -- 'open' | 'ready' (public, 10 votes) | 'proposed' | 'accepted' | 'declined'
  p_starts INTEGER, p_note TEXT, p_link TEXT, p_dur INTEGER, meeting_id INTEGER, created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS request_votes (request_id INTEGER NOT NULL, uid INTEGER NOT NULL, PRIMARY KEY (request_id, uid));
CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, chat INTEGER NOT NULL, text TEXT NOT NULL, btn TEXT, created INTEGER);
