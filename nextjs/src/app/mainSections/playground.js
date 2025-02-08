"use client";

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';

import { useBalance, useReadContract, useSimulateContract } from "wagmi";
import { formatUnits } from "ethers";
import FAUCET_ABI from '../abi/faucetAbi.js';
import VAULT_ABI from '../abi/vaultAbi.js';
import ERC20_ABI from '../abi/ERC20Abi.js';
import { setOraclePrice } from '../api.js';
import ReturnInfoCard from '../components/returnInfoCard.js';
import PriceBanner from "../components/priceBanner.js";


const FAUCET_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS;
const TOKEN0_ADDRESS = process.env.NEXT_PUBLIC_TOKEN0_ADDRESS
const TOKEN1_ADDRESS = process.env.NEXT_PUBLIC_TOKEN1_ADDRESS
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS
const INTEREST_RATE = Number(process.env.NEXT_PUBLIC_INTEREST_RATE) * 100

export default forwardRef(function Playground({ userAddr, isConnected, writeContract, lastestResult, latestPrice, usdlBalance }, ref) {
    const [vaultBalanceToken0, setVaultBalanceToken0] = useState("0");
    const [vaultBalanceToken1, setVaultBalanceToken1] = useState("0");
    const [cashAmount, setCashAmount] = useState("");
    const [selectedDuration, setSelectedDuration] = useState("45s");
    const [allowanceEnough, setAllowanceEnough] = useState(false);


    useImperativeHandle(ref, () => ({
        onWalletConnect() {
            checkClaimed()
        },
    }));

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
            cashAmount ? BigInt(cashAmount * 10 ** 6) : BigInt(0),
        ],
    });

    // Handle user input change
    const handleInputChange = (event) => {
        setCashAmount(event.target.value);
        console.log("input cashAmount: ", event.target.value)
    };

    const isAmountValid = cashAmount && parseFloat(cashAmount) > 0 && cashAmount <= usdlBalance;

    const handleDeposit = async () => {

        try {
            const setPriceResult = await setOraclePrice(latestPrice);
            console.log("Oracle price set successfully:", setPriceResult.txHash);

            const selectedValue = depositDurations.find((duration) => duration.label === selectedDuration)?.value;

            const currentTimestamp = Math.floor(Date.now() / 1000);
            const expiryTimestamp = currentTimestamp + Number(selectedValue);

            writeContract({
                address: VAULT_ADDRESS,
                abi: VAULT_ABI,
                functionName: "deposit",
                args: [
                    userAddr,
                    cashAmount ? BigInt(cashAmount * 10 ** 6) : BigInt(0),
                    expiryTimestamp,
                ],
            });
            console.log("Deposit successful!");
        } catch (error) {
            console.error("Error during deposit:", error);
        }
    };

    const { data: isClaimed, refetch: checkClaimed } = useReadContract({
        address: FAUCET_CONTRACT_ADDRESS,
        abi: FAUCET_ABI,
        functionName: "tokenClaimed",
        args: [userAddr],
        enabled: Boolean(userAddr),
    });

    const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
        address: TOKEN1_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [userAddr, VAULT_ADDRESS], // owner: user address, spender: vault address
    });

    useEffect(() => {
        if (allowanceData !== null && allowanceData !== undefined) {
            const allowance = formatUnits(allowanceData, 6)
            setAllowanceEnough(allowance >= cashAmount)
        }
    }, [allowanceData, cashAmount])

    // tx on success listener
    useEffect(() => {
        if (lastestResult.isSuccess) {
            refetchVaultBalances()
            checkClaimed()
            refetchAllowance()
        }
    }, [lastestResult]);

    // fetch Vault Token0（PUPU）balance
    const { data: vaultToken0BalanceData, refetch: refetchVaultToken0 } = useBalance({
        address: VAULT_ADDRESS,
        token: TOKEN0_ADDRESS,
        watch: true,
    });

    // fetch Vault Token1（USDL）balance
    const { data: vaultToken1BalanceData, refetch: refetchVaultToken1 } = useBalance({
        address: VAULT_ADDRESS,
        token: TOKEN1_ADDRESS,
        watch: true,
    });

    const refetchVaultBalances = () => {
        refetchVaultToken0();
        refetchVaultToken1();
    };

    // update Vault Token0 balance
    useEffect(() => {
        if (vaultToken0BalanceData?.value !== undefined && vaultToken0BalanceData?.decimals !== undefined) {
            setVaultBalanceToken0(formatUnits(vaultToken0BalanceData.value, vaultToken0BalanceData.decimals));
        } else {
            console.warn("Vault Token0 balance data is incomplete:", vaultToken0BalanceData);
        }
    }, [vaultToken0BalanceData]);

    // update Vault Token1 balance
    useEffect(() => {
        if (vaultToken1BalanceData?.value !== undefined && vaultToken1BalanceData?.decimals !== undefined) {
            setVaultBalanceToken1(formatUnits(vaultToken1BalanceData.value, vaultToken1BalanceData.decimals));
        } else {
            console.warn("Vault Token1 balance data is incomplete:", vaultToken1BalanceData);
        }
    }, [vaultToken1BalanceData]);

    return (
        <div className='playground-container'>
            <PriceBanner price={latestPrice} />
            <div className='playground-sub-container '>
                <div className='playground-sub-left-container'>
                    <div className='invest-container'>


                        {isConnected ? (
                            <div className='flex flex-col gap-8 w-3/4 content-primary'>
                                <div className='flex flex-col'>
                                    <h1 className='text-xl'> Step 1: Claim your USDL to play</h1>
                                    <button
                                        className='playground-button'
                                        disabled={!Boolean(claimTokenData?.request) || isClaimed}
                                        onClick={() => writeContract(claimTokenData.request)}
                                    >
                                        {isClaimed ? "Claimed Successfully!" : "Claim Your USDL"}
                                    </button>
                                </div>

                                <div className='flex flex-col'>
                                    <h1 className='text-xl'> Step 2: Input amount and choose duration</h1>
                                    <div className='input-container '>
                                        <div className='flex flex-row justify-center items-center '>
                                            <img src='/USDL.jpeg' className="token-icon" />
                                            <input
                                                className='input-field'
                                                type="number"
                                                value={cashAmount}
                                                onChange={handleInputChange}
                                                placeholder="0.0"
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
                                </div>

                                <div className='flex flex-col'>
                                    <h1 className='text-xl'> Step 3: Approve & Deposit</h1>
                                    <button
                                        className='playground-button'
                                        disabled={!isAmountValid} // 新增驗證條件
                                        onClick={async () => {
                                            if (allowanceEnough) {
                                                await handleDeposit();
                                            } else {
                                                writeContract(approveDepositData.request);
                                            }
                                        }}
                                    >
                                        {allowanceEnough ? "Invest" : "Approve"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className='text-4xl font-bold'> Please connect your wallet</div>
                        )
                        }
                    </div>
                </div>


                <div className='playground-sub-right-container'>
                    <ReturnInfoCard strikePrice={latestPrice} inputCashAmount={cashAmount} />
                    <div className='flex-1'>
                        <h1 className='text-3xl'>Information</h1>
                        <div className='vaultStatusContainer flex-1'>

                            <h1 className='text-2xl'> Interest Rate: {INTEREST_RATE}%</h1>
                            <h1 className='text-2xl'>Current Vault Balances:</h1>
                            <p className='text-xl'> - PUPU: {vaultBalanceToken0}
                                <br /> - USDL: {vaultBalanceToken1}
                            </p>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    )
})