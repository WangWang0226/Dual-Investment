require('dotenv').config();
const express = require('express');
const { createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const cors = require('cors');

const { anvil, sepolia } = require('viem/chains');

const app = express();
const PORT = process.env.PORT;
const selectedChain = process.env.NODE_ENV === 'production' ? sepolia : anvil;


// 配置 CORS
app.use(cors({
    origin: "*", 
    methods: ['GET', 'POST'],       
    allowedHeaders: ['Content-Type', 'Authorization'], 
}));

app.options('*', cors());

app.use(express.json());

const walletClient = createWalletClient({
    chain: selectedChain,
    transport: http(process.env.RPC_URL), 
    account: privateKeyToAccount(process.env.OWNER_PRIVATE_KEY), 
});

app.get("/", (req, res) => res.send("Express running on Vercel!!"));

app.post('/api/callContract', async (req, res) => {
    try {
        const { contractAddress, abi, functionName, args } = req.body;

        const contract = {
            address: contractAddress,
            abi,
        };

        const txHash = await walletClient.writeContract({
            ...contract,
            functionName,
            args,
        });

        res.json({
            success: true,
            functionName: functionName,
            txHash,
        });

    } catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});

module.exports = app;



