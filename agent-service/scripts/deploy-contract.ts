
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

const API_KEY = process.env.CIRCLE_TESTNET_API_KEY;
const ENTITY_SECRET = process.env.ENTITY_SECRET;
const WALLET_ID = process.env.CIRCLE_WALLET_ID;

if (!API_KEY || !ENTITY_SECRET || !WALLET_ID) {
    console.error('❌ Missing configs: API_KEY, ENTITY_SECRET, or CIRCLE_WALLET_ID');
    process.exit(1);
}

const client = initiateDeveloperControlledWalletsClient({
    apiKey: API_KEY,
    entitySecret: ENTITY_SECRET
});

async function main() {
    try {
        console.log('🔄 Preparing Deployment...');

        // 1. Read Bytecode
        const artifactPath = path.resolve(__dirname, '../../contracts/out/ConditionalPayment.sol/ConditionalPayment.json');
        if (!fs.existsSync(artifactPath)) throw new Error(`Artifact not found at ${artifactPath}`);

        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        const bytecode = artifact.bytecode.object; // Forge format

        if (!bytecode || bytecode === '0x') throw new Error('Invalid bytecode');
        console.log(`   Bytecode size: ${bytecode.length / 2} bytes`);

        // 2. Deploy via Circle SDK
        // To deploy, we execute a transaction with 'callData' set to bytecode and NO 'contractAddress' or 'to'.
        // However, the SDK 'createContractExecutionTransaction' insists on a contractAddress.
        // We might need to use 'createContractExecutionTransaction' but trick it, OR use a raw transaction method if available.
        // Actually, looking at the types again, 'createDeveloperTransactionContractExecution' is for interacting with *deployed* contracts.
        // We likely need 'createTransaction' (transfer) but with data.

        // Wait, looking at the SDK again... 'createContractExecutionTransaction' is specifically for ABI interactions.
        // Is there a 'deployContract' method? The user-facing docs guide usually mentions it.
        // If not, standard practice is to use "transfer" endpoint but put bytecode in 'callData' (if supported) or similar.
        // But Circle's "Transfer" usually takes 'amounts' and 'destinationAddress'.

        // Alternative: If the SDK forces 'contractAddress' for execution, maybe we can't deploy *via the SDK helper* easily without a specific method.
        // However, looking at the keys in step 855: 'createContractExecutionTransaction', 'createTransaction'.

        // Let's try 'createContractExecutionTransaction' but see if we can omit contractAddress or pass something valid. 
        // Actually, for deployment, address is null.

        // If the SDK is strict, we might need 'createTransaction' which might be the generic one.
        // Let's look at what 'createTransaction' allows.
        // Step 998 showed 'createDeveloperTransactionTransfer'.
        // There doesn't seem to be a generic "send raw tx" in the high-level client.

        // Attempt 1: Use createContractExecutionTransaction but with empty contractAddress? (Likely fails validation)
        // Attempt 2: Use createDeveloperTransactionContractExecution (same)

        // Wait! The user's docs Step 961 mention: "developers can deploy smart contracts... using familiar tools" like "Forge".
        // BUT we are using a Programmable Wallet where we don't have the private key.
        // Circle's text: "SDK... provides convenient access".
        // If there is no deploy method, maybe we are supposed to sign the transaction via 'signTransaction' and broadcast ourselves?
        // Step 855 showed 'signMessage' and 'signTypedData' but NOT 'signTransaction'.

        // Let's try to assume there might be a raw 'deploy' or we can misuse 'createContractExecutionTransaction' with 0x0.
        // OR... maybe `createTransaction` (generic) exists? Step 855 listed `createTransaction` as a key!
        // Step 994 grep only showed `createTransactionEstimateFee`.
        // Step 855 output: "createContractExecutionTransaction", "createTransaction", "getTransaction"...

        // So `createTransaction` DOES exist on the client instance. Let's see if we can use it to deploy.
        // Usually `createTransaction` allows `destinationAddress`, `amount`, `tokenId`. If we leave destination empty?

        // Let's try to use `createContractExecutionTransaction` but pass the bytecode as `callData` and NO `contractAddress` (if TS allows or we cast).
        // If that fails, we are in a bind.

        console.log('   Sending Deployment Transaction to ARC-TESTNET...');

        // We will try casting to any to bypass TS checks if necessary, but try to adhere to valid fields.
        // Deployment tx = to: null, data: bytecode.

        const res = await (client as any).createContractExecutionTransaction({
            idempotencyKey: crypto.randomUUID(),
            walletId: WALLET_ID,
            // contractAddress: "", // Leaving empty to simulate deployment? Or null?
            callData: bytecode,
            feeLevel: 'MEDIUM'
        });

        console.log('✅ Transaction Sent!');
        console.log('   Tx ID:', res.data?.id);
        console.log('   State:', res.data?.state);

        // We need to wait for it to confirm to get the contract address.
        // The SDK response might not have the contract address directly if it's async under the hood.
        // We'll need to poll `getTransaction`.

        if (res.data?.id) {
            await pollForCompletion(res.data.id);
        }

    } catch (error: any) {
        console.error('❌ Deployment Failed:', error.message);
        if (error.response) {
            console.error('   API Error:', JSON.stringify(error.response.data));
        }
    }
}

async function pollForCompletion(txId: string) {
    console.log(`\n⏳ Polling for completion (Tx ID: ${txId})...`);

    for (let i = 0; i < 30; i++) { // 30 attempts, 2s wait = 1 min
        await new Promise(r => setTimeout(r, 2000));
        const res = await client.getTransaction({ id: txId });
        const tx = res.data?.transaction;

        if (tx) {
            process.stdout.write(`   [${tx.state}]`);
            if (tx.state === 'COMPLETE') {
                console.log('\n\n✅ DEPLOYMENT CONFIRMED!');
                console.log(`   Tx Hash: ${tx.txHash}`);
                // Contract address is NOT always in the Tx object from Circle.
                // We might need to compute it from sender + nonce, or check the block explorer.
                // For now, let's just output the hash.
                return;
            } else if (tx.state === 'FAILED') {
                console.log('\n\n❌ Transaction FAILED.');
                return;
            }
        }
    }
    console.log('\n\n⚠️  Timed out waiting for confirmation.');
}

main();
