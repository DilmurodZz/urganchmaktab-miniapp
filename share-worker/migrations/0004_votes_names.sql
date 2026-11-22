-- group requests: who joined (full name and when), so students and the mentor see the list of names
ALTER TABLE request_votes ADD COLUMN name TEXT;
ALTER TABLE request_votes ADD COLUMN ts INTEGER;
UPDATE request_votes SET name = (SELECT q.name FROM requests q WHERE q.id = request_votes.request_id AND q.uid = request_votes.uid) WHERE name IS NULL;
