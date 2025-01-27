"use client";

import React, { useEffect, useState } from 'react';
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "ethers";
import NavbarItem from '../components/navbarItem.js';

export default function Navbar({ balanceToken0, balanceToken1 }) {
    const [scrolled, setScrolled] = useState(false);

    return (
        <nav className='navbar'>

            <ConnectButton.Custom>
                {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    mounted,
                }) => {
                    return (
                        <div>

                            {account ? (
                                <div className='navbarContainer'>
                                    <div className='flex flex-row items-center pl-8'>
                                        <img src='/PUPU.jpeg' className="token-icon" style={{
                                            
                                        }}
                                        />
                                        <p className='text-white text-xl'>Licheng's Dual Investment</p>
                                    </div>
                                    <div className='navbarSubContainer'>
                                        <NavbarItem
                                            icon="./PUPU.jpeg"
                                            tokenName="PUPU"
                                            balance={balanceToken0}
                                        />
                                        <NavbarItem
                                            icon="./USDL.jpeg"
                                            tokenName="USDL"
                                            balance={balanceToken1}
                                        />
                                        <NavbarItem
                                            icon="./ETH.jpeg"
                                            tokenName="ETH"
                                            balance={parseFloat(account.balanceFormatted).toFixed()}
                                        />
                                        <p className='content-primary'>Chain: {chain.name}</p>
                                        <button className='button-wallet' onClick={openAccountModal}>{account.displayName}</button>
                                    </div>
                                </div>
                            ) : (
                                <div className='navbarContainer-wallet-disconnect'>
                                    <button className='button-wallet' onClick={() => openConnectModal()}>Connect Wallet</button>
                                </div>
                            )}
                        </div>
                    );
                }}
            </ConnectButton.Custom>
        </nav>
    );
}