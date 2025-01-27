import React, { useState, useEffect } from "react";

export default function PriceBanner({price}) {

    return (
        <div className="price-simulator-container">
            <h1 className="h1">PUPU Coin Price</h1>
            <p className="title-primary ">
                ${price.toFixed(2)}
            </p>
        </div>
    );
}
