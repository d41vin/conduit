
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.CIRCLE_TESTNET_API_KEY;
// Using the secret generated in the previous step by the user's run
const ENTITY_SECRET = '38ccdec75824d74339b38be8d3e5657c60b6069a1c3bfb8a3dedc747143cbc63';

if (!API_KEY) {
    console.error('❌ Error: CIRCLE_TESTNET_API_KEY is missing');
    process.exit(1);
}

const client = initiateDeveloperControlledWalletsClient({
    apiKey: API_KEY,
    entitySecret: ENTITY_SECRET
});

async function main() {
    try {
        console.log('🔄 Testing SDK Action (Create Wallet Set)...');
        console.log('   This confirms if the Entity Secret works without manual registration.');

        // We use a random name to avoid collisions
        const idempotencyKey = crypto.randomUUID();
        const res = await client.createWalletSet({
            idempotencyKey,
            name: `Test Set ${Date.now()}`
        });

        console.log('✅ SDK Action Successful!');
        console.log('   Wallet Set ID:', res.data?.walletSet?.id);
    } catch (error: any) {
        console.error('❌ SDK Action Failed:', error.message);
        if (error.response) {
            console.error('   API Error:', JSON.stringify(error.response.data));
        }
    }
}

main();
