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
  const { ready, authenticated, user, login, logout } = usePrivy();
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

    // Find Solana wallet — check multiple possible shapes
    const linkedAccounts = user.linkedAccounts || [];
    
    const solanaWallet = linkedAccounts.find(
      (account: any) => {
        // Embedded wallet or external wallet with solana chain
        if (account.type === 'wallet') {
          return account.chainType === 'solana' || account.walletClientType === 'privy';
        }
        return false;
      }
    );
    
    // Also check user.wallet as fallback
    const walletAddr = solanaWallet && 'address' in solanaWallet
      ? (solanaWallet as any).address
      : (user as any).wallet?.address || null;

    if (walletAddr) {
      setWalletAddress(walletAddr);
    }

    // Find Twitter account
    const twitterAccount = linkedAccounts.find(
      (account: any) => account.type === 'twitter_oauth'
    );
    if (twitterAccount && 'username' in twitterAccount) {
      setTwitterHandle((twitterAccount as any).username);
    }
  }, [user]);

  // Handle auth state changes
  useEffect(() => {
    if (!ready) return;

    if (authenticated && walletAddress) {
      const hasTwitter = (user?.linkedAccounts || []).some(
        (account: any) => account.type === 'twitter_oauth'
      );

      if (screen === 'landing' || screen === 'link-x') {
        if (hasTwitter) {
          checkHolderStatus();
        } else if (screen !== 'link-x') {
          setScreen('link-x');
        }
      }
    } else if (authenticated && !walletAddress) {
      // User logged in but no wallet address found yet — might still be loading
      // Check if any wallet exists
      const linkedAccounts = user?.linkedAccounts || [];
      const anyWallet = linkedAccounts.find((a: any) => a.type === 'wallet');
      if (anyWallet && 'address' in anyWallet) {
        setWalletAddress((anyWallet as any).address);
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
      setAnsemBalance(0);
      setScreen('holders-only');
    }
  }, [walletAddress]);

  // Handle wallet connection via Privy
  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [login]);

  // Handle X linking — use login again with twitter method
  const handleLinkX = useCallback(async () => {
    setIsLinkingX(true);
    try {
      // Try to link Twitter via Privy's link method
      // Different Privy versions expose this differently
      const privy = (window as any).__PRIVY__;
      if (privy?.linkAccount) {
        await privy.linkAccount({ type: 'twitter' });
      } else {
        // Fallback: just proceed to holder check
        // The user can link Twitter from Privy's UI later
        console.log('Twitter linking not available, skipping...');
      }
      checkHolderStatus();
    } catch (error) {
      console.error('Link Twitter error:', error);
      // Don't block the user — proceed anyway
      checkHolderStatus();
    } finally {
      setIsLinkingX(false);
    }
  }, [checkHolderStatus]);

  // Skip X linking
  const handleSkipX = useCallback(() => {
    checkHolderStatus();
  }, [checkHolderStatus]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
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
