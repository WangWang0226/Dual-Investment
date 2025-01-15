'use client';
import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useConnect, useDisconnect, useBalance, useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "ethers";
import FAUCET_ABI from './abi/faucetAbi.js';
import VAULT_ABI from './abi/vaultAbi.js';
import ERC20_ABI from './abi/ERC20Abi.js';

const FAUCET_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS;
const TOKEN0_ADDRESS = process.env.NEXT_PUBLIC_TOKEN0_ADDRESS
const TOKEN1_ADDRESS = process.env.NEXT_PUBLIC_TOKEN1_ADDRESS
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS

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
  const [vaultBalanceToken0, setVaultBalanceToken0] = useState("0");
  const [vaultBalanceToken1, setVaultBalanceToken1] = useState("0");

  const [transactionHash, setTransactionHash] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [cashAmount, setCashAmount] = useState("");



  const { data: claimTokenData } = useSimulateContract({
    address: FAUCET_CONTRACT_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "claimToken",
  });

  const { data: approveDepositData } = useSimulateContract({
    address: TOKEN1_ADDRESS, //USDC
    abi: ERC20_ABI,
    functionName: "approve",
    args: [
      VAULT_ADDRESS,
      cashAmount ? BigInt(cashAmount * 10 ** 6) : BigInt(0), // Convert user input to BigInt
    ],
  });

  const { data: depositData } = useSimulateContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "deposit",
    args: [
      address,
      cashAmount ? BigInt(cashAmount * 10 ** 6) : BigInt(0), // Convert user input to BigInt
    ],
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

  // Handle user input change
  const handleInputChange = (event) => {
    setCashAmount(event.target.value);
    console.log("input cashAmount: ", event.target.value)
  };

  const isAmountValid = cashAmount && parseFloat(cashAmount) > 0; // 驗證金額是否有效


  // 提取並同步交易狀態
  useEffect(() => {
    if (result) {
      setIsLoading(result.isLoading);
      setIsSuccess(result.isSuccess);
      setIsError(result.isError);
      if (result.isSuccess) {
        refetchBalances()
        refetchVaultBalances()
      }
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

  // 獲取 Vault Token0（WETH）的餘額
  const { data: vaultToken0BalanceData, refetch: refetchVaultToken0 } = useBalance({
    address: VAULT_ADDRESS,
    token: TOKEN0_ADDRESS,
    watch: true,
  });

  // 獲取 Vault Token0（WETH）的餘額
  const { data: vaultToken1BalanceData, refetch: refetchVaultToken1 } = useBalance({
    address: VAULT_ADDRESS,
    token: TOKEN1_ADDRESS,
    watch: true,
  });

  // 定義更新餘額的方法
  const refetchVaultBalances = () => {
    refetchVaultToken0();
    refetchVaultToken1();
  };

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

  // 更新 Vault Token0 餘額
  useEffect(() => {
    if (vaultToken0BalanceData?.value !== undefined && vaultToken0BalanceData?.decimals !== undefined) {
      setVaultBalanceToken0(formatUnits(vaultToken0BalanceData.value, vaultToken0BalanceData.decimals));
    } else {
      console.warn("Vault Token0 balance data is incomplete:", vaultToken0BalanceData);
    }
  }, [vaultToken0BalanceData]);


  useEffect(() => {
    if (vaultToken1BalanceData?.value !== undefined && vaultToken1BalanceData?.decimals !== undefined) {
      setVaultBalanceToken1(formatUnits(vaultToken1BalanceData.value, vaultToken1BalanceData.decimals));
    } else {
      console.warn("Vault Token1 balance data is incomplete:", vaultToken1BalanceData);
    }
  }, [vaultToken1BalanceData]);



  return (
    <div>
      <h1>Dual Investment DApp</h1>
      <ConnectButton />
      {isConnected ? (
        <div>
          <div>
            <p>Connected to: {address}</p>
            <button onClick={disconnect}>Disconnect</button>
            <p>Your Token0 (WETH) Balance: {balanceToken0}</p>
            <p>Your Token1 (USDC) Balance: {balanceToken1}</p>
            <p>Vault's Token0 (WETH) Balance: {vaultBalanceToken0}</p>
            <p>Vault's Token1 (USDC) Balance: {vaultBalanceToken1}</p>

            <div>
              <button
                disabled={!Boolean(claimTokenData?.request)}
                onClick={() => writeContract(claimTokenData.request)}
              >
                Claim Tokens
              </button>
            </div>

            <div>
              {!isAmountValid && (
                <p style={{ color: "red", fontSize: "14px" }}>
                  Please enter a valid amount greater than 0.
                </p>
              )}
              <label>
                Enter cash amount (e.g., USDC):
                <input
                  type="number"
                  value={cashAmount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                />
              </label>

              <button
                disabled={!isAmountValid || !Boolean(approveDepositData?.request)} // 新增驗證條件
                onClick={() => writeContract(approveDepositData.request)}
              >
                Approve deposit with {cashAmount} USDC to Vault
              </button>

              <button
                disabled={!isAmountValid || !Boolean(depositData?.request)} // 新增驗證條件
                onClick={() => writeContract(depositData.request)}
              >
                Deposit
              </button>

            </div>
          </div>
          {isLoading && <p style={{ color: "blue", fontSize: "14px" }}>Transaction in progress...</p>}
          {isSuccess && <p style={{ color: "green", fontSize: "14px" }}>Transaction succeeded!</p>}
          {isError && <p style={{ color: "red", fontSize: "14px" }}>Transaction failed.</p>}
        </div>


      ) : (
        <div></div>
      )}

    </div>
  );
}





