import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { submitScore } from '../../lib/supabase';
import { soundManager } from '../../lib/sounds';
import './GameOverScreen.css';

interface GameOverScreenProps {
  twitterHandle: string | null;
  walletAddress: string | null;
  onRestart: () => void;
  onLeaderboard: () => void;
}

export default function GameOverScreen({
  twitterHandle,
  walletAddress,
  onRestart,
  onLeaderboard,
}: GameOverScreenProps) {
  const distance = useGameStore(state => state.distance);
  const startTime = useGameStore(state => state.startTime);
  const [displayDistance, setDisplayDistance] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  const finalDistance = Math.floor(distance);
  const playDuration = (Date.now() - startTime) / 1000;

  // Count-up animation
  useEffect(() => {
    const target = finalDistance;
    const duration = 1500;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayDistance(Math.floor(eased * target));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [finalDistance]);

  const handleSubmit = async () => {
    if (!walletAddress || isSubmitting || submitted) return;
    setIsSubmitting(true);

    const result = await submitScore({
      walletAddress,
      twitterHandle,
      distance: finalDistance,
      playDuration,
    });

    if (result.success) {
      soundManager.playSuccess();
      setSubmitted(true);
      setSubmitResult(result.rank ? `Rank #${result.rank}!` : 'Score submitted!');
    } else {
      setSubmitResult(result.error || 'Failed to submit');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="screen-overlay gameover-screen">
      <div className="gameover-content">
        <h2 className="gameover-title">REKT 💀</h2>

        <div className="gameover-distance">
          <span className="gameover-distance-value">
            {displayDistance.toLocaleString()}
          </span>
          <span className="gameover-distance-unit">meters</span>
        </div>

        <div className="gameover-stats">
          <div className="gameover-stat">
            <span className="gameover-stat-label">Time</span>
            <span className="gameover-stat-value">{playDuration.toFixed(1)}s</span>
          </div>
          <div className="gameover-stat">
            <span className="gameover-stat-label">Avg Speed</span>
            <span className="gameover-stat-value">
              {playDuration > 0 ? (finalDistance / playDuration).toFixed(1) : '0'} m/s
            </span>
          </div>
        </div>

        <div className="gameover-actions">
          {!submitted ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={isSubmitting || !walletAddress}
              id="submit-score-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" /> Submitting...
                </>
              ) : (
                '🏆 Submit to Leaderboard'
              )}
            </button>
          ) : (
            <div className="gameover-submitted">
              <span className="gameover-submitted-text">✅ {submitResult}</span>
            </div>
          )}

          <button
            className="btn btn-secondary btn-lg"
            onClick={() => {
              soundManager.playClick();
              onRestart();
            }}
            id="play-again-btn"
          >
            🔄 Play Again
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              soundManager.playClick();
              onLeaderboard();
            }}
            id="view-leaderboard-btn"
          >
            📊 View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
