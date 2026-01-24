
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.CIRCLE_TESTNET_API_KEY;
const BASE_URLS = ['https://api.circle.com', 'https://api-sandbox.circle.com'];

async function probe(baseUrl: string, path: string) {
    const client = axios.create({
        baseURL: baseUrl,
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        validateStatus: () => true
    });

    try {
        const res = await client.get(path);
        console.log(`[${baseUrl}] [${res.status}] ${res.statusText} - ${path}`);
        if (res.status === 200) {
            console.log('   > Data preview:', JSON.stringify(res.data).substring(0, 100));
        } else {
            // console.log('   > Error data:', JSON.stringify(res.data));
        }
    } catch (e: any) {
        console.log(`[${baseUrl}] [ERR] ${path} - ${e.message}`);
    }
}

async function main() {
    for (const url of BASE_URLS) {
        console.log(`\nProbing ${url}...`);
        await probe(url, '/ping');
        await probe(url, '/v1/w3s/config/entity/public_key');
        // also try without /w3s just in case
        await probe(url, '/v1/config/entity/public_key');
    }
}

main();
