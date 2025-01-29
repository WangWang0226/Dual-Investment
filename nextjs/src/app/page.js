'use client';
import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect, useBalance, useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "ethers";
import Navbar from './mainSections/navbar.js';
import Home from './mainSections/home.js';
import Playground from './mainSections/playground.js';
import UserPositions from './mainSections/userPositions.js';
import Notification from "./components/notification.js";
import PriceBanner from "./components/priceBanner.js";


const TOKEN0_ADDRESS = process.env.NEXT_PUBLIC_TOKEN0_ADDRESS
const TOKEN1_ADDRESS = process.env.NEXT_PUBLIC_TOKEN1_ADDRESS

export default function HomePage() {
  const [transactionHash, setTransactionHash] = useState(null);
  const [balanceToken0, setBalanceToken0] = useState("0");
  const [balanceToken1, setBalanceToken1] = useState("0");
  const [notifications, setNotifications] = useState([]);
  const [lastResult, setLastResult] = useState({}); // 儲存上一次的結果內容
  const [latestPrice, setPrice] = useState(1000); // 初始化價格

  const playgroundRef = useRef();
  const userPositionRef = useRef();

  const { address, isConnected } = useAccount({
    onConnect() {
      console.log("Wallet connected:", address);
      refetchBalances();
      if (playgroundRef.current) {
        playgroundRef.current.onWalletConnect();
      }
      if (userPositionRef.current) {
        userPositionRef.current.onWalletConnect();
      }
    },
    onDisconnect() {
      console.log("Wallet disconnected");
      setBalanceToken0("0");
      setBalanceToken1("0");
    },
  });

  const { writeContract } = useWriteContract({
    mutation: {
      onSuccess(hash) {
        console.log("Transaction sent:", hash);
        setTransactionHash(hash); // 儲存交易 Hash
      },
    }
  });

  const txResult = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  // 提取並同步交易狀態
  useEffect(() => {
    const isResultUpdated =
      txResult.isLoading !== lastResult.isLoading ||
      txResult.isSuccess !== lastResult.isSuccess ||
      txResult.isError !== lastResult.isError;
    if (isResultUpdated) {
      setLastResult(txResult);
      if (txResult.isLoading) {
        addNotification("Transaction is loading...");
      } else if (txResult.isSuccess) {
        refetchBalances()
        addNotification("Transaction successful!");
      } else if (txResult.isError) {
        addNotification("Transaction failed!");
      }
    }

  }, [txResult]);

  // 添加通知
  const addNotification = (message) => {
    setNotifications((prev) => [...prev, { id: Date.now(), message }]);
  };

  // 移除通知
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  // 獲取 Token0（PUPU）的餘額
  const { data: token0BalanceData, refetch: refetchToken0 } = useBalance({
    address: address,
    token: TOKEN0_ADDRESS
  });

  // 獲取 Token1（USDC）的餘額
  const { data: token1BalanceData, refetch: refetchToken1 } = useBalance({
    address: address,
    token: TOKEN1_ADDRESS
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


  useEffect(() => {
    const simulatePriceChange = () => {
      const randomChange = (Math.random() - 0.5) * 10; // 每次價格波動範圍為 ±5
      setPrice((prevPrice) => {
        let newPrice = prevPrice + randomChange;
        if (newPrice > 1050) newPrice = 1050;
        if (newPrice < 950) newPrice = 950;

        return newPrice;
      });
    };

    const interval = setInterval(simulatePriceChange, 3000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div>
      <Navbar balanceToken0={balanceToken0} balanceToken1={balanceToken1} />
      <Home />
      <PriceBanner price={latestPrice}/>
      <Playground userAddr={address} isConnected={isConnected} writeContract={writeContract} lastestResult={lastResult} ref={playgroundRef} latestPrice={latestPrice}/>
      <UserPositions userAddr={address} isConnected={isConnected} writeContract={writeContract} lastestResult={lastResult} ref={userPositionRef} latestPrice={latestPrice}/>

      <div className="notifications">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </div>
  );
}





