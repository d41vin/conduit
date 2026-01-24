import dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
    RPC_URL: "https://rpc.testnet.arc.network",
    CONTRACT_ADDRESS: process.env.CONDITIONAL_PAYMENT_ADDRESS || "",
    // Circle Configs
    CIRCLE_API_KEY: process.env.CIRCLE_TESTNET_API_KEY || "",
    ENTITY_SECRET: process.env.ENTITY_SECRET || "",
    CIRCLE_WALLET_ID: process.env.CIRCLE_WALLET_ID_ARC || process.env.CIRCLE_WALLET_ID || "",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY_1 || "", // Using KEY_1 from env
    POLL_INTERVAL_MS: 10000,
};

if (!CONFIG.CIRCLE_API_KEY || !CONFIG.ENTITY_SECRET) {
    console.warn("WARNING: Circle Credits missing. Agent will not be able to send transactions.");
}
if (!CONFIG.CONTRACT_ADDRESS) {
    console.warn("WARNING: CONTRACT_ADDRESS is missing.");
}
