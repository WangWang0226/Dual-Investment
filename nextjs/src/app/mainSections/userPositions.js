"use client";

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useReadContract } from "wagmi";
import VAULT_ABI from '../abi/vaultAbi.js';
import ERC20_ABI from '../abi/ERC20Abi.js';
import PositionCard from "../components/positionCard.js";


const TOKEN0_ADDRESS = process.env.NEXT_PUBLIC_TOKEN0_ADDRESS
const TOKEN1_ADDRESS = process.env.NEXT_PUBLIC_TOKEN1_ADDRESS
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS

export default forwardRef(function UserPositions({ userAddr, isConnected, writeContract, lastestResult, latestPrice }, ref) {
    const [positions, setPositions] = useState([]);

    // 定義可以由父元件呼叫的方法
    useImperativeHandle(ref, () => ({
        onWalletConnect() {
            refetchPositions();
        },
    }));

    const { data: positionData, refetch: refetchPositions } = useReadContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "getAllPositions",
        args: [userAddr],
    });

    useEffect(() => {
        if (positionData != undefined) {
            console.log("positions:", positionData)
            setPositions(positionData)
        }
    }, [positionData])

    // tx on success listener
    useEffect(() => {
        if (lastestResult.isSuccess) {
            console.log("refetch positions:")
            refetchPositions();
        }
    }, [lastestResult]);

    return (
        <div className='user-position-container'>
            <h1 className='title-primary'> Your Positions</h1>
            {isConnected ? (
                <div className='overflow-y-auto'>
                    {positions.length > 0 ? (
                        <div className="grid-container">
                            {positions.map((position, index) => (
                                <PositionCard key={index} position={position} latestPrice={latestPrice} writeContract={writeContract}/>
                            ))}
                        </div>
                    ) : (
                        <p>No positions found for this wallet.</p>
                    )}
                </div>
            ) : (<div className='text-4xl font-bold'> Please connect your wallet</div>
            )}

        </div>
    )
})