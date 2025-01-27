require('dotenv').config();
const express = require('express');
const { createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const cors = require('cors');

const { anvil } = require('viem/chains');

const app = express();
const PORT = process.env.PORT;

// 配置 CORS
app.use(cors({
    origin: "*", 
    methods: ['GET', 'POST'],       
    allowedHeaders: ['Content-Type', 'Authorization'], 
}));

app.options('*', cors());

app.use(express.json());

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

