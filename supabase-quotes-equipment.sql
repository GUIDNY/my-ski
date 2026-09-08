-- ============================================================
-- Quotes: track whether ski equipment rental was selected
-- (needed so a proposal built later from a saved quote link can
-- show a real equipment price instead of guessing)
-- הרץ פעם אחת ב: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS equipment BOOLEAN NOT NULL DEFAULT false;
