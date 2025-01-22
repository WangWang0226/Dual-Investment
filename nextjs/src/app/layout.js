'use client';
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Jersey_15 } from 'next/font/google';


import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";

import { createConfig, http } from '@wagmi/core'
import { sepolia, anvil } from 'viem/chains'
import { injected } from '@wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const jersey = Jersey_15({
  weight: '400', 
  subsets: ['latin'], 
  display: 'swap', 
});

const queryClient = new QueryClient();

const chains = [anvil, sepolia]
const config = createConfig({
  chains: [anvil, sepolia],
  connectors: [injected()],
  transports: {
    [anvil.id]: http('http://127.0.0.1:8545'),
    [sepolia.id]: http('https://sepolia.example.com'),
  },
})

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={jersey.className}>
      <div></div>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <RainbowKitProvider chains={chains}>{children}</RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
