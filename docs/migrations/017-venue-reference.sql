-- Referência de local (ponto de encontro, referência visual) para eventos presenciais
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_reference text;
