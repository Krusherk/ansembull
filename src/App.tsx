import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useGameStore } from './store/gameStore';
import { checkAnsemBalance, isHolder } from './lib/solana';
import GameCanvas from './game/GameCanvas';
import HUD from './game/HUD';
import LandingScreen from './components/ui/LandingScreen';
import LinkXScreen from './components/ui/LinkXScreen';
import HoldersOnlyScreen from './components/ui/HoldersOnlyScreen';
import LoadingScreen from './components/ui/LoadingScreen';
import GameOverScreen from './components/ui/GameOverScreen';
import LeaderboardScreen from './components/ui/LeaderboardScreen';

type AppScreen =
  | 'landing'
  | 'link-x'
  | 'checking'
  | 'holders-only'
  | 'ready'
  | 'playing'
  | 'game-over'
  | 'leaderboard';

export default function App() {
  const { ready, authenticated, user, login, logout, linkTwitter } = usePrivy();
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [twitterHandle, setTwitterHandle] = useState<string | null>(null);
  const [ansemBalance, setAnsemBalance] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLinkingX, setIsLinkingX] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Connecting...');

  const gameState = useGameStore(state => state.gameState);
  const startGame = useGameStore(state => state.startGame);

  // Extract wallet and twitter from Privy user
  useEffect(() => {
    if (!user) {
      setWalletAddress(null);
      setTwitterHandle(null);
      return;
    }

    // Find Solana wallet
    const solanaWallet = user.linkedAccounts?.find(
      (account: any) => account.type === 'wallet' && account.chainType === 'solana'
    );
    if (solanaWallet && 'address' in solanaWallet) {
      setWalletAddress(solanaWallet.address as string);
    }

    // Find Twitter account
    const twitterAccount = user.linkedAccounts?.find(
      (account: any) => account.type === 'twitter_oauth'
    );
    if (twitterAccount && 'username' in twitterAccount) {
      setTwitterHandle(twitterAccount.username as string);
    }
  }, [user]);

  // Handle auth state changes
  useEffect(() => {
    if (!ready) return;

    if (authenticated && walletAddress) {
      // Check if user has linked X
      const hasTwitter = user?.linkedAccounts?.some(
        (account: any) => account.type === 'twitter_oauth'
      );

      if (screen === 'landing' || screen === 'link-x') {
        if (hasTwitter) {
          // Both wallet and X linked — check holder status
          checkHolderStatus();
        } else if (screen !== 'link-x') {
          // Wallet connected but no X — prompt to link
          setScreen('link-x');
        }
      }
    } else if (!authenticated && screen !== 'landing') {
      setScreen('landing');
    }
  }, [ready, authenticated, walletAddress, user]);

  // Check if wallet holds enough $ANSEM
  const checkHolderStatus = useCallback(async () => {
    if (!walletAddress) return;

    setScreen('checking');
    setLoadingMessage('Checking $ANSEM balance...');

    try {
      const balance = await checkAnsemBalance(walletAddress);
      setAnsemBalance(balance);

      const holdsEnough = await isHolder(walletAddress);
      if (holdsEnough) {
        setScreen('ready');
      } else {
        setScreen('holders-only');
      }
    } catch (error) {
      console.error('Error checking balance:', error);
      // On error, let them through (better UX than blocking)
      setAnsemBalance(0);
      setScreen('holders-only');
    }
  }, [walletAddress]);

  // Handle wallet connection
  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      login({
        loginMethods: ['wallet'],
      });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [login]);

  // Handle X linking
  const handleLinkX = useCallback(async () => {
    setIsLinkingX(true);
    try {
      await linkTwitter();
      // After linking, check holder status
      checkHolderStatus();
    } catch (error) {
      console.error('Link Twitter error:', error);
    } finally {
      setIsLinkingX(false);
    }
  }, [linkTwitter, checkHolderStatus]);

  // Skip X linking
  const handleSkipX = useCallback(() => {
    checkHolderStatus();
  }, [checkHolderStatus]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    await logout();
    setWalletAddress(null);
    setTwitterHandle(null);
    setAnsemBalance(0);
    setScreen('landing');
  }, [logout]);

  // Handle game start
  const handleStartGame = useCallback(() => {
    startGame();
    setScreen('playing');
  }, [startGame]);

  // Track game state transitions
  useEffect(() => {
    if (gameState === 'gameOver' && screen === 'playing') {
      setScreen('game-over');
    }
  }, [gameState, screen]);

  // Handle restart
  const handleRestart = useCallback(() => {
    startGame();
    setScreen('playing');
  }, [startGame]);

  // Show leaderboard
  const handleShowLeaderboard = useCallback(() => {
    setScreen('leaderboard');
  }, []);

  // Close leaderboard
  const handleCloseLeaderboard = useCallback(() => {
    if (gameState === 'gameOver') {
      setScreen('game-over');
    } else {
      setScreen('ready');
    }
  }, [gameState]);

  // Render based on screen state
  if (!ready) {
    return <LoadingScreen message="Initializing..." />;
  }

  return (
    <>
      {/* Landing screen */}
      {screen === 'landing' && (
        <LandingScreen onConnect={handleConnect} isConnecting={isConnecting} />
      )}

      {/* Link X screen */}
      {screen === 'link-x' && walletAddress && (
        <LinkXScreen
          walletAddress={walletAddress}
          onLinkX={handleLinkX}
          onSkip={handleSkipX}
          isLinking={isLinkingX}
        />
      )}

      {/* Loading / checking */}
      {screen === 'checking' && (
        <LoadingScreen message={loadingMessage} />
      )}

      {/* Holders only */}
      {screen === 'holders-only' && (
        <HoldersOnlyScreen
          balance={ansemBalance}
          onDisconnect={handleDisconnect}
        />
      )}

      {/* Ready to play */}
      {screen === 'ready' && (
        <div className="screen ready-screen">
          <div className="ready-content">
            <h2 className="ready-title">Ready to Run? 🐂</h2>

            {twitterHandle && (
              <p className="ready-handle">
                Playing as <span className="highlight-green">@{twitterHandle}</span>
              </p>
            )}

            <p className="ready-balance">
              Balance: <span className="highlight-green">{ansemBalance.toLocaleString()} $ANSEM</span>
            </p>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleStartGame}
              id="start-game-btn"
              style={{ marginTop: '16px', minWidth: '220px' }}
            >
              🏃 Start Running
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleShowLeaderboard}
              id="view-leaderboard-ready-btn"
              style={{ marginTop: '8px' }}
            >
              📊 View Leaderboard
            </button>

            <div className="ready-controls-info">
              <p><strong>Desktop:</strong> ← → Lanes · Space Jump · ↓ Slide</p>
              <p><strong>Mobile:</strong> Swipe ← → ↑ ↓</p>
            </div>
          </div>
        </div>
      )}

      {/* Game canvas (always mounted when playing or game over for background) */}
      {(screen === 'playing' || screen === 'game-over' || screen === 'leaderboard') && (
        <>
          <GameCanvas />
          <HUD twitterHandle={twitterHandle} walletAddress={walletAddress} />
        </>
      )}

      {/* Game over overlay */}
      {screen === 'game-over' && (
        <GameOverScreen
          twitterHandle={twitterHandle}
          walletAddress={walletAddress}
          onRestart={handleRestart}
          onLeaderboard={handleShowLeaderboard}
        />
      )}

      {/* Leaderboard overlay */}
      {screen === 'leaderboard' && (
        <LeaderboardScreen
          currentWallet={walletAddress}
          onClose={handleCloseLeaderboard}
        />
      )}
    </>
  );
}
