-- Garantisce che l'utente Luca sia amministratore.
UPDATE users
SET role = 'ADMIN'
WHERE lower(username) = 'luca';
