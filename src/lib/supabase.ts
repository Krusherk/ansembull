import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface LeaderboardEntry {
  id: string;
  wallet_address: string;
  twitter_handle: string | null;
  distance: number;
  play_duration_seconds: number;
  created_at: string;
}

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabaseInstance && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseInstance;
}

export async function fetchLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('distance', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return data || [];
}

export async function submitScore(params: {
  walletAddress: string;
  twitterHandle: string | null;
  distance: number;
  playDuration: number;
}): Promise<{ success: boolean; rank?: number; error?: string }> {
  try {
    const response = await fetch('/api/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: params.walletAddress,
        twitterHandle: params.twitterHandle,
        distance: Math.floor(params.distance),
        playDuration: Math.floor(params.playDuration),
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to submit score' };
    }

    return { success: true, rank: result.rank };
  } catch (error) {
    console.error('Error submitting score:', error);
    // Fallback: try direct Supabase insert if API is unavailable
    return await submitScoreDirect(params);
  }
}

async function submitScoreDirect(params: {
  walletAddress: string;
  twitterHandle: string | null;
  distance: number;
  playDuration: number;
}): Promise<{ success: boolean; rank?: number; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  const { error } = await supabase
    .from('leaderboard')
    .insert({
      wallet_address: params.walletAddress,
      twitter_handle: params.twitterHandle,
      distance: Math.floor(params.distance),
      play_duration_seconds: Math.floor(params.playDuration),
    } as any);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
