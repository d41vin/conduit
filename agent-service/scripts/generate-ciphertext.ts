
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import forge from 'node-forge';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const API_KEY = process.env.CIRCLE_TESTNET_API_KEY;
// Start with the one generated previously, or read from env
let entitySecret = process.env.ENTITY_SECRET || '38ccdec75824d74339b38be8d3e5657c60b6069a1c3bfb8a3dedc747143cbc63';

if (!API_KEY) {
    console.error('❌ Error: CIRCLE_TESTNET_API_KEY is missing in .env');
    process.exit(1);
}

const client = initiateDeveloperControlledWalletsClient({
    apiKey: API_KEY,
    entitySecret: entitySecret // Client needs a 32-byte hex string
});

async function main() {
    try {
        console.log('🔄 Fetching Entity Public Key...');
        const res = await client.getPublicKey();
        const publicKeyString = res.data?.publicKey;

        if (!publicKeyString) {
            throw new Error('Failed to fetch Public Key');
        }
        console.log('✅ Public Key found.');

        console.log('\n🔐 Encrypting Entity Secret...');
        const entitySecretBytes = forge.util.hexToBytes(entitySecret);
        const publicKey = forge.pki.publicKeyFromPem(publicKeyString);
        const encryptedData = publicKey.encrypt(entitySecretBytes, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: { md: forge.md.sha256.create() },
        });
        const entitySecretCiphertext = forge.util.encode64(encryptedData);

        console.log('\n' + '='.repeat(60));
        console.log('🚀 ACTION REQUIRED');
        console.log('='.repeat(60));
        console.log('\nThe automated API registration failed (404), which is common.');
        console.log('You must manually register this Ciphertext in the Circle Console.');
        console.log('\n1. Go to: https://console.circle.com/');
        console.log('2. Navigate to: Developer-Controlled Wallets -> Configuration (or similar)');
        console.log('3. Find "Entity Secret" or "Ciphertext" registration.');
        console.log('4. Paste the following value:\n');
        console.log(entitySecretCiphertext);
        console.log('\n' + '='.repeat(60));

        // Also save to .env if not present
        const envPath = path.resolve(__dirname, '../.env');
        let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

        if (!process.env.ENTITY_SECRET) {
            console.log('\n⚠️  ENTITY_SECRET was not in your .env file.');
            console.log('   I am NOT automatically adding it to avoid overwriting.');
            console.log(`   Please add this line to your .env file manually if you want to keep using this secret:\n`);
            console.log(`ENTITY_SECRET=${entitySecret}`);
        }

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

main();
