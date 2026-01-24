
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.CIRCLE_TESTNET_API_KEY || 'TEST_API_KEY:mock:mock';

const client = initiateDeveloperControlledWalletsClient({
    apiKey: API_KEY,
    entitySecret: '0000000000000000000000000000000000000000000000000000000000000000'
});

console.log('Client keys:', Object.keys(client));
console.log('Client prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)));

// Check deep structure
function inspect(obj: any, depth = 0) {
    if (depth > 2) return;
    for (const key in obj) {
        console.log('  '.repeat(depth) + key + ': ' + typeof obj[key]);
        if (typeof obj[key] === 'object') {
            inspect(obj[key], depth + 1);
        }
    }
}
// inspect(client);
