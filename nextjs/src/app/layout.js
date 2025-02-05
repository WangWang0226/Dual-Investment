'use client';
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Jersey_15 } from 'next/font/google';


import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

import { createConfig, http } from '@wagmi/core'
import { sepolia, anvil } from 'viem/chains'
import { injected } from '@wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
const jersey = Jersey_15({
  weight: '400', 
  subsets: ['latin'], 
  display: 'swap', 
});

const queryClient = new QueryClient();

const chains = [sepolia, anvil]
const config = createConfig({
  chains: chains,
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URL),
    [anvil.id]: http('http://127.0.0.1:8545'),
  },
  pollingInterval: 4_000, 
})

export default function RootLayout({ children }) {

  useEffect(() => {
    if (typeof window !== 'undefined') {
      AOS.init({
        duration: 1000, // 動畫持續時間
        delay: 100,
        // once: true, // 是否只觸發一次
      });
    }
  }, []);

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
