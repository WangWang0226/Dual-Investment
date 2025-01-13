'use client';
import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useConnect, useDisconnect, useBalance, useWriteContract, useSimulateContract } from "wagmi";
import { formatUnits } from "ethers";

const FAUCET_CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"; // 替換為你的 Faucet 合約地址
const FAUCET_ABI = [
	{
		"inputs": [],
		"name": "claimToken",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_token0",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_token1",
				"type": "address"
			}
		],
		"name": "setToken",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "token0",
		"outputs": [
			{
				"internalType": "contract token",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "token1",
		"outputs": [
			{
				"internalType": "contract token",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "tokenClaimed",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]


const TOKEN0_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // 替換為你的 Token0 地址（WETH）
const TOKEN1_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // 替換為你的 Token1 地址（USDC）


export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [balanceToken0, setBalanceToken0] = useState("0");
  const [balanceToken1, setBalanceToken1] = useState("0");


  const { data } = useSimulateContract({
    address: FAUCET_CONTRACT_ADDRESS,
    abi: FAUCET_ABI,
    functionName: "claimToken",
  });

  const { writeContract } = useWriteContract();

  // 獲取 Token0（WETH）的餘額
  const { data: token0BalanceData } = useBalance({
    address: address,
    token: TOKEN0_ADDRESS,
    watch: true,
  });

  // 獲取 Token1（USDC）的餘額
  const { data: token1BalanceData } = useBalance({
    address: address,
    token: TOKEN1_ADDRESS,
    watch: true,
  });

  // 更新 Token0 餘額
  useEffect(() => {
    if (token0BalanceData?.value && token0BalanceData?.decimals !== undefined) {
      setBalanceToken0(formatUnits(token0BalanceData.value, token0BalanceData.decimals));
    } else {
      console.warn("Token0 balance data is incomplete:", token0BalanceData);
    }
  }, [token0BalanceData]);

  // 更新 Token1 餘額
  useEffect(() => {
    if (token1BalanceData?.value && token1BalanceData?.decimals !== undefined) {
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
            </div>
          </div>
        </div>


      ) : (
        <div></div>
      )}

    </div>
  );
}





