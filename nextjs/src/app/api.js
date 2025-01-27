import ORACLE_ABI from './abi/OracleAbi.js';

const ORACLE_ADDRESS = process.env.NEXT_PUBLIC_ORACLE_ADDRESS
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export const callContract = async ({ contractAddress, abi, functionName, args }) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/callContract`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contractAddress,
                abi,
                functionName,
                args,
            }),
        });

        const data = await response.json();
        if (data.success) {
            console.log(`Transaction successful! FunctionName: ${data.functionName}, Hash:, ${data.txHash}`);
            return { success: true, txHash: data.txHash };
        } else {
            console.error('Transaction failed:', data.error);
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('API call error:', error);
        return { success: false, error: error.message };
    }
};


export const setOraclePrice = async (latestPrice) => {
    const result = await callContract({
        contractAddress: ORACLE_ADDRESS,
        abi: ORACLE_ABI,
        functionName: "setCurrentPrice",
        args: [(Math.round(latestPrice * 10 ** 6))],
    });

    if (result.success) {
        console.log('Set Oracle Price succeed. Tx hash:', result.txHash);
    } else {
        console.error('Set Oracle Price Error:', result.error);
    }
};
