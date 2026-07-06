import { useGameStore } from '../store/gameStore';
import './HUD.css';

interface HUDProps {
  twitterHandle: string | null;
  walletAddress: string | null;
}

export default function HUD({ twitterHandle, walletAddress }: HUDProps) {
  const distance = useGameStore(state => state.distance);
  const speed = useGameStore(state => state.speed);
  const gameState = useGameStore(state => state.gameState);

  if (gameState !== 'playing') return null;

  const truncatedWallet = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : '';

  return (
    <div className="hud">
      {/* User info - top left */}
      <div className="hud-user">
        {twitterHandle && (
          <span className="hud-handle">@{twitterHandle}</span>
        )}
        {walletAddress && (
          <span className="hud-wallet">{truncatedWallet}</span>
        )}
      </div>

      {/* Distance - top center */}
      <div className="hud-distance">
        <span className="hud-distance-value">
          {Math.floor(distance).toLocaleString()}
        </span>
        <span className="hud-distance-unit">m</span>
      </div>

      {/* Speed - top right */}
      <div className="hud-speed">
        <span className="hud-speed-value">{speed.toFixed(1)}</span>
        <span className="hud-speed-unit">km/s</span>
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
