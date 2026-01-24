
import { ethers } from "ethers";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { CONFIG } from "./config";
import { verifyProof } from "./verifier";
import crypto from 'crypto';

// Minimal ABI for listening and decoding
const MINIMAL_ABI = [
    "event ProofSubmitted(uint256 indexed paymentId, string proof)",
    "function verify(uint256 paymentId, bool isApproved) external",
    "function payments(uint256) view returns (address principal, address verifier, address worker, uint256 amount, uint256 deadline, bool isPaid, uint8 status, string condition)"
];

const PaymentStatus = {
    Available: 0,
    Assigned: 1,
    Submitted: 2,
    Released: 3,
    Refunded: 4
};

// Initialize Circle Client
const circleClient = initiateDeveloperControlledWalletsClient({
    apiKey: CONFIG.CIRCLE_API_KEY,
    entitySecret: CONFIG.ENTITY_SECRET
});

async function main() {
    console.log("Starting Automated Agent Service (Circle Integration)...");
    console.log("Contract Address:", CONFIG.CONTRACT_ADDRESS);

    if (!CONFIG.RPC_URL || !CONFIG.CIRCLE_API_KEY) {
        console.error("Missing Configs. Exiting.");
        process.exit(1);
    }

    // Provider for READING (efficient polling via RPC)
    const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    // Read-only contract instance
    const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, MINIMAL_ABI, provider);

    // Get Agent Wallet Address
    let agentAddress = '';
    try {
        const walletRes = await circleClient.getWallet({ id: CONFIG.CIRCLE_WALLET_ID });
        const wallet = walletRes.data?.wallet;
        if (!wallet) throw new Error("Wallet not found via SDK");
        agentAddress = wallet.address;
        console.log(`Agent Wallet: ${agentAddress} (${wallet.blockchain})`);
    } catch (e: any) {
        console.error("Failed to fetch Agent Wallet:", e.message);
        process.exit(1);
    }

    // Polling Loop
    setInterval(async () => {
        try {
            console.log("Polling for recent ProofSubmitted events...");

            // Look back 5000 blocks (robustness)
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 5000);

            const filter = contract.filters.ProofSubmitted();
            const events = await contract.queryFilter(filter, fromBlock);

            console.log(`Found ${events.length} ProofSubmitted events in last 5000 blocks.`);

            // Deduplicate by paymentId
            const processedPaymentIds = new Set<string>();

            for (const event of events) {
                if ('args' in event) {
                    const paymentId = event.args[0];
                    const proof = event.args[1];
                    const paymentIdStr = paymentId.toString();

                    if (processedPaymentIds.has(paymentIdStr)) continue;
                    processedPaymentIds.add(paymentIdStr);

                    // Check current status on-chain
                    const payment = await contract.payments(paymentId);
                    const status = Number(payment.status);
                    const verifier = payment.verifier;
                    const condition = payment.condition;

                    if (status !== PaymentStatus.Submitted) {
                        continue; // Not ready
                    }

                    if (verifier.toLowerCase() !== agentAddress.toLowerCase()) {
                        continue; // Not my job
                    }

                    console.log(`Processing Payment #${paymentIdStr}: Condition="${condition}"`);

                    // Verify via LLM (or Mock)
                    const isApproved = await verifyProof(condition, proof);
                    console.log(`Decision for #${paymentIdStr}: ${isApproved ? "APPROVE" : "REJECT"}`);

                    // SUBMIT VIA CIRCLE SDK
                    // We need to encode the function call data
                    const iface = new ethers.Interface(MINIMAL_ABI);
                    const callData = iface.encodeFunctionData("verify", [paymentId, isApproved]);

                    try {
                        console.log(`Submitting Tx via Circle SDK...`);
                        const res = await (circleClient as any).createContractExecutionTransaction({
                            idempotencyKey: crypto.randomUUID(),
                            walletId: CONFIG.CIRCLE_WALLET_ID,
                            contractAddress: CONFIG.CONTRACT_ADDRESS,
                            abiFunctionSignature: "verify(uint256,bool)",
                            abiParameters: [paymentIdStr, isApproved.toString()],
                            feeLevel: "MEDIUM"
                        });

                        // NOTE: If SDK doesn't support ABI params directly for this verify call style, 
                        // we can fallback to 'callData' if the SDK allows mixing (it usually prefers one or the other).
                        // CreateContractExecutionTransactionForDeveloperRequest allows abiFunctionSignature OR callData.
                        // We provided ABI args, so let's stick to that clean interface if possible.

                        console.log(`Tx Submitted via SDK! TxID: ${res.data?.id}`);
                        console.log(`State: ${res.data?.state}`);

                    } catch (txErr: any) {
                        console.error(`Failed to submit verification via SDK:`, txErr.response?.data || txErr.message);
                    }
                }
            }

        } catch (err) {
            console.error("Polling error:", err);
        }
    }, CONFIG.POLL_INTERVAL_MS);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
