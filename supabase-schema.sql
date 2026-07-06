-- ============================================
-- BLACK BULL RUN — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Leaderboard table
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  twitter_handle TEXT,
  distance BIGINT NOT NULL DEFAULT 0,
  play_duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_distance 
  ON public.leaderboard (distance DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_wallet 
  ON public.leaderboard (wallet_address);

-- Enable Row Level Security
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Anyone can read the leaderboard
CREATE POLICY "Public read access" ON public.leaderboard
  FOR SELECT USING (true);

-- Allow inserts (will be further protected by API-level checks)
CREATE POLICY "Allow score inserts" ON public.leaderboard
  FOR INSERT WITH CHECK (true);

-- No updates or deletes from client
-- Admin can manage via Supabase dashboard with service role
