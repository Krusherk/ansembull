import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import App from './App';
import './index.css';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';

// Solana connectors — enables Phantom, Solflare, Backpack detection on mobile
const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

// Error boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          background: '#0a0a0f', color: '#ff3355', padding: '40px',
          fontFamily: 'monospace', height: '100vh', display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <h1 style={{ color: '#ff3355', marginBottom: '20px' }}>⚠️ Error</h1>
          <pre style={{ maxWidth: '600px', whiteSpace: 'pre-wrap', color: '#888' }}>
            {this.state.error.message}
          </pre>
          <button onClick={() => window.location.reload()} style={{
            marginTop: '20px', padding: '10px 24px', background: '#00ff88',
            color: '#0a0a0f', border: 'none', borderRadius: '8px',
            fontWeight: 'bold', cursor: 'pointer',
          }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PrivyProvider
        appId={PRIVY_APP_ID}
        config={{
          appearance: {
            theme: 'dark',
            accentColor: '#00ff88',
            logo: '/favicon.svg',
            walletChainType: 'solana-only',
            walletList: ['detected_solana_wallets', 'phantom', 'solflare', 'backpack'],
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
          externalWallets: {
            solana: {
              connectors: solanaConnectors,
            },
          },
        }}
      >
        <App />
      </PrivyProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
