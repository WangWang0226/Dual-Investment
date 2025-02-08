
export default function AboutThisProject() {

    return (
        <div className="font-arial pl-16 pr-16">
            <h1 className="h1"> Overview: </h1>
            <p className="content-primary ">
                This dual-investment platform, developed by Licheng, showcases my full-stack skills in frontend, backend, and blockchain smart contracts. It simulates a financial mechanism where users invest and earn returns based on market conditions, demonstrating DeFi implementation. The frontend, built with Next.js, offers an intuitive user experience, while the backend, powered by Express.js, enables smooth API and blockchain interactions. Solidity smart contracts on the Sepolia testnet handle secure, automated transactions. This project highlights my ability to integrate diverse technologies into a cohesive and high-standard application.
            </p>
            <h1 className="h1 mt-8"> Tech Stack: </h1>
            <h2 className="content-primary">
                - Frontend: Next.js, Tailwind CSS, Wagmi, RainbowKit, Viem. <br />
                - Backend: Express.js. <br />
                - Blockchain: Solidity, Foundry, Anvil. <br />
                - Testing & Deployment: Vercel for frontend and backend deployment, Postman for API testing.
            </h2>
            <h1 className="h1 mt-8"> Github Repo: <br />
                <a target="_blank" href="https://github.com/WangWang0226/Dual-Investment/tree/master" className="link-primary"> https://github.com/WangWang0226/Dual-Investment/tree/master</a>
            </h1>
        </div>
    );
}
