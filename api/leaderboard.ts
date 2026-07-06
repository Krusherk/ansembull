import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Cache for 60 seconds
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const limit = Math.min(parseInt(req.query.limit as string) || 100, 100);
  const wallet = req.query.wallet as string | undefined;

  // Fetch top scores
  const { data: scores, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('distance', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Leaderboard fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }

  // If wallet specified, also get their personal best and rank
  let personalBest = null;
  if (wallet) {
    const { data: userScores } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('wallet_address', wallet)
      .order('distance', { ascending: false })
      .limit(1);

    if (userScores && userScores.length > 0) {
      const { count } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true })
        .gt('distance', userScores[0].distance);

      personalBest = {
        ...userScores[0],
        rank: (count || 0) + 1,
      };
    }
  }

  return res.status(200).json({
    scores: scores || [],
    personalBest,
  });
}
