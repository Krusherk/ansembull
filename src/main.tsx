import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import App from './App';
import './index.css';

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#00ff88',
          logo: '/favicon.svg',
          showWalletLoginFirst: true,
          walletList: ['phantom', 'solflare', 'backpack', 'metamask'],
        },
        loginMethods: ['wallet'],
        embeddedWallets: {
          createOnLogin: 'off',
        },
        supportedChains: [],
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>,
);
