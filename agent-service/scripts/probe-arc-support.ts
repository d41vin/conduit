
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const API_KEY = process.env.CIRCLE_TESTNET_API_KEY;
const ENTITY_SECRET = process.env.ENTITY_SECRET;
const WALLET_SET_ID = process.env.CIRCLE_WALLET_SET_ID;

if (!API_KEY || !ENTITY_SECRET || !WALLET_SET_ID) {
    console.error('❌ Missing configs');
    process.exit(1);
}

const client = initiateDeveloperControlledWalletsClient({
    apiKey: API_KEY,
    entitySecret: ENTITY_SECRET
});

async function probeChain(chain: any) {
    console.log(`\n🔍 Probing Blockchain: "${chain}"...`);
    try {
        const res = await client.createWallets({
            idempotencyKey: crypto.randomUUID(),
            blockchains: [chain],
            count: 1,
            walletSetId: WALLET_SET_ID as string
        });
        console.log(`✅ SUCCESS! Created wallet on ${chain}`);
        console.log('   Address:', res.data?.wallets?.[0].address);
        return true;
    } catch (error: any) {
        if (error.response) {
            console.log(`❌ Failed:`, JSON.stringify(error.response.data));
        } else {
            console.log(`❌ Error:`, error.message);
        }
        return false;
    }
}

async function main() {
    // Try likely candidates based on Circle naming conventions (ETH-SEPOLIA, AVAX-FUJI, etc.)
    const candidates = ['ARC-TESTNET', 'ARC', 'ARC_TESTNET'];

    for (const chain of candidates) {
        const success = await probeChain(chain);
        if (success) process.exit(0);
    }
    console.log('\n🏁 Probe Finished.');
}

main();
