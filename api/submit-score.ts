import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SOLANA_RPC = process.env.SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const ANSEM_MINT = process.env.VITE_ANSEM_MINT || '9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump';
const MIN_BALANCE = parseInt(process.env.VITE_MIN_ANSEM_BALANCE || '10000', 10);

// Rate limit tracking (in-memory, resets on cold start)
const submissions: Record<string, number> = {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { walletAddress, twitterHandle, distance, playDuration } = req.body;

  // --- Validation ---
  if (!walletAddress || typeof distance !== 'number' || typeof playDuration !== 'number') {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (distance < 0 || distance > 500000) {
    return res.status(400).json({ error: 'Invalid distance' });
  }

  if (playDuration < 1) {
    return res.status(400).json({ error: 'Invalid play duration' });
  }

  // --- Anti-cheat: Speed check ---
  // Average speed should be between 10 and 50 m/s (game speed range)
  const avgSpeed = distance / playDuration;
  if (avgSpeed > 60) {
    return res.status(400).json({ error: 'Score rejected: impossible speed detected' });
  }

  // --- Rate limiting ---
  const now = Date.now();
  const lastSubmission = submissions[walletAddress] || 0;
  if (now - lastSubmission < 30000) {
    return res.status(429).json({ error: 'Too many submissions. Wait 30 seconds.' });
  }
  submissions[walletAddress] = now;

  // --- Verify token holdings ---
  try {
    const connection = new Connection(SOLANA_RPC, 'confirmed');
    const owner = new PublicKey(walletAddress);
    const mint = new PublicKey(ANSEM_MINT);
    const ata = await getAssociatedTokenAddress(mint, owner);

    let balance = 0;
    try {
      const balanceResult = await connection.getTokenAccountBalance(ata);
      balance = balanceResult.value.uiAmount || 0;
    } catch {
      balance = 0;
    }

    if (balance < MIN_BALANCE) {
      return res.status(403).json({ error: 'Insufficient $ANSEM balance' });
    }
  } catch (error) {
    console.error('Solana verification error:', error);
    // Don't block on RPC errors — log but allow
  }

  // --- Insert score ---
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { error: insertError } = await supabase
    .from('leaderboard')
    .insert({
      wallet_address: walletAddress,
      twitter_handle: twitterHandle || null,
      distance: Math.floor(distance),
      play_duration_seconds: Math.floor(playDuration),
    });

  if (insertError) {
    console.error('Supabase insert error:', insertError);
    return res.status(500).json({ error: 'Failed to save score' });
  }

  // Get rank
  const { count } = await supabase
    .from('leaderboard')
    .select('*', { count: 'exact', head: true })
    .gt('distance', Math.floor(distance));

  const rank = (count || 0) + 1;

  return res.status(200).json({ success: true, rank });
}
