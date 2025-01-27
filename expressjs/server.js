require('dotenv').config();
const express = require('express');
const { createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const cors = require('cors');

const { anvil } = require('viem/chains');

const app = express();
const PORT = process.env.PORT || 5000;

// 配置 CORS
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN, // 允許的來源
    methods: ['GET', 'POST'],        // 允許的 HTTP 方法
    allowedHeaders: ['Content-Type', 'Authorization'], // 允許的自訂標頭
}));

// 使用 JSON body parser
app.use(express.json());

// 配置 Viem Wallet Client
const walletClient = createWalletClient({
    chain: anvil,
    transport: http(process.env.RPC_URL), 
    account: privateKeyToAccount(process.env.OWNER_PRIVATE_KEY), 
});

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
    console.log(`Server is running on http://localhost:${PORT}`);
});

