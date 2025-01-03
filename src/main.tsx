import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import '@/styles/globals.css';
import { ArweaveWalletKit } from "arweave-wallet-kit";



ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ArweaveWalletKit
    config={{
      permissions: [
        "ACCESS_ADDRESS",
        "ACCESS_PUBLIC_KEY",
        "SIGN_TRANSACTION",
        "DISPATCH",
      ],
      ensurePermissions: true,
    }}
    theme={{
      displayTheme: "light"
    }}
  >
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </ArweaveWalletKit>
);