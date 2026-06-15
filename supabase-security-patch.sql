-- ============================================================
-- Security Patch: Fix Supabase Security Advisor issues
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Fix Error: Enable RLS on transfers
-- (all writes go through service-role API routes, so no anon policies needed)
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Fix Warning: Drop always-true INSERT policy on bookings
-- (bookings are inserted via /api/bookings which uses service role, bypassing RLS)
DROP POLICY IF EXISTS "bookings_public_insert" ON public.bookings;

-- Fix Warnings: Drop all always-true policies on admin-only tables
-- (these tables are accessed exclusively via service-role API routes)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('availability_blocks', 'pricing_rules', 'ical_sources')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;
