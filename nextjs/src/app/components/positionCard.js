"use client";

import React, { useEffect, useState } from 'react';
import { useReadContract, useSimulateContract } from "wagmi";
import { formatUnits } from "ethers";
import VAULT_ABI from '../abi/vaultAbi.js';
import { setOraclePrice } from '../api.js';


const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS
const INTEREST_RATE = Number(process.env.NEXT_PUBLIC_INTEREST_RATE)

const Status = {
  ACTIVE_PENDING: "ACTIVE_PENDING",
  ACTIVE_REDEEMABLE: "ACTIVE_REDEEMABLE",
  CLAIMED: "CLAIMED",
};

function convertLocalDateTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

export default function PositionCard({ position, latestPrice, writeContract }) {
  const [status, setStatus] = useState(null);
  const [isReceiveUSDL, setIsReceiveUSDL] = useState(null);

  const expiryTimestamp = Number(position.expiry) * 1000;

  const
    positionId = position.id,
    investUnits = Number(formatUnits(position.investUnits, 18)).toFixed(5),
    expiry = convertLocalDateTime(expiryTimestamp),
    strikePrice = Number(formatUnits(position.strikePrice, 6)).toFixed(5),
    isActive = position.isActive

  const investCashAmount = investUnits * strikePrice;

  const { data: redeemData } = useSimulateContract({
    address: VAULT_ADDRESS, //USDL
    abi: VAULT_ABI,
    functionName: "settleAndWithdraw",
    args: [
      positionId
    ],
  });

  const handleSettle = async () => {
    await setOraclePrice(latestPrice)

    writeContract({
      address: VAULT_ADDRESS, //USDL
      abi: VAULT_ABI,
      functionName: "settleAndWithdraw",
      args: [
        positionId
      ],
    })
  }

  function updatePositionStatus(latestPrice) {
    const currentTimestamp = Date.now();
    setIsReceiveUSDL(latestPrice > strikePrice);
    if (!isActive) {
      setStatus(Status.CLAIMED);
    } else if (currentTimestamp >= expiryTimestamp) {
      setStatus(Status.ACTIVE_REDEEMABLE);
    } else {
      setStatus(Status.ACTIVE_PENDING);
    }
  }

  const TokenReceive = () => {
    const isUSDL = isReceiveUSDL;
    const receiveAmount = isUSDL ? investCashAmount * (1 + INTEREST_RATE) : (investUnits * (1 + INTEREST_RATE)).toFixed(5);
    const tokenType = isUSDL ? "USDL" : "PUPU Coin";
    const tokenImage = isUSDL ? "/USDL.jpeg" : "/PUPU.jpeg";
    const priceComparisonText = isUSDL
      ? "Current Price > Strike Price, redeem now to"
      : "Current Price < Strike Price, redeem now to";

    return (
      status === Status.ACTIVE_REDEEMABLE ? (
        <div className="text-sm text-gray-300">
          <p>{priceComparisonText}</p>
          <p className="flex items-center gap-2 font-semibold text-lg">
            Receive
            <img src={tokenImage} alt={tokenType} className="w-6 h-6 rounded-full" />
            {receiveAmount} {tokenType}
          </p>
        </div>
      ) : status === Status.ACTIVE_PENDING ? (
        <div className="text-xl text-gray-300">
          <h1> Not expired yet</h1>
        </div>
      ) : (
        <div className="text-xl text-gray-300">
          <h1> Redeemed {receiveAmount} {tokenType} successfully !</h1>
        </div>
      )

    );
  };


  useEffect(() => {
    updatePositionStatus(latestPrice)
  }, [latestPrice, position])

  return (
    <div className="position-card">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className={`status-point ${status}`}
          />
          <span className={`status-text ${status}`}>
            {status === Status.ACTIVE_PENDING && <p>Not Expired Yet...</p>}
            {status === Status.ACTIVE_REDEEMABLE && <p>Redeemable!</p>}
            {status === Status.CLAIMED && <p>Redeemed!</p>}
          </span>
        </div>
        <span className="content-primary text-sm text-gray-400">
          Maturity Date: {expiry}
        </span>
      </div>

      {/* Investment Info */}
      <div className='content-primary flex flex-col'>
        <p>Investment Amount: {investCashAmount} USDL</p>
        <p>Strike Price: {strikePrice} USDL</p>
        <p>Investment Units: {investUnits} Units</p>
      </div>

      {/* Redeem Info */}
      <TokenReceive />

      <button
        className={`redeem-button ${status === Status.ACTIVE_REDEEMABLE
          ? "active"
          : ""
          }`}
        onClick={handleSettle}
      >
        Redeem
      </button>
      {status === Status.CLAIMED && <div className='position-card-overlay'>
        <h1> Redeemed !</h1>
      </div>
      }

    </div>
  );
}
