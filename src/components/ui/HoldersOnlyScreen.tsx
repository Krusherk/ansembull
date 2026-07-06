import { soundManager } from '../../lib/sounds';
import { getMinBalance } from '../../lib/solana';
import './HoldersOnlyScreen.css';

interface HoldersOnlyScreenProps {
  balance: number;
  onDisconnect: () => void;
}

export default function HoldersOnlyScreen({ balance, onDisconnect }: HoldersOnlyScreenProps) {
  const minBalance = getMinBalance();

  return (
    <div className="screen holders-screen">
      <div className="holders-grid" />

      <div className="holders-content glass-strong">
        <div className="holders-lock">🔒</div>

        <h2 className="holders-title">Holders Only</h2>

        <p className="holders-message">
          You need at least <span className="highlight-green">{minBalance.toLocaleString()} $ANSEM</span> to play
        </p>

        <div className="holders-balance-card">
          <span className="holders-balance-label">Your Balance</span>
          <span className="holders-balance-value">
            {balance.toLocaleString()} <span className="holders-balance-token">$ANSEM</span>
          </span>
          <div className="holders-progress-bar">
            <div
              className="holders-progress-fill"
              style={{ width: `${Math.min(100, (balance / minBalance) * 100)}%` }}
            />
          </div>
          <span className="holders-progress-text">
            {((balance / minBalance) * 100).toFixed(1)}% of minimum
          </span>
        </div>

        <a
          href="https://jup.ag/swap/SOL-9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-lg"
          onClick={() => soundManager.playClick()}
          id="buy-ansem-btn"
        >
          Buy $ANSEM on Jupiter →
        </a>

        <button
          className="btn btn-secondary"
          onClick={() => {
            soundManager.playClick();
            onDisconnect();
          }}
          id="disconnect-btn"
        >
          Disconnect & Try Another Wallet
        </button>
      </div>
    </div>
  );
}
