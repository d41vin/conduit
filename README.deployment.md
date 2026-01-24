# Deployment Guide for Conduit Protocol

This guide explains how to deploy the Conduit Protocol to the Arc L1 Testnet and run the frontend application.

## Prerequisites

- **Node.js** (v18+)
- **pnpm** (v9+)
- **Private Key** with Arc Testnet funds (Native USDC)
- **Arc Testnet RPC URL** (e.g. `https://testnet-rpc.arc.io` - *verify this in Arc docs*)

## 1. Deploy Smart Contracts

The smart contracts use **Native USDC** as the payment token. No external USDC contract is required.

1. Navigate to the `contracts` directory:
   ```bash
   cd contracts
   ```

2. Set your Private Key (or use an interactive keystore):
   ```bash
   # Windows PowerShell
   $env:PRIVATE_KEY="0xYourPrivateKey..."
   ```

3. Run the deployment script:
   ```bash
   forge script script/Deploy.s.sol --rpc-url <ARC_TESTNET_RPC_URL> --broadcast
   ```
   *Replace `<ARC_TESTNET_RPC_URL>` with the actual RPC URL provided by Arc.*

4. **Copy the deployed contract address** from the output.

## 2. Configure Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```

2. Create/Update `.env.local` with your configuration:
   ```env
   # Convex Configuration (Automatic from npx convex dev)
   CONVEX_DEPLOYMENT=...
   NEXT_PUBLIC_CONVEX_URL=...

   # Clerk Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Conduit Protocol
   NEXT_PUBLIC_CONTRACT_ADDRESS=<PASTE_CONTRACT_ADDRESS_HERE>
   
   # Agent Verifier Address (Who can verify proofs?)
   # Set this to your wallet address for testing the Agent Dashboard
   NEXT_PUBLIC_VERIFIER_ADDRESS=<YOUR_WALLET_ADDRESS>
   ```

3. Sync backend schema (if not running):
   ```bash
   npx convex dev
   ```

## 3. Run the Application

In the `frontend` directory:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## 4. Workflows

### Creating a Payment (Principal)
1. Go to **Create Payment**.
2. Connect your wallet.
3. Enter amount (Native USDC), condition, and deadline.
4. Confirm transaction.

### Working on a Task (Worker)
1. Use a different wallet (incognito mode).
2. Go to the dashboard and select a payment.
3. **Accept** the payment.
4. **Submit Proof** (text/link).

### Verifying (Agent)
1. As the **Verifier** (address set in .env):
2. Go to `/agent` (e.g. `http://localhost:3000/agent`).
3. View submitted proofs.
4. **Approve** or **Reject**.
   - **Approve**: Funds are released to the Worker.
   - **Reject**: Worker can resubmit.

## Troubleshooting

- **"Invalid Amount" Error**: Ensure you are sending Native USDC (Eth value) correctly. The implementation uses `msg.value`.
- **"Not Authorized"**: Ensure you are using the correct wallet for the role (Principal vs Worker vs Verifier).
