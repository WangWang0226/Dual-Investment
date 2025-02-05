
import DualInvestmentDiagram from '../components/dualInvestmentDiagram.js';

export default function Explanation() {
    return (
        <div className="explanation-container">
            <div className='explanation-sub-container'>
                <h1 className='h1'> What is Dual-Investment?</h1>
                <p className='content-primary'> Dual investment is a structured financial product that allows investors to earn high yields by speculating on asset prices at maturity. It involves two assets: a base asset (e.g., USDL) and a linked asset (e.g., PUPU Coin). Investors choose a maturity date, earning returns based on market performance.
                    <br />
                </p>
                <h1 className='h1 pt-8'> How to Play?</h1>
                <h2 className='h2'>
                    Step 1. Claim USDL <br />
                    Step 2. Input amount and choose duration <br />
                    Step 3. Approve and Deposit <br />
                    Step 4. Wait for maturity <br />
                    Step 5. Redeem your position!
                </h2>
            </div>
            <div className='explanation-sub-container'>
                <h1 className='h1'> For example,</h1>
                <p className='content-primary'>
                    you invest 2,000 USDL at a 10% interest rate with a current price of 1,000 PUPU/USDL. At maturity, two outcomes are possible:
                    <br />
                    - PUPU Price Above 1,000 PUPU/USDL:
                    You redeem 2,200 USDL (2,000 × 1.10), earning a higher return in stablecoin.
                    <br />
                    - PUPU Price Below 1,000 PUPU/USDL:
                    Your investment is converted to 2.2 PUPU (2,000 ÷ 1,000 × 1.10), letting you accumulate more PUPU.
                    <br />
                </p>
                <DualInvestmentDiagram />
                <p className='content-primary'>This strategy ensures you earn a 10% return while managing risk, whether in stablecoins or PUPU. It’s a win-win investment approach!</p>
            </div>

        </div>
    )
}