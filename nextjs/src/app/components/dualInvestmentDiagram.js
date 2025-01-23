'use client';

import React from "react";

export default function DualInvestmentDiagram() {
  return (
    <div className="diagram-container">
      <div className="horizontal-line"></div>

      {/* 左側折線圖區域 */}
      <div className="line-chart-container">
        {/* 折線圖 */}
        <svg width="100%" height="100%">
          {/* 圓滑折線圖 */}
          <path
            d="M10 150 
            C20 100, 40 100, 60 150 
            S80 220, 100 150 
            S120 250, 140 250
            S160 190, 180 155
            "
            fill="none"
            stroke="#6ad1e3"
            strokeWidth="2"
          />
          <line
            x1="180"
            y1="155"
            x2="180"
            y2="300"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* 在折線尾端添加圓點 */}
          <circle
            cx="180"
            cy="155"
            r="5"
            fill="#6ad1e3"
          />
        </svg>
        {/* 標記點和 Invest 文本 */}
        <div className="invest-point">
          <p>Invest 2000 USDL</p>
          {/* <img src="/USDL.jpeg" alt="USDL" className="ml-2 token-icon" /> */}
        </div>
        <div className="invest-point-now">
          <p>Now</p>
        </div>
        
        {/* Premium 文本 */}
        <div className="interest-rate">
          <p>10% Interest Rate</p>
        </div>
      </div>

      {/* 右側收益與損失區域 */}
      <div className="right-section">
        {/* 上方收益區 */}
        <div className="redeem-section">
          <div>
            <p>
              Redeem 2200 USDL<br/>
              2000 x (1+10%)
            </p>
          </div>
        </div>

        {/* 當前價格區 */}
        <div className="current-price-section">
          Current Price 1,000 PUPU/USDL
        </div>

        {/* 下方損失區 */}
        <div className="loss-section">
          <div>
            <p>
              Redeem 2.2 PUPU<br/>
              2 x (1+10%)
            </p>
          </div>
          <p className="maturity-text">Maturity</p>
        </div>
      </div>
    </div>
  );
}
