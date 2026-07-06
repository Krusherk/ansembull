import { soundManager } from '../../lib/sounds';
import './LinkXScreen.css';

interface LinkXScreenProps {
  walletAddress: string;
  onLinkX: () => void;
  onSkip: () => void;
  isLinking: boolean;
}

export default function LinkXScreen({ walletAddress, onLinkX, onSkip, isLinking }: LinkXScreenProps) {
  const truncated = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <div className="screen linkx-screen">
      <div className="linkx-grid" />

      <div className="linkx-content glass-strong">
        <div className="linkx-check-icon">✅</div>

        <h2 className="linkx-title">Wallet Connected</h2>

        <div className="linkx-wallet-badge">
          <span className="linkx-wallet-dot" />
          <span className="linkx-wallet-addr">{truncated}</span>
        </div>

        <div className="linkx-divider" />

        <h3 className="linkx-subtitle">Verify with 𝕏</h3>

        <p className="linkx-message">
          Link your 𝕏 (Twitter) account to confirm you're real and display your handle on the leaderboard.
        </p>

        <button
          className="btn btn-primary btn-lg linkx-btn"
          onClick={() => {
            soundManager.playClick();
            onLinkX();
          }}
          disabled={isLinking}
          id="link-x-btn"
        >
          {isLinking ? (
            <>
              <span className="spinner" /> Linking...
            </>
          ) : (
            <>
              <svg className="x-icon" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Connect 𝕏 Account
            </>
          )}
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            soundManager.playClick();
            onSkip();
          }}
          id="skip-x-btn"
        >
          Skip for now (play anonymously)
        </button>

        <p className="linkx-note">
          Your 𝕏 handle will be shown on the leaderboard next to your score
        </p>
      </div>
    </div>
  );
}
