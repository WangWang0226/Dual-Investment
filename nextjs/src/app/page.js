'use client';
import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useConnect, useDisconnect, useBalance, useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "ethers";
import FAUCET_ABI from './abi/faucetAbi.js';

const FAUCET_CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"; // 替換為你的 Faucet 合約地址

const TOKEN0_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // 替換為你的 Token0 地址（WETH）
const TOKEN1_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // 替換為你的 Token1 地址（USDC）


export default function HomePage() {
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
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [balanceToken0, setBalanceToken0] = useState("0");
  const [balanceToken1, setBalanceToken1] = useState("0");
  const [transactionHash, setTransactionHash] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);


  const { data } = useSimulateContract({
    address: FAUCET_CONTRACT_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "claimToken",
  });

  const { writeContract } = useWriteContract({
    mutation: {
      onSuccess(hash) {
        console.log("Transaction sent:", hash);
        setTransactionHash(hash); // 儲存交易 Hash
      },
    }
  });

  const result = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  
  // 提取並同步交易狀態
  useEffect(() => {
    if (result) {
      setIsLoading(result.isLoading);
      setIsSuccess(result.isSuccess);
      setIsError(result.isError);
    }
  }, [result]);


  // 獲取 Token0（WETH）的餘額
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
      <h1>Dual Investment DApp</h1>
      <ConnectButton />
      {isConnected ? (
        <div>
          <div>
            <p>Connected to: {address}</p>
            <button onClick={disconnect}>Disconnect</button>
            <p>Token0 (WETH) Balance: {balanceToken0}</p>
            <p>Token1 (USDC) Balance: {balanceToken1}</p>

            <div>
              <button
                disabled={!Boolean(data?.request)}
                onClick={() => writeContract(data.request)}
              >
                Claim Tokens
              </button>
              {isLoading && <p>Transaction in progress...</p>}
              {isSuccess && <p>Transaction succeeded!</p>}
              {isError && <p>Transaction failed.</p>}
            </div>
          </div>
        </div>


      ) : (
        <div></div>
      )}

    </div>
  );
}





