const INTEREST_RATE = Number(process.env.NEXT_PUBLIC_INTEREST_RATE)

export default function ReturnInfoCard({inputCashAmount, strikePrice}) {

    const estReturnUSDL = (inputCashAmount * (1+INTEREST_RATE)).toFixed(2)
    const estReturnPUPU = (inputCashAmount/strikePrice * (1 + INTEREST_RATE)).toFixed(2)

    return (
        <div className="return-info-card">
            <h1 className='text-3xl'> Strike Price: {strikePrice.toFixed(2)}</h1>
            
            <div className="return-info-card-title">
                <span>Est. return after the maturity date</span>
            </div>

            {/* Condition 1: If market price > strike price*/}
            <div className="return-info-condition green">
                <div className="label">If the market price &gt; strike price</div>
                <div className="flex items-center">                    
                    <span className="value flex flex-row items-center">Receive 
                    <img src="/USDL.jpeg" alt="USDL" className="token-icon" />
                        {estReturnUSDL} USDL
                    </span>
                </div>
            </div>

            {/* Condition 2: If market price < strike price */}
            <div className="return-info-condition red">
                <div className="label">If the market price &lt; strike price</div>
                <div className="flex items-center">
                    <span className="value flex flex-row items-center">Receive 
                    <img src="/PUPU.jpeg" alt="PUPU" className="token-icon" />
                        {estReturnPUPU} PUPU
                        </span>
                </div>
            </div>
        </div>
    );
}
