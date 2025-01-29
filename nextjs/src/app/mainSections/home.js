"use client";

import React, { useEffect, useState } from 'react';

export default function Home() {
    const [blur, setBlur] = useState(2); 

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY; 
            const newBlur = Math.max(0, 2 - (scrollY / 100 * 2)); 
            setBlur(newBlur);
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className='flex flex-col h-screen justify-center items-center'>
            <h1 className='title-primary text-center mb-6 text-white z-10'>Welcome to <br /> Licheng's Dual Investment Playground</h1>
            <div className='homepage-overlay'></div>
            <div className='background bg-wallpaper3'
                style={{ filter: `blur(${blur}px)` }}></div>
        </div>

    );
}