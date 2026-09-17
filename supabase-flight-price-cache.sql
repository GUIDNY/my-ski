CREATE TABLE IF NOT EXISTS flight_price_cache (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin     text NOT NULL,
  dest       text NOT NULL,
  checkin    date NOT NULL,
  checkout   date NOT NULL,
  price_eur  numeric,
  nonstop    boolean NOT NULL DEFAULT false,
  checked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (origin, dest, checkin, checkout)
);
