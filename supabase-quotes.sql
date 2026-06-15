-- ============================================================
-- Quotes — short shareable price offers (e.g. /q/נבס-93/a7k2)
-- הרץ פעם אחת ב: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS quotes (
  id             TEXT PRIMARY KEY,                  -- short code, e.g. "a7k2qx"
  apartment_id   UUID REFERENCES apartments(id) ON DELETE SET NULL,
  apartment_name TEXT NOT NULL DEFAULT '',
  checkin        DATE,
  checkout       DATE,
  guests         INTEGER NOT NULL DEFAULT 2,
  nights         INTEGER NOT NULL DEFAULT 1,
  ski_pass       BOOLEAN NOT NULL DEFAULT false,
  transfer       BOOLEAN NOT NULL DEFAULT false,
  cancel         TEXT NOT NULL DEFAULT 'none',
  service        TEXT NOT NULL DEFAULT 'human',
  apt_total      DECIMAL(10,2) NOT NULL DEFAULT 0,
  grand_total    DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on — all reads/writes go through the service-role API routes
-- (/api/quotes), so no anon policies are needed.
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
