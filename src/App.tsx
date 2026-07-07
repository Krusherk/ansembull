import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useGameStore } from './store/gameStore';
import { checkAnsemBalance, isHolder, isGateBypassed } from './lib/solana';
import GameCanvas from './game/GameCanvas';
import HUD from './game/HUD';
import LandingScreen from './components/ui/LandingScreen';
import HoldersOnlyScreen from './components/ui/HoldersOnlyScreen';
import LoadingScreen from './components/ui/LoadingScreen';
import GameOverScreen from './components/ui/GameOverScreen';
import LeaderboardScreen from './components/ui/LeaderboardScreen';

type AppScreen =
  | 'landing'
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

    const linkedAccounts = user.linkedAccounts || [];

    // Find any wallet address
    let foundWallet: string | null = null;

    // Check linked accounts for wallets
    for (const account of linkedAccounts) {
      if ((account as any).type === 'wallet' && (account as any).address) {
        foundWallet = (account as any).address;
        break;
      }
    }

    // Fallback: check user.wallet
    if (!foundWallet && (user as any).wallet?.address) {
      foundWallet = (user as any).wallet.address;
    }

    if (foundWallet) {
      setWalletAddress(foundWallet);
    }

    // Find Twitter account if linked
    const twitterAccount = linkedAccounts.find(
      (account: any) => account.type === 'twitter_oauth'
    );
    if (twitterAccount && 'username' in twitterAccount) {
      setTwitterHandle((twitterAccount as any).username);
    }
  }, [user]);

  // After wallet is found, check holder status
  useEffect(() => {
    if (!ready) return;

    if (authenticated && walletAddress && screen === 'landing') {
      checkHolderStatus();
    } else if (!authenticated && screen !== 'landing') {
      setScreen('landing');
    }
  }, [ready, authenticated, walletAddress]);

  // Check if wallet holds enough $ANSEM
  const checkHolderStatus = useCallback(async () => {
    if (!walletAddress) return;

    // If gate is bypassed, go straight to ready
    if (isGateBypassed()) {
      setAnsemBalance(999999);
      setScreen('ready');
      return;
    }

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
      login({ loginMethods: ['wallet'] });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [login]);

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

  const handleShowLeaderboard = useCallback(() => {
    setScreen('leaderboard');
  }, []);

  const handleCloseLeaderboard = useCallback(() => {
    if (gameState === 'gameOver') {
      setScreen('game-over');
    } else {
      setScreen('ready');
    }
  }, [gameState]);

  // Render
  if (!ready) {
    return <LoadingScreen message="Initializing..." />;
  }

  return (
    <>
      {screen === 'landing' && (
        <LandingScreen onConnect={handleConnect} isConnecting={isConnecting} />
      )}

      {screen === 'checking' && (
        <LoadingScreen message={loadingMessage} />
      )}

      {screen === 'holders-only' && (
        <HoldersOnlyScreen
          balance={ansemBalance}
          onDisconnect={handleDisconnect}
        />
      )}

      {screen === 'ready' && (
        <div className="screen ready-screen">
          <div className="ready-content">
            <h2 className="ready-title">Ready to Run? 🐂</h2>

            {twitterHandle && (
              <p className="ready-handle">
                Playing as <span className="highlight-green">@{twitterHandle}</span>
              </p>
            )}

            {walletAddress && (
              <p className="ready-handle" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            )}

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

      {(screen === 'playing' || screen === 'game-over' || screen === 'leaderboard') && (
        <>
          <GameCanvas />
          <HUD twitterHandle={twitterHandle} walletAddress={walletAddress} />
        </>
      )}

      {screen === 'game-over' && (
        <GameOverScreen
          twitterHandle={twitterHandle}
          walletAddress={walletAddress}
          onRestart={handleRestart}
          onLeaderboard={handleShowLeaderboard}
        />
      )}

      {screen === 'leaderboard' && (
        <LeaderboardScreen
          currentWallet={walletAddress}
          onClose={handleCloseLeaderboard}
        />
      )}
    </>
  );
}
