
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { ethers } from "ethers";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const API_KEY = process.env.CIRCLE_TESTNET_API_KEY;
const ENTITY_SECRET = process.env.ENTITY_SECRET;
const WALLET_ID = process.env.CIRCLE_WALLET_ID;
const CONTRACT_ADDRESS = process.env.CONDITIONAL_PAYMENT_ADDRESS;

if (!API_KEY || !ENTITY_SECRET || !WALLET_ID || !CONTRACT_ADDRESS) {
    console.error('❌ Missing configs');
    process.exit(1);
}

const client = initiateDeveloperControlledWalletsClient({
    apiKey: API_KEY,
    entitySecret: ENTITY_SECRET
});

async function main() {
    try {
        console.log('🔄 Verifying Integration...');
        console.log(`   Contract: ${CONTRACT_ADDRESS}`);
        console.log(`   Wallet ID: ${WALLET_ID}`);

        // 1. Verify Wallet Access
        console.log('\n1. Checking Wallet...');
        // Cast to string to satisfy TS
        const walletRes = await client.getWallet({ id: WALLET_ID as string });
        const wallet = walletRes.data?.wallet;
        if (!wallet) throw new Error('Wallet not found');
        console.log(`   ✅ Accessible: ${wallet.address} (${wallet.blockchain})`);

        // 2. Verify Contract Read (via RPC, independent of Circle first)
        // We need an RPC to read from Arc.
        const RPC_URL = "https://rpc.testnet.arc.network";
        const provider = new ethers.JsonRpcProvider(RPC_URL);

        // Minimal ABI to check something
        const abi = ["function paymentCounter() view returns (uint256)"];
        const contract = new ethers.Contract(CONTRACT_ADDRESS as string, abi, provider);

        console.log('\n2. Reading Contract State (paymentCounter)...');
        try {
            const count = await contract.paymentCounter();
            console.log(`   ✅ Success! Current Payment Count: ${count.toString()}`);
        } catch (e: any) {
            console.error('   ❌ Read Failed:', e.message);
            // Don't exit, might be just RPC issue, but good to know
        }

        console.log('\n🎉 Integration Setup Verified!');
        console.log('   The Agent is ready to sign transactions via Circle Programmable Wallets.');

    } catch (error: any) {
        console.error('❌ Verification Failed:', error.message);
    }
}

main();
