
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

const API_KEY = process.env.CIRCLE_TESTNET_API_KEY;
const ENTITY_SECRET = process.env.ENTITY_SECRET;

if (!API_KEY || !ENTITY_SECRET) {
    console.error('❌ Error: Missing CIRCLE_TESTNET_API_KEY or ENTITY_SECRET in .env');
    process.exit(1);
}

const client = initiateDeveloperControlledWalletsClient({
    apiKey: API_KEY,
    entitySecret: ENTITY_SECRET
});

async function updateEnv(key: string, value: string) {
    const envPath = path.resolve(__dirname, '../.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    // Check if key exists
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
        envContent += `\n${key}=${value}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`📝 Updated .env: ${key}=${value}`);
}

async function main() {
    try {
        console.log('🔄 Setting up Agent Wallet...');

        // We reuse the Wallet Set if it exists
        let walletSetId = process.env.CIRCLE_WALLET_SET_ID;

        if (!walletSetId) {
            console.log('   Creating new Wallet Set "Conduit Agents"...');
            const res = await client.createWalletSet({
                idempotencyKey: crypto.randomUUID(),
                name: 'Conduit Agents'
            });
            walletSetId = res.data?.walletSet?.id;
            if (!walletSetId) throw new Error('Failed to create Wallet Set');
            await updateEnv('CIRCLE_WALLET_SET_ID', walletSetId);
        } else {
            console.log(`   Using existing Wallet Set: ${walletSetId}`);
        }

        // We specifically want an ARC-TESTNET wallet now
        // There is no easy "list wallets by chain" in the simple SDK wrapper without filtering client-side
        // But since we just want *a* wallet, we can just create one or list and find.
        // Let's create one specifically for Arc if we haven't stored one for Arc.

        let walletId = process.env.CIRCLE_WALLET_ID_ARC;
        let walletAddress = '';

        if (!walletId) {
            console.log('   Creating new Wallet on ARC-TESTNET...');
            // Need to cast the string to 'any' or ignore TS because definitions might be stale
            const res = await client.createWallets({
                idempotencyKey: crypto.randomUUID(),
                blockchains: ['ARC-TESTNET'] as any,
                count: 1,
                walletSetId: walletSetId
            });
            const wallet = res.data?.wallets?.[0];
            if (!wallet) throw new Error('Failed to create Wallet');

            walletId = wallet.id;
            walletAddress = wallet.address;

            await updateEnv('CIRCLE_WALLET_ID_ARC', walletId);
            // Also update the main one for convenience
            await updateEnv('CIRCLE_WALLET_ID', walletId);
        } else {
            console.log(`   Fetching details for Wallet: ${walletId}`);
            const res = await client.getWallet({ id: walletId });
            const wallet = res.data?.wallet;
            if (!wallet) throw new Error('Failed to fetch Wallet details');
            walletAddress = wallet.address;
        }

        console.log('\n✅ Wallet Setup Complete!');
        console.log('--------------------------------------------------');
        console.log(`🆔 Wallet ID:      ${walletId}`);
        console.log(`🌐 Network:        ARC-TESTNET`);
        console.log(`📬 Wallet Address: ${walletAddress}`);
        console.log('--------------------------------------------------');
        console.log('\n⚠️  ACTION REQUIRED:');
        console.log(`Please fund this address with ARC Testnet USDC.`);
        console.log(`Faucet: https://faucet.circle.com/ (Select Arc Testnet)`);

    } catch (error: any) {
        console.error('❌ Setup Failed:', error.message);
        if (error.response) {
            console.error('   API Error:', JSON.stringify(error.response.data));
        }
    }
}

main();
