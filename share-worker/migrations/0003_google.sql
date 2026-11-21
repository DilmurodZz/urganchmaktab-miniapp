-- Google Meet integration: the mentor's connected Google account (refresh token kept encrypted) and each meeting's Meet space
ALTER TABLE mentors ADD COLUMN g_email TEXT;
ALTER TABLE mentors ADD COLUMN g_token TEXT;
ALTER TABLE meetings ADD COLUMN g_space TEXT;
