import React, { useState, useEffect } from "react";

export default function PriceSimulator() {
    const [price, setPrice] = useState(1000); // 初始化價格

    useEffect(() => {
        const simulatePriceChange = () => {
            const randomChange = (Math.random() - 0.5) * 10; // 每次價格波動範圍為 ±5
            setPrice((prevPrice) => {
                let newPrice = prevPrice + randomChange;
                if (newPrice > 1030) newPrice = 1030;
                if (newPrice < 980) newPrice = 980;

                return newPrice;
            });
        };

        const interval = setInterval(simulatePriceChange, 5000); 
        return () => clearInterval(interval); 
    }, []);

    return (
        <div className="price-simulator-container">
            <h1 className="h1">PUPU Coin Price</h1>
            <p className="title-primary ">
                ${price.toFixed(2)}
            </p>
        </div>
    );
}
