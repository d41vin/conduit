
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import forge from 'node-forge';
import crypto from 'crypto';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_KEY = process.env.CIRCLE_TESTNET_API_KEY;

if (!API_KEY) {
    console.error('❌ Error: CIRCLE_TESTNET_API_KEY is missing');
    process.exit(1);
}

const client = initiateDeveloperControlledWalletsClient({
    apiKey: API_KEY,
    entitySecret: '0000000000000000000000000000000000000000000000000000000000000000'
});

async function registerWithUrl(baseUrl: string, path: string, payload: any, method: string = 'POST') {
    const fullUrl = `${baseUrl}${path}`;
    console.log(`\n🔄 Attempting ${method} on: ${fullUrl}`);
    const axiosClient = axios.create({
        baseURL: baseUrl,
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        validateStatus: () => true
    });

    try {
        let res;
        if (method === 'POST') res = await axiosClient.post(path, payload);
        else if (method === 'PUT') res = await axiosClient.put(path, payload);
        else res = await axiosClient.post(path, payload); // Default

        if (res.status === 200) {
            console.log('✅ Registration Successful!');
            return true;
        } else {
            console.log(`   [${res.status}] ${res.statusText}`);
            if (res.data) console.log(`   Error:`, JSON.stringify(res.data));
            return false;
        }
    } catch (error: any) {
        console.error(`   ❌ Error:`, error.message);
        return false;
    }
}

async function main() {
    try {
        console.log('STEP 1: Fetching Public Key via SDK...');
        const res = await client.getPublicKey();
        const publicKeyString = res.data?.publicKey;
        if (!publicKeyString) throw new Error('Public key not found');
        console.log('✅ Public Key Fetched.');

        console.log('\nSTEP 2: Generating & Encrypting Secret...');
        const entitySecret = crypto.randomBytes(32).toString('hex');
        console.log('--------------------------------------------------------');
        console.log('🚨 SAVE THIS ENTITY SECRET SECURELY:');
        console.log(`   ${entitySecret}`);
        console.log('--------------------------------------------------------');

        const entitySecretBytes = forge.util.hexToBytes(entitySecret);
        const publicKey = forge.pki.publicKeyFromPem(publicKeyString);
        const encryptedData = publicKey.encrypt(entitySecretBytes, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: { md: forge.md.sha256.create() },
        });
        const entitySecretCiphertext = forge.util.encode64(encryptedData);
        const payload = { entitySecretCiphertext };

        console.log('\nSTEP 3: Registering Secret with Validations...');

        const combinations = [
            // Try Sandbox - Standard Path
            { base: 'https://api-sandbox.circle.com', path: '/v1/w3s/config/entity/secret', method: 'POST' },
            // Try Sandbox - Root Entity Path
            { base: 'https://api-sandbox.circle.com', path: '/v1/w3s/config/entity', method: 'POST' },
            // Try Sandbox - PUT
            { base: 'https://api-sandbox.circle.com', path: '/v1/w3s/config/entity/secret', method: 'PUT' },

            // Try Prod
            { base: 'https://api.circle.com', path: '/v1/w3s/config/entity/secret', method: 'POST' },
        ];

        let success = false;
        for (const combo of combinations) {
            if (await registerWithUrl(combo.base, combo.path, payload, combo.method)) {
                success = true;
                break;
            }
        }

        if (success) console.log('\n🎉 SUCCESS!');
        else console.error('\n❌ All attempts failed.');

    } catch (error: any) {
        console.error('❌ Unexpected Error:', error.message);
    }
}

main();
