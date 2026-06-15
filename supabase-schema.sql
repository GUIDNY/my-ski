-- ============================================================
-- MySki Database Schema
-- הרץ את זה ב: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Apartments
CREATE TABLE IF NOT EXISTS apartments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'דירה',
  beds INTEGER NOT NULL DEFAULT 2,
  baths INTEGER NOT NULL DEFAULT 1,
  sqm INTEGER NOT NULL DEFAULT 60,
  price_per_night DECIMAL(10,2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ski passes
CREATE TABLE IF NOT EXISTS ski_passes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'adult',
  available BOOLEAN DEFAULT true
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id UUID REFERENCES apartments(id) ON DELETE SET NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 2,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  add_ons JSONB DEFAULT '{}',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Sample data — דוגמה להתחלה
-- ============================================================

INSERT INTO apartments (name, type, beds, baths, sqm, price_per_night, images, amenities, description) VALUES
  ('Chalet Blanc', 'שאלה פרטי', 6, 3, 180, 1200, ARRAY['/apt1.jpg'], ARRAY['ג''קוזי','אח','נוף להרים','מטבח מאובזר'], 'שאלה יוקרתי עם נוף פנורמי להרים'),
  ('Studio Alpine', 'סטודיו זוגי', 1, 1, 45, 320, ARRAY['/apt2.jpg'], ARRAY['מרפסת','WiFi','נוף להרים'], 'סטודיו נעים ומעוצב לזוגות'),
  ('Penthouse Summit', 'פנטהאוס', 8, 4, 280, 2100, ARRAY['/apt3.jpg'], ARRAY['ג''קוזי','אח','גג פנורמי','חניה','יין'], 'הפנטהאוס המפואר ביותר ב-Val Thorens');

INSERT INTO ski_passes (name, duration_days, price, type) VALUES
  ('יומי — מבוגר', 1, 65, 'adult'),
  ('3 ימים — מבוגר', 3, 175, 'adult'),
  ('שבועי — מבוגר', 7, 380, 'adult'),
  ('יומי — ילד', 1, 45, 'child'),
  ('שבועי — ילד', 7, 260, 'child');

-- ============================================================
-- RLS (Row Level Security) — חשוב לאבטחה
-- כל הכתיבה/קריאה מהאדמין עוברת דרך service role (מתעלם מ-RLS)
-- RLS חוסם גישה ישירה דרך anon key לטבלאות רגישות
-- ============================================================

ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ski_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ical_sources ENABLE ROW LEVEL SECURITY;

-- כולם יכולים לקרוא דירות זמינות
CREATE POLICY "apartments_public_read" ON apartments
  FOR SELECT USING (available = true);

-- כולם יכולים לקרוא סקי פס זמינים
CREATE POLICY "ski_passes_public_read" ON ski_passes
  FOR SELECT USING (available = true);

-- הזמנות, העברות, availability, pricing, ical — גישה דרך service role בלבד
-- אין צורך ב-anon policies; ה-API routes משתמשות ב-SUPABASE_SERVICE_ROLE_KEY
