'use client';
import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useBalance, useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "ethers";
import Navbar from './mainSections/navbar.js';
import Home from './mainSections/home.js';
import Playground from './mainSections/playground.js';

const TOKEN0_ADDRESS = process.env.NEXT_PUBLIC_TOKEN0_ADDRESS
const TOKEN1_ADDRESS = process.env.NEXT_PUBLIC_TOKEN1_ADDRESS

export default function HomePage() {
  const [balanceToken0, setBalanceToken0] = useState("0");
  const [balanceToken1, setBalanceToken1] = useState("0");

  const { address, isConnected } = useAccount({
    onConnect() {
      console.log("Wallet connected:", address);
      refetchBalances(); // 錢包連線時更新餘額
    },
    onDisconnect() {
      console.log("Wallet disconnected");
      setBalanceToken0("0");
      setBalanceToken1("0");
    },
  });

  // 獲取 Token0（PUPU）的餘額
  const { data: token0BalanceData, refetch: refetchToken0 } = useBalance({
    address: address,
    token: TOKEN0_ADDRESS,
    watch: true,
  });

  // 獲取 Token1（USDC）的餘額
  const { data: token1BalanceData, refetch: refetchToken1 } = useBalance({
    address: address,
    token: TOKEN1_ADDRESS,
    watch: true,
  });

  // 定義更新餘額的方法
  const refetchBalances = () => {
    refetchToken0();
    refetchToken1();
  };

  // 更新 Token0 餘額
  useEffect(() => {
    if (token0BalanceData?.value !== undefined && token0BalanceData?.decimals !== undefined) {
      setBalanceToken0(formatUnits(token0BalanceData.value, token0BalanceData.decimals));
    } else {
      console.warn("Token0 balance data is incomplete:", token0BalanceData);
    }
  }, [token0BalanceData]);

  // 更新 Token1 餘額
  useEffect(() => {
    if (token1BalanceData?.value !== undefined && token1BalanceData?.decimals !== undefined) {
      setBalanceToken1(formatUnits(token1BalanceData.value, token1BalanceData.decimals));
    } else {
      console.warn("Token1 balance data is incomplete:", token0BalanceData);
    }
  }, [token1BalanceData]);

  return (
    <div>
      <Navbar balanceToken0={balanceToken0} balanceToken1={balanceToken1} />
      <Home />
      <Playground userAddr={address} isConnected={isConnected} refetchBalances={refetchBalances}/>
    
    </div>
  );
}





