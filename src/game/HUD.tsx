import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import './HUD.css';

interface HUDProps {
  twitterHandle: string | null;
  walletAddress: string | null;
  onDisconnect?: () => void;
  onLinkX?: () => void;
  userPfp?: string | null;
}

export default function HUD({ twitterHandle, walletAddress, onDisconnect, onLinkX, userPfp }: HUDProps) {
  const distance = useGameStore(state => state.distance);
  const speed = useGameStore(state => state.speed);
  const gameState = useGameStore(state => state.gameState);
  const difficultyLevel = useGameStore(state => state.difficultyLevel);
  const [profileOpen, setProfileOpen] = useState(false);

  if (gameState !== 'playing') return null;

  const truncatedWallet = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : '';

  const getDifficultyLabel = (level: number) => {
    if (level <= 0) return 'Easy';
    if (level <= 1) return 'Normal';
    if (level <= 2) return 'Hard';
    if (level <= 3) return 'Extreme';
    return 'Insane 🔥';
  };

  return (
    <div className="hud">
      {/* Profile toggle — top left */}
      <div className="hud-profile-area">
        <button
          className="hud-profile-btn"
          onClick={() => setProfileOpen(!profileOpen)}
        >
          {userPfp ? (
            <img src={userPfp} alt="pfp" className="hud-pfp" />
          ) : (
            <div className="hud-pfp-placeholder">
              {twitterHandle ? twitterHandle[0].toUpperCase() : '🐂'}
            </div>
          )}
          <span className="hud-profile-chevron">{profileOpen ? '▲' : '▼'}</span>
        </button>

        {profileOpen && (
          <div className="hud-profile-dropdown">
            {twitterHandle && (
              <div className="hud-profile-item">
                <span className="hud-profile-label">𝕏</span>
                <span className="hud-profile-value">@{twitterHandle}</span>
              </div>
            )}
            {walletAddress && (
              <div className="hud-profile-item">
                <span className="hud-profile-label">Wallet</span>
                <span className="hud-profile-value">{truncatedWallet}</span>
              </div>
            )}
            {!twitterHandle && onLinkX && (
              <button className="hud-profile-action hud-link-x" onClick={onLinkX}>
                <svg className="x-icon-sm" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Link 𝕏 Account
              </button>
            )}
            {onDisconnect && (
              <button className="hud-profile-action hud-disconnect" onClick={onDisconnect}>
                🔌 Disconnect
              </button>
            )}
          </div>
        )}
      </div>

      {/* Distance — top center */}
      <div className="hud-distance">
        <span className="hud-distance-value">
          {Math.floor(distance).toLocaleString()}
        </span>
        <span className="hud-distance-unit">m</span>
      </div>

      {/* Speed + difficulty — top right */}
      <div className="hud-stats-right">
        <div className="hud-speed">
          <span className="hud-speed-value">{speed.toFixed(0)}</span>
          <span className="hud-speed-unit">km/s</span>
        </div>
        <div className="hud-difficulty">
          <span className={`hud-diff-badge diff-${Math.min(difficultyLevel, 4)}`}>
            {getDifficultyLabel(difficultyLevel)}
          </span>
        </div>
      </div>

      {/* Mobile controls hint */}
      <div className="hud-controls-hint">
        <span>⬆ Jump</span>
        <span>⬇ Slide</span>
        <span>⬅➡ Lanes</span>
      </div>
    </div>
  );
}
