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
  const [userPfp, setUserPfp] = useState<string | null>(null);
  const [ansemBalance, setAnsemBalance] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Connecting...');

  const gameState = useGameStore(state => state.gameState);
  const startGame = useGameStore(state => state.startGame);

  // Extract wallet, twitter, and PFP from Privy user
  useEffect(() => {
    if (!user) {
      setWalletAddress(null);
      setTwitterHandle(null);
      setUserPfp(null);
      return;
    }

    const linkedAccounts = user.linkedAccounts || [];

    // Find any wallet address
    let foundWallet: string | null = null;
    for (const account of linkedAccounts) {
      if ((account as any).type === 'wallet' && (account as any).address) {
        foundWallet = (account as any).address;
        break;
      }
    }
    if (!foundWallet && (user as any).wallet?.address) {
      foundWallet = (user as any).wallet.address;
    }
    if (foundWallet) setWalletAddress(foundWallet);

    // Find Twitter account
    const twitterAccount = linkedAccounts.find(
      (account: any) => account.type === 'twitter_oauth'
    );
    if (twitterAccount) {
      if ('username' in twitterAccount) setTwitterHandle((twitterAccount as any).username);
      if ('profilePictureUrl' in twitterAccount) setUserPfp((twitterAccount as any).profilePictureUrl);
    }
  }, [user]);

  // After wallet found, check holder status
  useEffect(() => {
    if (!ready) return;
    if (authenticated && walletAddress && screen === 'landing') {
      checkHolderStatus();
    } else if (!authenticated && screen !== 'landing') {
      setScreen('landing');
    }
  }, [ready, authenticated, walletAddress]);

  const checkHolderStatus = useCallback(async () => {
    if (!walletAddress) return;

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
      setScreen(holdsEnough ? 'ready' : 'holders-only');
    } catch (error) {
      console.error('Error checking balance:', error);
      setAnsemBalance(0);
      setScreen('holders-only');
    }
  }, [walletAddress]);

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

  const handleDisconnect = useCallback(async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setWalletAddress(null);
    setTwitterHandle(null);
    setUserPfp(null);
    setAnsemBalance(0);
    setScreen('landing');
  }, [logout]);

  const handleLinkX = useCallback(() => {
    // Open Privy link flow for Twitter
    try {
      login({ loginMethods: ['twitter'] });
    } catch (e) {
      console.error('Link X error:', e);
    }
  }, [login]);

  const handleStartGame = useCallback(() => {
    startGame();
    setScreen('playing');
  }, [startGame]);

  useEffect(() => {
    if (gameState === 'gameOver' && screen === 'playing') {
      setScreen('game-over');
    }
  }, [gameState, screen]);

  const handleRestart = useCallback(() => {
    startGame();
    setScreen('playing');
  }, [startGame]);

  const handleShowLeaderboard = useCallback(() => {
    setScreen('leaderboard');
  }, []);

  const handleCloseLeaderboard = useCallback(() => {
    setScreen(gameState === 'gameOver' ? 'game-over' : 'ready');
  }, [gameState]);

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
        <HoldersOnlyScreen balance={ansemBalance} onDisconnect={handleDisconnect} />
      )}

      {screen === 'ready' && (
        <div className="screen ready-screen">
          <div className="ready-content">
            {/* Profile badge */}
            <div className="ready-profile-badge">
              {userPfp ? (
                <img src={userPfp} alt="pfp" className="ready-pfp" />
              ) : (
                <div className="ready-pfp-placeholder">🐂</div>
              )}
              <div className="ready-profile-info">
                {twitterHandle && (
                  <span className="ready-handle-text">@{twitterHandle}</span>
                )}
                {walletAddress && (
                  <span className="ready-wallet-text">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                )}
              </div>
            </div>

            <h2 className="ready-title">Ready to Run? 🐂</h2>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleStartGame}
              id="start-game-btn"
              style={{ marginTop: '16px', minWidth: '220px' }}
            >
              🏃 Start Running
            </button>

            <div className="ready-btn-row">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleShowLeaderboard}
                id="view-leaderboard-ready-btn"
              >
                📊 Leaderboard
              </button>

              {!twitterHandle && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleLinkX}
                  id="link-x-ready-btn"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{ marginRight: '4px' }}>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Link 𝕏
                </button>
              )}

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleDisconnect}
                id="disconnect-ready-btn"
                style={{ color: 'var(--neon-red)' }}
              >
                🔌 Disconnect
              </button>
            </div>

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
          <HUD
            twitterHandle={twitterHandle}
            walletAddress={walletAddress}
            onDisconnect={handleDisconnect}
            onLinkX={!twitterHandle ? handleLinkX : undefined}
            userPfp={userPfp}
          />
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
