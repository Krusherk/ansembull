import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import App from './App';
import './index.css';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['wallet', 'twitter'],
        appearance: {
          theme: 'dark',
          accentColor: '#00ff88',
          logo: '/favicon.svg',
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
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
  </React.StrictMode>,
);
