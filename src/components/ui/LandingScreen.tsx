import { useState } from 'react';
import { soundManager } from '../../lib/sounds';
import './LandingScreen.css';

interface LandingScreenProps {
  onConnect: () => void;
  isConnecting: boolean;
}

export default function LandingScreen({ onConnect, isConnecting }: LandingScreenProps) {
  const [hovering, setHovering] = useState(false);

  return (
    <div className="screen landing-screen">
      {/* Animated background grid */}
      <div className="landing-grid" />

      {/* Floating particles */}
      <div className="landing-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="landing-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="landing-content">
        {/* Bull ASCII silhouette */}
        <div className="landing-bull-icon">
          <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="bull-svg">
            <path d="M15 35 C15 35, 8 22, 18 15 C24 10, 28 20, 28 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <path d="M105 35 C105 35, 112 22, 102 15 C96 10, 92 20, 92 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            <ellipse cx="60" cy="48" rx="35" ry="25" fill="currentColor" opacity="0.15"/>
            <ellipse cx="60" cy="45" rx="28" ry="20" fill="currentColor" opacity="0.1"/>
            <circle cx="45" cy="38" r="4" fill="currentColor"/>
            <circle cx="75" cy="38" r="4" fill="currentColor"/>
            <ellipse cx="60" cy="52" rx="10" ry="6" stroke="currentColor" strokeWidth="2" fill="none"/>
            <circle cx="54" cy="53" r="2.5" fill="currentColor" opacity="0.4"/>
            <circle cx="66" cy="53" r="2.5" fill="currentColor" opacity="0.4"/>
          </svg>
        </div>

        <h1 className="landing-title">
          <span className="title-black">BLACK</span>
          <span className="title-bull">BULL</span>
          <span className="title-run">RUN</span>
        </h1>

        <p className="landing-subtitle">
          How far can <span className="highlight-green">The Black Bull</span> run?
        </p>

        <p className="landing-token">
          Powered by <span className="highlight-green">$ANSEM</span> on Solana
        </p>

        <button
          className="btn btn-primary btn-lg landing-cta"
          onClick={() => {
            soundManager.playClick();
            onConnect();
          }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          disabled={isConnecting}
          id="connect-wallet-btn"
        >
          {isConnecting ? (
            <>
              <span className="spinner" />
              Connecting...
            </>
          ) : (
            <>
              🔗 Connect Wallet
            </>
          )}
        </button>

        <p className="landing-note">
          Connect your Solana wallet, then verify with 𝕏 to play
        </p>

        <div className="landing-footer">
          <span className="landing-reward-note">
            🏆 Top runners get rewarded with SOL airdrops
          </span>
        </div>
      </div>
    </div>
  );
}
