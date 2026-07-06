import { useState, useEffect } from 'react';
import { fetchLeaderboard, LeaderboardEntry } from '../../lib/supabase';
import { soundManager } from '../../lib/sounds';
import './LeaderboardScreen.css';

interface LeaderboardScreenProps {
  currentWallet: string | null;
  onClose: () => void;
}

export default function LeaderboardScreen({ currentWallet, onClose }: LeaderboardScreenProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = await fetchLeaderboard(100);
    setEntries(data);
    setLoading(false);
  };

  const truncateWallet = (addr: string) =>
    `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="screen-overlay leaderboard-screen">
      <div className="leaderboard-container glass-strong">
        <div className="leaderboard-header">
          <h2 className="leaderboard-title">🏆 Leaderboard</h2>
          <button
            className="leaderboard-close"
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            id="close-leaderboard-btn"
          >
            ✕
          </button>
        </div>

        <div className="leaderboard-reward-banner">
          <span>🎁 Top distance runners get rewarded with SOL airdrops</span>
        </div>

        {loading ? (
          <div className="leaderboard-loading">
            <div className="leaderboard-spinner" />
            <span>Loading scores...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="leaderboard-empty">
            <span>No scores yet. Be the first to run!</span>
          </div>
        ) : (
          <div className="leaderboard-table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Wallet</th>
                  <th>Distance</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const rank = i + 1;
                  const isCurrentUser = currentWallet && entry.wallet_address === currentWallet;
                  return (
                    <tr
                      key={entry.id}
                      className={`
                        leaderboard-row
                        ${rank <= 3 ? `leaderboard-top-${rank}` : ''}
                        ${isCurrentUser ? 'leaderboard-current-user' : ''}
                      `}
                    >
                      <td className="leaderboard-rank">
                        <span className={rank <= 3 ? 'rank-medal' : 'rank-number'}>
                          {getRankEmoji(rank)}
                        </span>
                      </td>
                      <td className="leaderboard-handle">
                        {entry.twitter_handle ? (
                          <a
                            href={`https://x.com/${entry.twitter_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            @{entry.twitter_handle}
                          </a>
                        ) : (
                          <span className="no-handle">Anonymous</span>
                        )}
                      </td>
                      <td className="leaderboard-wallet">
                        {truncateWallet(entry.wallet_address)}
                      </td>
                      <td className="leaderboard-distance">
                        {entry.distance.toLocaleString()}m
                      </td>
                      <td className="leaderboard-date">
                        {formatDate(entry.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="leaderboard-footer">
          <button
            className="btn btn-secondary"
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
          >
            Back to Game
          </button>
        </div>
      </div>
    </div>
  );
}
