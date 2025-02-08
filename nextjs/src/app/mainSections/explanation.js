import React, { useState } from 'react';

import DualInvestmentDiagram from '../components/dualInvestmentDiagram.js';
import { DocumentDuplicateIcon, CheckIcon } from "@heroicons/react/24/outline";

export default function Explanation() {
    const TOKEN0_ADDRESS = process.env.NEXT_PUBLIC_TOKEN0_ADDRESS
    const TOKEN1_ADDRESS = process.env.NEXT_PUBLIC_TOKEN1_ADDRESS
    const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS
    const [copied, setCopied] = useState(null);

    const addresses = {
        USDL: TOKEN1_ADDRESS,
        PUPU: TOKEN0_ADDRESS,
        Vault: VAULT_ADDRESS
    };

    const handleCopy = (address, key) => {
        navigator.clipboard.writeText(address);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000); // 2 秒後恢復按鈕狀態
    };

    const truncateAddress = (address) =>
        `${address.slice(0, 5)}...${address.slice(-5)}`;

    return (
        <div className="explanation-container">
            <div className='explanation-sub-container'>
                <h1 className='h1'> What is Dual-Investment?</h1>
                <p className='content-primary'> Dual investment is a structured financial product that allows investors to earn high yields by speculating on asset prices at maturity. It involves two assets: a base asset (e.g., USDL) and a linked asset (e.g., PUPU Coin). Investors choose a maturity date, earning returns based on market performance.
                    <br />
                </p>
                <h1 className='h1 pt-4'> How to Play?</h1>
                <h2 className='h2'>
                    Step 1. Claim USDL <br />
                    Step 2. Input amount and choose duration <br />
                    Step 3. Approve and Deposit <br />
                    Step 4. Wait for maturity <br />
                    Step 5. Redeem your position!
                </h2>
                <h2 className='h1 pt-4'> Token Addresses (on Sepolia)</h2>
                {Object.entries(addresses).map(([key, address]) => (
                    <div key={key} className="flex items-center">
                        <span className="text-2xl">{key} : {truncateAddress(address)}</span>
                        <button
                            onClick={() => handleCopy(address, key)}
                            className="ml-3 px-2 py-1"
                        >
                            {copied === key ? (
                                <CheckIcon className="w-5 h-5" />
                            ) : (
                                <DocumentDuplicateIcon className="w-5 h-5" />
                            )}
                        </button>

                    </div>
                ))}
            </div>
            <div className='explanation-sub-container'>
                <h1 className='h1'> For example,</h1>
                <p className='content-primary'>
                    you invest 2,000 USDL at a 10% interest rate with a current price of 1,000 PUPU/USDL, then $1000 is your strike price. At maturity, two outcomes are possible:
                    <br />
                    1. PUPU Price Above 1,000:
                    You redeem 2,200 USDL (2,000 × 1.10), earning a higher return in stablecoin.
                    <br />
                    2. PUPU Price Below 1,000:
                    Your investment is converted to 2.2 PUPU (2,000 / 1,000 × 1.10), letting you accumulate more PUPU.
                    <br />
                </p>
                <DualInvestmentDiagram />
                <p className='content-primary'>This strategy ensures you earn a 10% return while managing risk, whether in stablecoins or PUPU. It’s a win-win investment approach!</p>
            </div>

        </div>
    )
}