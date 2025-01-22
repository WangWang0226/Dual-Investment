"use client";

import React, { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useWriteContract, useReadContract, useSimulateContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "ethers";
import FAUCET_ABI from '../abi/faucetAbi.js';
import VAULT_ABI from '../abi/vaultAbi.js';
import ERC20_ABI from '../abi/ERC20Abi.js';
import Notification from "../components/notification.js";
import DualInvestmentDiagram from '../components/dualInvestmentDiagram.js';


const FAUCET_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS;
const TOKEN0_ADDRESS = process.env.NEXT_PUBLIC_TOKEN0_ADDRESS
const TOKEN1_ADDRESS = process.env.NEXT_PUBLIC_TOKEN1_ADDRESS
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS

export default function Playground({ userAddr, isConnected, refetchBalances }) {

    const [lastResult, setLastResult] = useState({}); // 儲存上一次的結果內容
    const [notifications, setNotifications] = useState([]);
    const [vaultBalanceToken0, setVaultBalanceToken0] = useState("0");
    const [vaultBalanceToken1, setVaultBalanceToken1] = useState("0");

    const [transactionHash, setTransactionHash] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);
    const [cashAmount, setCashAmount] = useState("");

    const [selectedDuration, setSelectedDuration] = useState("45s");

    // 添加通知
    const addNotification = (message) => {
        setNotifications((prev) => [...prev, { id: Date.now(), message }]);
    };

    // 移除通知
    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    };

    const depositDurations = [
        { label: "30s", value: "30" },
        { label: "45s", value: "45" },
        { label: "1min", value: "60" },
        { label: "2min", value: "120" },
    ];

    const { data: claimTokenData } = useSimulateContract({
        address: FAUCET_CONTRACT_ADDRESS,
        abi: FAUCET_ABI,
        functionName: "claimToken",
    });

    const { data: approveDepositData } = useSimulateContract({
        address: TOKEN1_ADDRESS, //USDL
        abi: ERC20_ABI,
        functionName: "approve",
        args: [
            VAULT_ADDRESS,
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

    const handleDeposit = () => {
        const selectedValue = depositDurations.find((duration) => duration.label === selectedDuration)?.value;

        const currentTimestamp = Math.floor(Date.now() / 1000); // 當前時間戳（秒）
        const expiryTimestamp = currentTimestamp + Number(selectedValue);

        console.log("Current Timestamp:", currentTimestamp);
        console.log("Expiry Timestamp:", expiryTimestamp);

        writeContract({
            address: VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "deposit",
            args: [
                userAddr,
                cashAmount ? BigInt(cashAmount * 10 ** 6) : BigInt(0), // Convert user input to BigInt
                expiryTimestamp,
            ],
        });
    };

    const { data: hasClaimed } = useReadContract({
        address: FAUCET_CONTRACT_ADDRESS,
        abi: FAUCET_ABI,
        functionName: "tokenClaimed",
        args: [userAddr], // 傳入當前用戶地址
        enabled: Boolean(userAddr), // 僅在地址存在時啟用
    });

    // 提取並同步交易狀態
    useEffect(() => {
        const isDifferent =
            result.isLoading !== lastResult.isLoading ||
            result.isSuccess !== lastResult.isSuccess ||
            result.isError !== lastResult.isError;
        if (isDifferent) {
            setLastResult(result); // 更新最新結果

            if (result.isLoading) {
                addNotification("Transaction is loading...");
            } else if (result.isSuccess) {
                refetchBalances()
                refetchVaultBalances()
                addNotification("Transaction successful!");
            } else if (result.isError) {
                addNotification("Transaction failed!");
            }
        }

    }, [result]);

    // 獲取 Vault Token0（PUPU）的餘額
    const { data: vaultToken0BalanceData, refetch: refetchVaultToken0 } = useBalance({
        address: VAULT_ADDRESS,
        token: TOKEN0_ADDRESS,
        watch: true,
    });

    // 獲取 Vault Token1（USDL）的餘額
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

    // 更新 Vault Token0 餘額
    useEffect(() => {
        if (vaultToken0BalanceData?.value !== undefined && vaultToken0BalanceData?.decimals !== undefined) {
            setVaultBalanceToken0(formatUnits(vaultToken0BalanceData.value, vaultToken0BalanceData.decimals));
        } else {
            console.warn("Vault Token0 balance data is incomplete:", vaultToken0BalanceData);
        }
    }, [vaultToken0BalanceData]);

    // 更新 Vault Token1 餘額
    useEffect(() => {
        if (vaultToken1BalanceData?.value !== undefined && vaultToken1BalanceData?.decimals !== undefined) {
            setVaultBalanceToken1(formatUnits(vaultToken1BalanceData.value, vaultToken1BalanceData.decimals));
        } else {
            console.warn("Vault Token1 balance data is incomplete:", vaultToken1BalanceData);
        }
    }, [vaultToken1BalanceData]);

    return (
        <div className='h-screen flex flex-row pb-20 pt-24 max-w-7xl mx-auto'>
            <div className='playground-left-container'>
                {isConnected ? (
                    <div className='flex flex-col gap-8 w-3/4 content-primary'>
                        <button
                            className='gradient-button'
                            disabled={!Boolean(claimTokenData?.request) || hasClaimed}
                            onClick={() => writeContract(claimTokenData.request)}
                        >
                            {hasClaimed ? "Claimed Successfully!" : "Claim Your USDL"}
                        </button>

                        <div className='input-container'>
                            <div className='flex flex-row justify-center items-center'>
                                <img src='/USDL.jpeg' className="token-icon" />
                                <input
                                    className='input-field'
                                    type="number"
                                    value={cashAmount}
                                    onChange={handleInputChange}
                                    placeholder="Investment Amount"
                                />
                                <span className='token-name'>USDL</span>
                            </div>
                            <div className="tabs-container">
                                {depositDurations.map((duration) => (
                                    <button
                                        key={duration.label}
                                        onClick={() => setSelectedDuration(duration.label)}
                                        className={`tab ${selectedDuration === duration.label ? "active" : ""}`}
                                    >
                                        {duration.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            className='gradient-button'
                            disabled={!isAmountValid || !Boolean(approveDepositData?.request)} // 新增驗證條件
                            onClick={() => writeContract(approveDepositData.request)}
                        >
                            Approve
                        </button>

                        <button
                            className='gradient-button'
                            disabled={!isAmountValid || !selectedDuration} // 新增驗證條件
                            onClick={handleDeposit}
                        >
                            Deposit
                        </button>
                    </div>
                ) : (
                    <div className='text-4xl font-bold'> Please connect your wallet</div>
                )
                }
            </div>


            <div className='playground-right-container'>
                <div className='flex flex-row justify-center items-center'>
                    <div className='flex flex-2 flex-col p-8 '>
                        <h1 className='text-4xl'>- How to Play -</h1>
                        <h2 className='text-2xl'>
                            Step 1: Claim USDL to play.
                            <br />Step 2: Deposit your amount.
                            <br />Step 3: Wait for maturity.
                            <br />Step 4: Redeem rewards!
                        </h2>
                    </div>
                    <div className='vaultStatusContainer flex-1'>
                        <p className='text-2xl'> Current PUPU Price: 1022</p>
                        <p className='text-2xl'> Interest Rate: 10%</p>
                        <h1 className='text-2xl'>Vault Status:</h1>
                        <p className='text-xl'> - PUPU Balance: {vaultBalanceToken0}
                            <br /> - USDL Balance: {vaultBalanceToken1}
                        </p>
                    </div>
                </div>
                <DualInvestmentDiagram />
            </div>
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
    )
}