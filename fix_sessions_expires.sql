UPDATE sessions
SET expires_at = datetime('now', '+7 days')
WHERE expires_at IS NULL;
