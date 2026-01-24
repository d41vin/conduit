# 🚀 COMPREHENSIVE IMPLEMENTATION PLAN
## Agent-Verified Conditional Payment Protocol on Arc

---

## 📋 PROJECT OVERVIEW

**Repository:** `d41vin-agentic-escrow`  
**Duration:** Flexible (AI-assisted development)  
**Working Mode:** Solo with AI pair programming (Claude + Claude Code)  
**Target:** Agentic Commerce on Arc Hackathon  

---

## 🎯 PHASE 0: PROJECT SETUP & CONFIGURATION

### Objective: Get development environment ready

#### Tasks:

**0.1 Repository Organization**
- [ ] Create `sdk/` directory at root level
- [ ] Ensure `frontend/docs/` has `available-env.md` and `dev-circle-llms.txt`
- [ ] Create `.env.local.example` files for each workspace

**0.2 Install Dependencies**

```bash
# Frontend
cd frontend
pnpm install
pnpm add @clerk/nextjs convex ai @ai-sdk/google zod
pnpm add ethers@^6 @circle-fin/developer-controlled-wallets
pnpm add swr date-fns lucide-react

# Contracts (already setup)
cd ../contracts
forge install OpenZeppelin/openzeppelin-contracts

# SDK
cd ../sdk
npm init -y
npm install ethers@^6 @circle-fin/developer-controlled-wallets
npm install -D typescript @types/node
```

**0.3 Environment Variables Setup**

Create `frontend/.env.local`:
```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Convex
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=

# Gemini API Keys (with rotation)
GEMINI_API_KEY_1=
GEMINI_API_KEY_2=

# Circle
CIRCLE_API_KEY=
CIRCLE_ENTITY_SECRET=
CIRCLE_WALLET_SET_ID=

# Arc Blockchain
NEXT_PUBLIC_ARC_RPC_URL=https://testnet-rpc.arc.network
NEXT_PUBLIC_CONDITIONAL_PAYMENT_CONTRACT=
NEXT_PUBLIC_USDC_ADDRESS=0x... # Arc testnet USDC address

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**0.4 Convex Setup**

```bash
cd frontend
pnpm add convex
npx convex dev
# Follow prompts to create project
```

**0.5 Clerk Setup**

```bash
# Already installed in 0.2
# Go to https://dashboard.clerk.com
# Create new application
# Copy keys to .env.local
# Enable Google OAuth provider
```

**Acceptance Criteria:**
- ✅ All package managers working
- ✅ Environment variables documented
- ✅ Convex project initialized
- ✅ Clerk dashboard configured
- ✅ Can run `pnpm dev` in frontend without errors

---

## 🏗️ PHASE 1: SMART CONTRACTS (FOUNDATION)

### Objective: Build and test the core protocol smart contracts

#### Tasks:

**1.1 Smart Contract Architecture**

Create `contracts/src/ConditionalPayment.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ConditionalPayment is ReentrancyGuard, Ownable {
    // State variables
    IERC20 public immutable usdc;
    uint256 public paymentCounter;
    
    enum PaymentStatus {
        Created,
        Accepted,
        Submitted,
        Verified,
        Released,
        Rejected,
        Cancelled,
        TimedOut
    }
    
    struct Payment {
        uint256 id;
        address principal;
        address worker;
        address verifier;
        uint256 amount;
        string conditionHash;
        PaymentStatus status;
        uint256 createdAt;
        uint256 deadline;
        string proofHash;
        string verificationReason;
    }
    
    mapping(uint256 => Payment) public payments;
    
    // Events
    event PaymentCreated(uint256 indexed paymentId, address indexed principal, uint256 amount, address verifier);
    event PaymentAccepted(uint256 indexed paymentId, address indexed worker);
    event ProofSubmitted(uint256 indexed paymentId, address indexed worker, string proofHash);
    event Verified(uint256 indexed paymentId, bool approved, string reason);
    event PaymentReleased(uint256 indexed paymentId, address indexed worker, uint256 amount);
    event PaymentCancelled(uint256 indexed paymentId);
    event PaymentTimedOut(uint256 indexed paymentId);
    
    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }
    
    // Core functions (implement all)
    function createPayment(...) external { }
    function acceptPayment(...) external { }
    function submitProof(...) external { }
    function verify(...) external { }
    function releasePayment(...) external { }
    function cancelPayment(...) external { }
    function refundOnTimeout(...) external { }
    
    // View functions
    function getPayment(...) external view returns (Payment memory) { }
    function getPaymentsByPrincipal(...) external view returns (uint256[] memory) { }
    function getPaymentsByWorker(...) external view returns (uint256[] memory) { }
    function getPaymentsByStatus(...) external view returns (uint256[] memory) { }
}
```

**Key Implementation Details:**
- ✅ Use OpenZeppelin's ReentrancyGuard
- ✅ All USDC transfers must use safeTransferFrom
- ✅ Emit events for all state changes
- ✅ Strict access control (only verifier can verify, etc.)
- ✅ Deadline enforcement
- ✅ Status validation for all transitions

**1.2 Comprehensive Tests**

Create `contracts/test/ConditionalPayment.t.sol`:

Test Coverage:
- [ ] ✅ Payment creation with USDC approval
- [ ] ✅ Worker acceptance
- [ ] ✅ Proof submission
- [ ] ✅ Verification (approve/reject)
- [ ] ✅ Payment release
- [ ] ✅ Cancellation before acceptance
- [ ] ✅ Timeout refund
- [ ] ✅ Access control (only verifier can verify)
- [ ] ✅ Invalid state transitions
- [ ] ✅ Reentrancy protection
- [ ] ✅ Edge cases (zero amount, invalid addresses)

```bash
forge test -vvv
# Target: 100% test coverage
```

**1.3 Deployment Script**

Create `contracts/script/Deploy.s.sol`:

```solidity
// Deploy to Arc testnet
// Store deployed address
// Verify on block explorer
```

**1.4 Deploy to Arc Testnet**

```bash
forge script script/Deploy.s.sol \
  --rpc-url https://testnet-rpc.arc.network \
  --broadcast \
  --verify
```

**Acceptance Criteria:**
- ✅ All tests passing (100% coverage)
- ✅ Contract deployed to Arc testnet
- ✅ Contract verified on Arc explorer
- ✅ Deployed address documented in `.env.local`
- ✅ Can interact with contract via Foundry cast

---

## 📦 PHASE 2: SDK DEVELOPMENT

### Objective: Build TypeScript SDK for protocol interaction

#### Tasks:

**2.1 SDK Package Setup**

Create `sdk/package.json`:
```json
{
  "name": "@d41vin/conditional-payment-sdk",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

Create `sdk/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**2.2 Core SDK Implementation**

Create `sdk/src/ConditionalPaymentSDK.ts`:

```typescript
import { ethers } from 'ethers';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

export class ConditionalPaymentSDK {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private walletClient: any;
  
  constructor(config: SDKConfig) {
    // Initialize provider, contract, Circle wallets
  }
  
  // Payment Management
  async createPayment(params: CreatePaymentParams): Promise<PaymentId>
  async acceptPayment(paymentId: string): Promise<TransactionReceipt>
  async submitProof(paymentId: string, proof: ProofData): Promise<TransactionReceipt>
  async verify(paymentId: string, approved: boolean, reason: string): Promise<TransactionReceipt>
  async releasePayment(paymentId: string): Promise<TransactionReceipt>
  async cancelPayment(paymentId: string): Promise<TransactionReceipt>
  async refundOnTimeout(paymentId: string): Promise<TransactionReceipt>
  
  // Query Functions
  async getPayment(paymentId: string): Promise<Payment>
  async listPayments(filter?: PaymentFilter): Promise<Payment[]>
  async getPaymentsByPrincipal(address: string): Promise<Payment[]>
  async getPaymentsByWorker(address: string): Promise<Payment[]>
  async getPaymentsByStatus(status: PaymentStatus): Promise<Payment[]>
  
  // Wallet Management
  async createWallet(userId: string): Promise<WalletInfo>
  async getWalletBalance(walletId: string): Promise<Balance>
  
  // Event Listening
  onPaymentCreated(callback: (event: PaymentCreatedEvent) => void): void
  onProofSubmitted(callback: (event: ProofSubmittedEvent) => void): void
  onVerified(callback: (event: VerifiedEvent) => void): void
  onPaymentReleased(callback: (event: PaymentReleasedEvent) => void): void
}
```

**2.3 Circle Wallet Integration**

Create `sdk/src/wallet.ts`:

```typescript
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

export class WalletManager {
  private client: any;
  
  async createUserWallet(userId: string): Promise<WalletInfo>
  async createAgentWallet(agentId: string): Promise<WalletInfo>
  async getWallet(walletId: string): Promise<WalletInfo>
  async signTransaction(walletId: string, txData: any): Promise<Signature>
  async getBalance(walletId: string): Promise<Balance>
}
```

**2.4 TypeScript Types**

Create `sdk/src/types.ts`:

```typescript
export interface Payment {
  id: string;
  principal: string;
  worker: string | null;
  verifier: string;
  amount: string;
  condition: string;
  status: PaymentStatus;
  createdAt: number;
  deadline: number;
  proofHash?: string;
  verificationReason?: string;
}

export enum PaymentStatus {
  Created = 0,
  Accepted = 1,
  Submitted = 2,
  Verified = 3,
  Released = 4,
  Rejected = 5,
  Cancelled = 6,
  TimedOut = 7,
}

export interface CreatePaymentParams {
  amount: number;
  condition: string;
  verifierAddress: string;
  deadline: number;
  principalWalletId: string;
}

// ... more types
```

**2.5 SDK Testing**

Create `sdk/src/__tests__/sdk.test.ts`:

```typescript
// Unit tests for SDK methods
// Mock blockchain interactions
// Test Circle Wallet integration
```

**Acceptance Criteria:**
- ✅ SDK builds without errors (`npm run build`)
- ✅ All methods properly typed
- ✅ Can create payment via SDK
- ✅ Can query payments via SDK
- ✅ Circle Wallet integration works
- ✅ Types exported correctly

---

## 🗄️ PHASE 3: BACKEND INFRASTRUCTURE (CONVEX)

### Objective: Set up database, file storage, and backend functions

#### Tasks:

**3.1 Convex Schema**

Create `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    walletAddress: v.string(),
    circleWalletId: v.string(),
    type: v.string(), // 'user' or 'verifier'
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkUserId"])
    .index("by_wallet", ["walletAddress"]),
  
  agents: defineTable({
    ownerId: v.string(), // Clerk user ID
    name: v.string(),
    type: v.string(), // 'worker' | 'buyer'
    apiKeyHash: v.string(),
    walletAddress: v.string(),
    circleWalletId: v.string(),
    policies: v.object({
      maxPayment: v.number(),
      minPayment: v.number(),
      autoAccept: v.boolean(),
      dailyLimit: v.number(),
    }),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_api_key", ["apiKeyHash"])
    .index("by_wallet", ["walletAddress"]),
  
  payments: defineTable({
    paymentId: v.string(), // On-chain ID
    principal: v.string(), // Address or agent ID
    principalType: v.string(), // 'user' | 'agent'
    worker: v.optional(v.string()),
    workerType: v.optional(v.string()),
    verifier: v.string(),
    amount: v.number(),
    condition: v.string(), // Full text
    conditionHash: v.string(), // Hash stored on-chain
    status: v.string(),
    deadline: v.number(),
    createdAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_payment_id", ["paymentId"])
    .index("by_principal", ["principal"])
    .index("by_worker", ["worker"])
    .index("by_status", ["status"]),
  
  proofs: defineTable({
    paymentId: v.string(),
    submittedBy: v.string(),
    proofType: v.string(), // 'text' | 'image' | 'document'
    storageId: v.optional(v.string()), // Convex file storage ID
    proofText: v.optional(v.string()),
    proofHash: v.string(),
    submittedAt: v.number(),
  }).index("by_payment_id", ["paymentId"]),
  
  verifications: defineTable({
    paymentId: v.string(),
    verifier: v.string(),
    approved: v.boolean(),
    confidence: v.number(),
    reason: v.string(),
    issues: v.optional(v.array(v.string())),
    verifiedAt: v.number(),
    transactionHash: v.optional(v.string()),
  }).index("by_payment_id", ["paymentId"]),
  
  agentActivity: defineTable({
    agentId: v.string(),
    action: v.string(), // 'CREATED_PAYMENT' | 'ACCEPTED_PAYMENT' | 'SUBMITTED_PROOF' etc.
    paymentId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_timestamp", ["timestamp"]),
});
```

**3.2 User Management Functions**

Create `convex/users.ts`:

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Webhook handler for Clerk user creation
export const createFromClerk = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
    
    if (existing) return existing._id;
    
    // Create Circle Wallet (call external function)
    // For now, placeholder
    const walletAddress = "0x...";
    const circleWalletId = "wallet_id";
    
    const userId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      name: args.name,
      walletAddress,
      circleWalletId,
      type: "user",
      createdAt: Date.now(),
    });
    
    return userId;
  },
});

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => 
        q.eq("clerkUserId", identity.subject)
      )
      .first();
  },
});
```

**3.3 Payment Management Functions**

Create `convex/payments.ts`:

```typescript
export const create = mutation({
  args: {
    paymentId: v.string(),
    principal: v.string(),
    principalType: v.string(),
    verifier: v.string(),
    amount: v.number(),
    condition: v.string(),
    conditionHash: v.string(),
    deadline: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("payments", {
      ...args,
      status: "Created",
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {
    status: v.optional(v.string()),
    principal: v.optional(v.string()),
    worker: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("payments");
    
    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    } else if (args.principal) {
      query = query.withIndex("by_principal", (q) => q.eq("principal", args.principal));
    } else if (args.worker) {
      query = query.withIndex("by_worker", (q) => q.eq("worker", args.worker));
    }
    
    return await query.collect();
  },
});

export const get = query({
  args: { paymentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_payment_id", (q) => q.eq("paymentId", args.paymentId))
      .first();
  },
});

export const updateStatus = mutation({
  args: {
    paymentId: v.string(),
    status: v.string(),
    worker: v.optional(v.string()),
    workerType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_payment_id", (q) => q.eq("paymentId", args.paymentId))
      .first();
    
    if (!payment) throw new Error("Payment not found");
    
    await ctx.db.patch(payment._id, {
      status: args.status,
      ...(args.worker && { worker: args.worker }),
      ...(args.workerType && { workerType: args.workerType }),
    });
  },
});
```

**3.4 Agent Management Functions**

Create `convex/agents.ts`:

```typescript
export const create = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    policies: v.object({
      maxPayment: v.number(),
      minPayment: v.number(),
      autoAccept: v.boolean(),
      dailyLimit: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    // Generate API key
    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);
    
    // Create Circle Wallet
    // Placeholder for now
    const walletAddress = "0x...";
    const circleWalletId = "agent_wallet_id";
    
    const agentId = await ctx.db.insert("agents", {
      ownerId: identity.subject,
      name: args.name,
      type: args.type,
      apiKeyHash,
      walletAddress,
      circleWalletId,
      policies: args.policies,
      isActive: true,
      createdAt: Date.now(),
    });
    
    // Return plain API key (only time we do this)
    return { agentId, apiKey, walletAddress };
  },
});

export const listByOwner = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    return await ctx.db
      .query("agents")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .collect();
  },
});

export const getByApiKey = query({
  args: { apiKeyHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_api_key", (q) => q.eq("apiKeyHash", args.apiKeyHash))
      .first();
  },
});
```

**3.5 Activity Logging Functions**

Create `convex/agentActivity.ts`:

```typescript
export const log = mutation({
  args: {
    agentId: v.string(),
    action: v.string(),
    paymentId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentActivity", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getAgentActivity = query({
  args: {
    agentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("agentActivity")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(limit);
  },
});
```

**Acceptance Criteria:**
- ✅ Schema deployed to Convex
- ✅ All mutations and queries working
- ✅ Can create users via Clerk webhook
- ✅ Can create and query payments
- ✅ Can create agents with API keys
- ✅ Activity logging functional

---

## 🤖 PHASE 4: AI VERIFICATION SYSTEM

### Objective: Build Gemini-powered verification with key rotation

#### Tasks:

**4.1 Gemini Client with Key Rotation**

Create `frontend/lib/gemini-client.ts`:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean) as string[];

class GeminiClientPool {
  private currentKeyIndex = 0;
  private keyUsageCount = new Map<number, number>();
  private keyErrorCount = new Map<number, number>();
  
  async generateWithRetry(
    modelName: string,
    prompt: any,
    maxRetries = GEMINI_KEYS.length
  ) {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const keyIndex = (this.currentKeyIndex + attempt) % GEMINI_KEYS.length;
      const key = GEMINI_KEYS[keyIndex];
      
      try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        
        // Success - update metrics
        this.keyUsageCount.set(keyIndex, (this.keyUsageCount.get(keyIndex) || 0) + 1);
        this.keyErrorCount.set(keyIndex, 0);
        this.currentKeyIndex = (keyIndex + 1) % GEMINI_KEYS.length;
        
        return result;
      } catch (error: any) {
        console.warn(`Gemini key ${keyIndex + 1} failed:`, error.message);
        this.keyErrorCount.set(keyIndex, (this.keyErrorCount.get(keyIndex) || 0) + 1);
        lastError = error;
        
        // Check if rate limit error
        if (error.message?.includes('RESOURCE_EXHAUSTED') || 
            error.message?.includes('quota')) {
          console.log(`Key ${keyIndex + 1} rate limited, trying next...`);
          continue;
        }
        
        // Non-rate-limit error, throw immediately
        throw error;
      }
    }
    
    throw new Error(`All ${GEMINI_KEYS.length} keys failed: ${lastError?.message}`);
  }
  
  getStats() {
    return {
      totalKeys: GEMINI_KEYS.length,
      usage: Object.fromEntries(this.keyUsageCount),
      errors: Object.fromEntries(this.keyErrorCount),
      currentKey: this.currentKeyIndex + 1,
    };
  }
}

export const geminiPool = new GeminiClientPool();
```

**4.2 AI Verifier with Vercel AI SDK**

Create `frontend/lib/ai-verifier.ts`:

```typescript
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

const verificationSchema = z.object({
  approved: z.boolean().describe('Whether the proof satisfies the condition'),
  confidence: z.number().min(0).max(1).describe('Confidence score 0-1'),
  reason: z.string().describe('Detailed explanation'),
  issues: z.array(z.string()).optional().describe('Specific issues found'),
});

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1!,
  process.env.GEMINI_API_KEY_2!,
].filter(Boolean);

let currentKeyIndex = 0;

export async function verifyProof(params: {
  condition: string;
  proofData: string | Buffer;
  proofType: 'text' | 'image' | 'document';
}): Promise<z.infer<typeof verificationSchema>> {
  
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const keyIndex = (currentKeyIndex + i) % GEMINI_KEYS.length;
    const apiKey = GEMINI_KEYS[keyIndex];
    
    try {
      const google = createGoogleGenerativeAI({ apiKey });
      
      let messages: any[];
      
      if (params.proofType === 'image') {
        messages = [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are verifying proof for a conditional payment.
              
CONDITION: ${params.condition}

Analyze the image and determine if it satisfies the condition.
Be thorough and objective.`
            },
            {
              type: 'image',
              image: params.proofData, // URL or base64
            }
          ]
        }];
      } else {
        messages = [{
          role: 'user',
          content: `You are verifying proof for a conditional payment.

CONDITION: ${params.condition}

SUBMITTED PROOF:
${params.proofData}

Analyze whether this proof satisfies the condition.
Be thorough and objective.`
        }];
      }
      
      const result = await generateObject({
        model: google('gemini-2.0-flash-exp'),
        schema: verificationSchema,
        messages,
        temperature: 0.3,
      });
      
      // Success - rotate to next key
      currentKeyIndex = (keyIndex + 1) % GEMINI_KEYS.length;
      
      return result.object;
      
    } catch (error: any) {
      console.error(`Gemini key ${keyIndex + 1} failed:`, error.message);
      
      if (error.message?.includes('RESOURCE_EXHAUSTED')) {
        console.log('Rate limited, trying next key...');
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('All Gemini API keys exhausted');
}
```

**4.3 Verification API Endpoint**

Create `frontend/app/api/verify/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { verifyProof } from '@/lib/ai-verifier';
import { ConditionalPaymentSDK } from '@/sdk';
import { api } from '@/convex/_generated/api';
import { fetchMutation, fetchQuery } from 'convex/nextjs';

export async function POST(req: NextRequest) {
  try {
    const { paymentId } = await req.json();
    
    // 1. Get payment details
    const payment = await fetchQuery(api.payments.get, { paymentId });
    if (!payment) {
      return Response.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    // 2. Get submitted proof
    const proof = await fetchQuery(api.proofs.get, { paymentId });
    if (!proof) {
      return Response.json({ error: 'No proof submitted' }, { status: 404 });
    }
    
    // 3. Get proof data (from Convex storage if file)
    let proofData: string | Buffer;
    if (proof.storageId) {
      // Get from Convex file storage
      const url = await fetchQuery(api.files.getUrl, { storageId: proof.storageId });
      proofData = url;
    } else {
      proofData = proof.proofText!;
    }
    
    // 4. AI Verification
    const verification = await verifyProof({
      condition: payment.condition,
      proofData,
      proofType: proof.proofType as any,
    });
    
    // 5. Submit verification to smart contract
    const sdk = new ConditionalPaymentSDK(/* config */);
    await sdk.verify(paymentId, verification.approved, verification.reason);
    
    // 6. Store verification in Convex
    await fetchMutation(api.verifications.create, {
      paymentId,
      verifier: 'ai-verifier',
      approved: verification.approved,
      confidence: verification.confidence,
      reason: verification.reason,
      issues: verification.issues,
      verifiedAt: Date.now(),
    });
    
    // 7. Update payment status in Convex
    await fetchMutation(api.payments.updateStatus, {
      paymentId,
      status: verification.approved ? 'Verified' : 'Rejected',
    });
    
    return Response.json({
      success: true,
      verification,
    });
    
  } catch (error: any) {
    console.error('Verification error:', error);
    return Response.json({
      error: error.message,
    }, { status: 500 });
  }
}
```

**4.4 Event Listener for Auto-Verification**

Create `frontend/lib/blockchain-listener.ts`:

```typescript
import { ethers } from 'ethers';
import { ConditionalPaymentSDK } from '@/sdk';

const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_ARC_RPC_URL);
const contractAddress = process.env.NEXT_PUBLIC_CONDITIONAL_PAYMENT_CONTRACT!;

// Load ABI
const abi = [/* ... */];
const contract = new ethers.Contract(contractAddress, abi, provider);

export function startListening() {
  console.log('Starting blockchain event listener...');
  
  // Listen for ProofSubmitted events
  contract.on('ProofSubmitted', async (paymentId, worker, proofHash) => {
    console.log(`Proof submitted for payment ${paymentId}`);
    
    try {
      // Trigger verification
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: paymentId.toString() }),
      });
      
      if (!response.ok) {
        throw new Error(`Verification failed: ${response.statusText}`);
      }
      
      console.log(`Verification completed for payment ${paymentId}`);
    } catch (error) {
      console.error('Auto-verification error:', error);
    }
  });
  
  // Listen for PaymentCreated to sync with Convex
  contract.on('PaymentCreated', async (paymentId, principal, amount, verifier) => {
    console.log(`Payment created: ${paymentId}`);
    // Sync to Convex if needed
  });
}

// Start listener (call this in a long-running process or API route)
if (process.env.NODE_ENV !== 'development') {
  // Only in production, or run separately
  startListening();
}
```

**4.5 Gemini Stats API**

Create `frontend/app/api/admin/gemini-stats/route.ts`:

```typescript
import { geminiPool } from '@/lib/gemini-client';

export async function GET() {
  const stats = geminiPool.getStats();
  return Response.json(stats);
}
```

**Acceptance Criteria:**
- ✅ AI verification works for text proofs
- ✅ AI verification works for image proofs
- ✅ Key rotation functional
- ✅ Verification stored in Convex
- ✅ Smart contract updated after verification
- ✅ Event listener triggers auto-verification

---

## 🎨 PHASE 5: FRONTEND CORE (AUTH + BASIC UI)

### Objective: Build authentication and core user interface

#### Tasks:

**5.1 Clerk Integration**

Create `frontend/app/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs';
import { ConvexClientProvider } from '@/components/providers/convex-provider';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

Create `frontend/components/providers/convex-provider.tsx`:

```typescript
'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { useAuth } from '@clerk/nextjs';
import { ReactNode } from 'react';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}
```

**5.2 Auth Pages**

Create `frontend/app/sign-in/[[...sign-in]]/page.tsx`:

```typescript
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

Create `frontend/app/sign-up/[[...sign-up]]/page.tsx`:

```typescript
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

**5.3 Protected Route Middleware**

Create `frontend/middleware.ts`:

```typescript
import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in(.*)", "/sign-up(.*)"],
  ignoredRoutes: ["/api/agent/(.*)"], // Agent API routes use API key auth
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

**5.4 Clerk Webhook for User Creation**

Create `frontend/app/api/webhooks/clerk/route.ts`:

```typescript
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET');
  }
  
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");
  
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error', { status: 400 });
  }
  
  const payload = await req.json();
  const body = JSON.stringify(payload);
  
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;
  
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Error', { status: 400 });
  }
  
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    
    await fetchMutation(api.users.createFromClerk, {
      clerkUserId: id,
      email: email_addresses[0].email_address,
      name: `${first_name || ''} ${last_name || ''}`.trim(),
    });
  }
  
  return new Response('', { status: 200 });
}
```

**5.5 Landing Page**

Create `frontend/app/page.tsx`:

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Conditional Payment Protocol</h1>
          <div className="space-x-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-bold">
            AI-Verified Conditional Payments on Arc
          </h2>
          <p className="text-xl text-muted-foreground">
            Create trustless payments that release only when AI agents verify 
            conditions are met. Built on Arc with USDC.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 border rounded-lg">
              <h3 className="font-bold mb-2">Human-to-Human</h3>
              <p className="text-sm text-muted-foreground">
                Escrow payments for freelance work, verified by AI
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="font-bold mb-2">Agent-to-Agent</h3>
              <p className="text-sm text-muted-foreground">
                Autonomous commerce between AI agents
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="font-bold mb-2">Hybrid</h3>
              <p className="text-sm text-muted-foreground">
                Humans and agents transacting seamlessly
              </p>
            </div>
          </div>
          
          <Link href="/sign-up">
            <Button size="lg" className="mt-8">
              Start Building
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
```

**5.6 Dashboard Layout**

Create `frontend/app/dashboard/layout.tsx`:

```typescript
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

Create `frontend/components/dashboard/sidebar.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const routes = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/payments/create', label: 'Create Payment' },
  { href: '/dashboard/payments', label: 'My Payments' },
  { href: '/dashboard/marketplace', label: 'Marketplace' },
  { href: '/dashboard/agents', label: 'My Agents' },
];

export function Sidebar() {
  const pathname = usePathname();
  
  return (
    <div className="w-64 border-r bg-muted/40">
      <div className="p-6">
        <h2 className="text-xl font-bold">Dashboard</h2>
      </div>
      <nav className="space-y-1 px-3">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "block px-3 py-2 rounded-md text-sm",
              pathname === route.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            {route.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

Create `frontend/components/dashboard/header.tsx`:

```typescript
'use client';

import { UserButton } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function Header() {
  const user = useQuery(api.users.getCurrent);
  
  return (
    <header className="border-b px-8 py-4 flex justify-between items-center">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <p className="font-semibold">{user?.name || user?.email}</p>
      </div>
      <div className="flex items-center gap-4">
        {user?.walletAddress && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Wallet</p>
            <p className="text-sm font-mono">
              {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
            </p>
          </div>
        )}
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
```

**Acceptance Criteria:**
- ✅ Clerk auth working (sign-up, sign-in, sign-out)
- ✅ Webhook creates user in Convex
- ✅ Protected routes require authentication
- ✅ Dashboard layout renders
- ✅ User profile shows wallet address

---

## 💰 PHASE 6: PAYMENT FEATURES (CORE FUNCTIONALITY)

### Objective: Build payment creation, marketplace, and management

#### Tasks:

**6.1 Create Payment Page**

Create `frontend/app/dashboard/payments/create/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function CreatePaymentPage() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrent);
  
  const [amount, setAmount] = useState('');
  const [condition, setCondition] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Call SDK to create payment on blockchain
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          condition,
          deadline: new Date(deadline).getTime(),
        }),
      });
      
      const { paymentId } = await response.json();
      
      // Redirect to payment detail
      router.push(`/dashboard/payments/${paymentId}`);
    } catch (error) {
      console.error('Failed to create payment:', error);
      alert('Failed to create payment');
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create Conditional Payment</h1>
      
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="condition">Condition Description</Label>
            <Textarea
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Describe what needs to be done..."
              rows={4}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
          
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm font-medium mb-2">Payment Summary</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-mono">{amount || '0'} USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Your Wallet:</span>
                <span className="font-mono">
                  {user?.walletAddress.slice(0, 6)}...{user?.walletAddress.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Verifier:</span>
                <span>AI Agent</span>
              </div>
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Payment'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

**6.2 Payment Creation API**

Create `frontend/app/api/payments/create/route.ts`:

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { ConditionalPaymentSDK } from '@/sdk';
import { api } from '@/convex/_generated/api';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { amount, condition, deadline } = await req.json();
    
    // Get user's wallet
    const user = await fetchQuery(api.users.getCurrent, {});
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Hash the condition
    const conditionHash = createHash('sha256').update(condition).digest('hex');
    
    // Initialize SDK
    const sdk = new ConditionalPaymentSDK({
      rpcUrl: process.env.NEXT_PUBLIC_ARC_RPC_URL!,
      contractAddress: process.env.NEXT_PUBLIC_CONDITIONAL_PAYMENT_CONTRACT!,
      circleApiKey: process.env.CIRCLE_API_KEY!,
    });
    
    // Get verifier address (from env or predefined)
    const verifierAddress = process.env.VERIFIER_WALLET_ADDRESS!;
    
    // Create payment on blockchain
    const paymentId = await sdk.createPayment({
      amount,
      condition: conditionHash,
      verifierAddress,
      deadline,
      principalWalletId: user.circleWalletId,
    });
    
    // Store in Convex
    await fetchMutation(api.payments.create, {
      paymentId: paymentId.toString(),
      principal: user.walletAddress,
      principalType: 'user',
      verifier: verifierAddress,
      amount,
      condition, // Full text
      conditionHash,
      deadline,
    });
    
    return Response.json({ paymentId: paymentId.toString() });
    
  } catch (error: any) {
    console.error('Payment creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

**6.3 Payment List Page**

Create `frontend/app/dashboard/payments/page.tsx`:

```typescript
'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PaymentCard } from '@/components/payments/payment-card';

export default function PaymentsPage() {
  const user = useQuery(api.users.getCurrent);
  const payments = useQuery(
    api.payments.list,
    user ? { principal: user.walletAddress } : 'skip'
  );
  
  if (!payments) return <div>Loading...</div>;
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Payments</h1>
      
      <div className="grid gap-4">
        {payments.length === 0 ? (
          <p className="text-muted-foreground">No payments yet</p>
        ) : (
          payments.map((payment) => (
            <PaymentCard key={payment._id} payment={payment} />
          ))
        )}
      </div>
    </div>
  );
}
```

Create `frontend/components/payments/payment-card.tsx`:

```typescript
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function PaymentCard({ payment }: { payment: any }) {
  return (
    <Link href={`/dashboard/payments/${payment.paymentId}`}>
      <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold">Payment #{payment.paymentId}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {payment.condition.slice(0, 100)}...
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold">{payment.amount} USDC</p>
            <Badge className="mt-2">{payment.status}</Badge>
          </div>
        </div>
        
        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
          <span>
            Created {formatDistanceToNow(payment.createdAt, { addSuffix: true })}
          </span>
          <span>
            Deadline: {new Date(payment.deadline).toLocaleDateString()}
          </span>
        </div>
      </Card>
    </Link>
  );
}
```

**6.4 Marketplace Page**

Create `frontend/app/dashboard/marketplace/page.tsx`:

```typescript
'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { MarketplaceCard } from '@/components/marketplace/marketplace-card';

export default function MarketplacePage() {
  const availablePayments = useQuery(api.payments.list, { status: 'Created' });
  
  if (!availablePayments) return <div>Loading...</div>;
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Available Jobs</h1>
      
      <div className="grid gap-4">
        {availablePayments.length === 0 ? (
          <p className="text-muted-foreground">No jobs available</p>
        ) : (
          availablePayments.map((payment) => (
            <MarketplaceCard key={payment._id} payment={payment} />
          ))
        )}
      </div>
    </div>
  );
}
```

Create `frontend/components/marketplace/marketplace-card.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function MarketplaceCard({ payment }: { payment: any }) {
  const [isAccepting, setIsAccepting] = useState(false);
  
  async function handleAccept() {
    setIsAccepting(true);
    try {
      await fetch('/api/payments/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.paymentId }),
      });
      // Refresh or redirect
    } catch (error) {
      console.error('Failed to accept:', error);
    } finally {
      setIsAccepting(false);
    }
  }
  
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">Available</Badge>
            <span className="text-sm text-muted-foreground">
              #{payment.paymentId}
            </span>
          </div>
          <h3 className="font-semibold text-lg mb-2">{payment.condition}</h3>
          <p className="text-sm text-muted-foreground">
            Deadline: {new Date(payment.deadline).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right ml-4">
          <p className="text-2xl font-bold font-mono">{payment.amount} USDC</p>
          <Button 
            className="mt-4" 
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? 'Accepting...' : 'Accept Job'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

**6.5 Payment Detail Page**

Create `frontend/app/dashboard/payments/[id]/page.tsx`:

```typescript
'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PaymentTimeline } from '@/components/payments/payment-timeline';
import { SubmitProofForm } from '@/components/payments/submit-proof-form';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PaymentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const payment = useQuery(api.payments.get, { paymentId: params.id });
  const verification = useQuery(api.verifications.getByPaymentId, {
    paymentId: params.id,
  });
  
  if (!payment) return <div>Loading...</div>;
  
  const canSubmitProof = payment.status === 'Accepted' && 
                         payment.worker === currentUserAddress;
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">Payment #{payment.paymentId}</h1>
          <Badge className="mt-2">{payment.status}</Badge>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Amount</p>
          <p className="text-3xl font-bold font-mono">{payment.amount} USDC</p>
        </div>
      </div>
      
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Condition</h2>
          <p>{payment.condition}</p>
        </Card>
        
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Principal:</span>
              <span className="font-mono">{payment.principal}</span>
            </div>
            {payment.worker && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Worker:</span>
                <span className="font-mono">{payment.worker}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verifier:</span>
              <span>AI Agent</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deadline:</span>
              <span>{new Date(payment.deadline).toLocaleString()}</span>
            </div>
          </div>
        </Card>
        
        {canSubmitProof && (
          <SubmitProofForm paymentId={payment.paymentId} />
        )}
        
        {verification && (
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Verification Result</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={verification.approved ? 'default' : 'destructive'}>
                  {verification.approved ? 'Approved' : 'Rejected'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Confidence: {(verification.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-sm mt-2">{verification.reason}</p>
            </div>
          </Card>
        )}
        
        <PaymentTimeline payment={payment} />
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- ✅ Can create payment via UI
- ✅ Payment appears in "My Payments"
- ✅ Payment appears in marketplace
- ✅ Can accept payment from marketplace
- ✅ Payment detail page shows all info
- ✅ Can submit proof (next phase)

---

## 🤖 PHASE 7: AGENT DASHBOARD

### Objective: Build agent management and monitoring UI

#### Tasks:

**7.1 Create Agent Page**

Create `frontend/app/dashboard/agents/create/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export default function CreateAgentPage() {
  const router = useRouter();
  const createAgent = useMutation(api.agents.create);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'worker' | 'buyer'>('worker');
  const [maxPayment, setMaxPayment] = useState('100');
  const [minPayment, setMinPayment] = useState('10');
  const [autoAccept, setAutoAccept] = useState(false);
  const [dailyLimit, setDailyLimit] = useState('1000');
  const [isCreating, setIsCreating] = useState(false);
  const [apiKey, setApiKey] = useState('');
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const result = await createAgent({
        name,
        type,
        policies: {
          maxPayment: parseFloat(maxPayment),
          minPayment: parseFloat(minPayment),
          autoAccept,
          dailyLimit: parseFloat(dailyLimit),
        },
      });
      
      setApiKey(result.apiKey);
      // Show API key in modal, then redirect
    } catch (error) {
      console.error('Failed to create agent:', error);
    } finally {
      setIsCreating(false);
    }
  }
  
  if (apiKey) {
    return (
      <Card className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Agent Created!</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <p className="text-sm font-medium text-yellow-900 mb-2">
            ⚠️ Save this API key - you won't see it again!
          </p>
          <code className="block p-3 bg-white rounded border font-mono text-sm">
            {apiKey}
          </code>
        </div>
        <Button onClick={() => router.push('/dashboard/agents')}>
          Go to Agents
        </Button>
      </Card>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create AI Agent</h1>
      
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Agent Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Worker Agent"
              required
            />
          </div>
          
          <div>
            <Label>Agent Type</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full border rounded-md p-2"
            >
              <option value="worker">Worker (accepts jobs)</option>
              <option value="buyer">Buyer (creates payments)</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Min Payment (USDC)</Label>
              <Input
                type="number"
                value={minPayment}
                onChange={(e) => setMinPayment(e.target.value)}
              />
            </div>
            <div>
              <Label>Max Payment (USDC)</Label>
              <Input
                type="number"
                value={maxPayment}
                onChange={(e) => setMaxPayment(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label>Daily Limit (USDC)</Label>
            <Input
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={autoAccept}
              onCheckedChange={setAutoAccept}
            />
            <Label>Auto-accept payments within limits</Label>
          </div>
          
          <Button type="submit" className="w-full" disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Agent'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

**7.2 Agent List Page**

Create `frontend/app/dashboard/agents/page.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { AgentCard } from '@/components/agents/agent-card';

export default function AgentsPage() {
  const agents = useQuery(api.agents.listByOwner);
  
  if (!agents) return <div>Loading...</div>;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Agents</h1>
        <Link href="/dashboard/agents/create">
          <Button>Create Agent</Button>
        </Link>
      </div>
      
      <div className="grid gap-4">
        {agents.length === 0 ? (
          <p className="text-muted-foreground">No agents yet</p>
        ) : (
          agents.map((agent) => (
            <AgentCard key={agent._id} agent={agent} />
          ))
        )}
      </div>
    </div>
  );
}
```

Create `frontend/components/agents/agent-card.tsx`:

```typescript
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AgentCard({ agent }: { agent: any }) {
  return (
    <Link href={`/dashboard/agents/${agent._id}`}>
      <Card className="p-6 hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{agent.name}</h3>
              <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                {agent.isActive ? 'Active' : 'Paused'}
              </Badge>
              <Badge variant="outline">{agent.type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {agent.walletAddress.slice(0, 10)}...{agent.walletAddress.slice(-8)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Daily Limit</p>
            <p className="font-mono">{agent.policies.dailyLimit} USDC</p>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Min Payment</p>
            <p className="font-mono">{agent.policies.minPayment} USDC</p>
          </div>
          <div>
            <p className="text-muted-foreground">Max Payment</p>
            <p className="font-mono">{agent.policies.maxPayment} USDC</p>
          </div>
          <div>
            <p className="text-muted-foreground">Auto-Accept</p>
            <p>{agent.policies.autoAccept ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

**7.3 Agent Detail & Activity Page**

Create `frontend/app/dashboard/agents/[id]/page.tsx`:

```typescript
'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AgentActivityFeed } from '@/components/agents/activity-feed';

export default function AgentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const agent = useQuery(api.agents.get, { agentId: params.id });
  const activity = useQuery(api.agentActivity.getAgentActivity, {
    agentId: params.id,
    limit: 50,
  });
  
  if (!agent) return <div>Loading...</div>;
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">{agent.name}</h1>
          <div className="flex gap-2 mt-2">
            <Badge variant={agent.isActive ? 'default' : 'secondary'}>
              {agent.isActive ? 'Active' : 'Paused'}
            </Badge>
            <Badge variant="outline">{agent.type}</Badge>
          </div>
        </div>
        <Button variant="outline">Configure</Button>
      </div>
      
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Wallet & API</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wallet Address:</span>
              <span className="font-mono">{agent.walletAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">API Key:</span>
              <span className="font-mono">••••••••••••••••</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Policies</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Min Payment</p>
              <p className="font-mono">{agent.policies.minPayment} USDC</p>
            </div>
            <div>
              <p className="text-muted-foreground">Max Payment</p>
              <p className="font-mono">{agent.policies.maxPayment} USDC</p>
            </div>
            <div>
              <p className="text-muted-foreground">Daily Limit</p>
              <p className="font-mono">{agent.policies.dailyLimit} USDC</p>
            </div>
            <div>
              <p className="text-muted-foreground">Auto-Accept</p>
              <p>{agent.policies.autoAccept ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Activity Feed</h2>
          <AgentActivityFeed activity={activity || []} />
        </Card>
      </div>
    </div>
  );
}
```

Create `frontend/components/agents/activity-feed.tsx`:

```typescript
import { formatDistanceToNow } from 'date-fns';

export function AgentActivityFeed({ activity }: { activity: any[] }) {
  if (activity.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet</p>;
  }
  
  return (
    <div className="space-y-3">
      {activity.map((item) => (
        <div key={item._id} className="flex gap-3 text-sm">
          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
          <div className="flex-1">
            <p className="font-medium">{formatAction(item.action)}</p>
            {item.paymentId && (
              <p className="text-muted-foreground">
                Payment #{item.paymentId}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(item.timestamp, { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatAction(action: string) {
  const map: Record<string, string> = {
    'ACCEPTED_PAYMENT': 'Accepted payment',
    'SUBMITTED_PROOF': 'Submitted proof',
    'CREATED_PAYMENT': 'Created payment',
  };
  return map[action] || action;
}
```

**7.4 Agent API Routes**

Create `frontend/app/api/agent/create-payment/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { api } from '@/convex/_generated/api';
import { fetchQuery, fetchMutation } from 'convex/nextjs';
import { ConditionalPaymentSDK } from '@/sdk';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('X-API-Key');
  if (!apiKey) {
    return Response.json({ error: 'Missing API key' }, { status: 401 });
  }
  
  // Hash the API key to query
  const apiKeyHash = hashApiKey(apiKey);
  
  // Verify agent
  const agent = await fetchQuery(api.agents.getByApiKey, { apiKeyHash });
  if (!agent) {
    return Response.json({ error: 'Invalid API key' }, { status: 401 });
  }
  
  try {
    const { amount, condition, deadline } = await req.json();
    
    // Check policies
    if (amount > agent.policies.maxPayment || amount < agent.policies.minPayment) {
      return Response.json({ error: 'Amount outside policy limits' }, { status: 400 });
    }
    
    const conditionHash = createHash('sha256').update(condition).digest('hex');
    
    const sdk = new ConditionalPaymentSDK(/* config */);
    const verifierAddress = process.env.VERIFIER_WALLET_ADDRESS!;
    
    const paymentId = await sdk.createPayment({
      amount,
      condition: conditionHash,
      verifierAddress,
      deadline,
      principalWalletId: agent.circleWalletId,
    });
    
    // Store in Convex
    await fetchMutation(api.payments.create, {
      paymentId: paymentId.toString(),
      principal: agent._id,
      principalType: 'agent',
      verifier: verifierAddress,
      amount,
      condition,
      conditionHash,
      deadline,
    });
    
    // Log activity
    await fetchMutation(api.agentActivity.log, {
      agentId: agent._id,
      action: 'CREATED_PAYMENT',
      paymentId: paymentId.toString(),
    });
    
    return Response.json({ paymentId: paymentId.toString() });
    
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}
```

Create similar routes for:
- `/api/agent/accept-payment` - Agent accepts a payment
- `/api/agent/submit-proof` - Agent submits proof
- `/api/agent/list-payments` - Agent queries available payments

**Acceptance Criteria:**
- ✅ Can create agent via UI
- ✅ API key shown once and saved
- ✅ Agent list shows all user's agents
- ✅ Agent detail shows configuration
- ✅ Activity feed shows agent actions
- ✅ Agent API endpoints work with API key auth

---

## 🔗 PHASE 8: INTEGRATION & TESTING

### Objective: Connect all pieces and ensure end-to-end functionality

#### Tasks:

**8.1 End-to-End Flow Testing**

Test scenarios:
- [ ] **Human creates payment** → Worker accepts → Submits proof → AI verifies → Payment released
- [ ] **Agent creates payment** (via API) → Human accepts → Submits proof → Verified → Released
- [ ] **Human creates payment** → Agent accepts (via API) → Agent submits → Verified → Released
- [ ] **Agent creates payment** → Agent accepts → Agent submits → Verified → Released (full autonomous)

**8.2 Circle Wallet Integration Testing**

- [ ] User signup creates Circle Wallet
- [ ] Agent creation creates Circle Wallet
- [ ] USDC transfers work correctly
- [ ] Gas fees (in USDC) are handled properly
- [ ] Wallet balances update in real-time

**8.3 Blockchain Event Listener**

Ensure:
- [ ] ProofSubmitted event triggers verification
- [ ] PaymentCreated syncs to Convex
- [ ] PaymentReleased updates UI
- [ ] Events are reliably caught

**8.4 Error Handling & Edge Cases**

Test:
- [ ] Insufficient USDC balance
- [ ] Expired deadlines (timeout refund)
- [ ] Invalid proof submission
- [ ] AI verification errors
- [ ] Network failures
- [ ] Concurrent requests

**8.5 Performance Optimization**

- [ ] Optimize Convex queries with indexes
- [ ] Add loading states everywhere
- [ ] Implement optimistic updates
- [ ] Cache frequently accessed data

**8.6 Security Audit**

- [ ] API key hashing (not storing plain text)
- [ ] Input validation on all endpoints
- [ ] Rate limiting on public endpoints
- [ ] CORS configuration
- [ ] Environment variables not exposed

**Acceptance Criteria:**
- ✅ All 4 user flows work end-to-end
- ✅ No critical bugs
- ✅ Error handling in place
- ✅ Performance acceptable (<3s page loads)

---

## 🎨 PHASE 9: POLISH & DEMO PREPARATION

### Objective: Make it demo-ready and submission-worthy

#### Tasks:

**9.1 UI Polish**

- [ ] Consistent styling across all pages
- [ ] Loading indicators everywhere
- [ ] Error messages user-friendly
- [ ] Responsive design (mobile-friendly)
- [ ] Animations/transitions for state changes
- [ ] Empty states with helpful CTAs

**9.2 Documentation**

Create `README.md`:
```markdown
# Agent-Verified Conditional Payment Protocol

AI-verified conditional payments on Arc blockchain with USDC.

## Features
- Human-to-human conditional payments
- Agent-to-agent autonomous commerce
- Hybrid human-agent transactions
- AI verification powered by Gemini
- Built on Arc with USDC

## Tech Stack
- Smart Contracts: Solidity + Foundry
- Frontend: Next.js + Clerk + Convex
- AI: Gemini 2.0 Flash via Vercel AI SDK
- Blockchain: Arc Testnet
- Wallets: Circle Programmable Wallets

## Getting Started
[Setup instructions]

## Architecture
[Diagram or explanation]

## Demo
[Video link]

## Circle Product Feedback
[Required feedback section]
```

**9.3 Demo Video (REQUIRED)**

Record 3-5 minute video showing:
1. **Overview** (30s) - What it is, why it matters
2. **Human Flow** (60s) - Create payment → Accept → Submit → Verify → Release
3. **Agent Flow** (60s) - Agent dashboard → API call → Auto-fulfillment
4. **Transaction Proof** (30s) - Show on Circle Console + Arc Explorer
5. **Key Features** (60s) - Multi-modal verification, policy controls, activity logs
6. **Closing** (30s) - Built on Arc, USDC, Circle, Gemini

**9.4 Screenshots**

Capture:
- Landing page
- Dashboard overview
- Create payment form
- Payment marketplace
- Agent dashboard
- Verification result
- Transaction on Arc Explorer

**9.5 Circle Product Feedback**

In README, include detailed section:
```markdown
## Circle Product Feedback

### Products Used
- Arc Testnet
- USDC on Arc
- Circle Developer-Controlled Wallets

### What Worked Well
[Honest feedback]

### Challenges Encountered
[Specific issues]

### Recommendations
[How to improve DX]
```

**9.6 Test Data Preparation**

Create sample:
- 5-10 demo payments in various states
- 2-3 demo agents with activity
- Sample verifications with different outcomes
- Populated marketplace

**Acceptance Criteria:**
- ✅ README complete with all sections
- ✅ Demo video recorded and uploaded
- ✅ Screenshots captured
- ✅ Circle feedback written
- ✅ Test data populated
- ✅ UI polished and bug-free

---

## 📤 PHASE 10: SUBMISSION

### Objective: Submit to hackathon

#### Tasks:

**10.1 Final Checklist**

- [ ] All required fields in lablab.ai submission form
- [ ] Project title compelling
- [ ] Short description (1-2 sentences)
- [ ] Long description (detailed)
- [ ] Cover image uploaded
- [ ] Demo video uploaded
- [ ] Slide presentation (optional but recommended)
- [ ] GitHub repo public
- [ ] Application URL (deployed on Vercel)
- [ ] Transaction flow demonstration in video
- [ ] Circle Product Feedback included

**10.2 Deploy to Production**

```bash
# Deploy frontend
cd frontend
vercel --prod

# Deploy Convex
pnpx convex deploy --prod

# Update environment variables on Vercel
```

**10.3 GitHub Repo Cleanup**

- [ ] Add proper .gitignore
- [ ] Clean commit history
- [ ] Add LICENSE file (MIT)
- [ ] Ensure README is at root

**10.4 Test Deployed Version**

- [ ] All features work on production URL
- [ ] No console errors
- [ ] Environment variables set correctly
- [ ] Wallet connections work
- [ ] Transactions execute on Arc testnet

**10.5 Submit on lablab.ai**

1. Go to hackathon page
2. Click "Submit Project"
3. Fill all required fields
4. Double-check everything
5. Submit!

**10.6 Social Media (Optional)**

- [ ] Tweet about submission
- [ ] Share on LinkedIn
- [ ] Post in hackathon Discord

**Acceptance Criteria:**
- ✅ Project submitted before deadline
- ✅ All required materials included
- ✅ Production deployment working
- ✅ GitHub repo accessible

---

## 🎯 SUCCESS CRITERIA SUMMARY

### Technical Requirements ✅
- [x] Built on Arc blockchain
- [x] Uses USDC for payments and gas
- [x] Circle Programmable Wallets integrated
- [x] Smart contract deployed and verified
- [x] AI verification with Gemini
- [x] Transaction flow demonstrable

### Hackathon Tracks 🏆
**Eligible for:**
- ✅ Best Trustless AI Agent
- ✅ Best Dev Tools (SDK)
- ✅ Best Autonomous Commerce Application
- ✅ Best Product Design
- ✅ Best use of Gemini (GCP credits)

### Demo Quality 🎬
- Clear value proposition
- Working end-to-end
- Professional presentation
- Detailed documentation

---

## 📚 APPENDIX: HELPFUL RESOURCES

### Arc Documentation
- `/frontend/docs/dev-circle-llms.txt`

### Environment Variables Reference
- `/frontend/docs/available-env.md`

### Implementation Plan
- `/frontend/docs/implementation-plan.md`

### Project Description
- `/frontend/docs/project-description.md`

### Hackathon Details
- `/frontend/docs/hackathon-details.md`

### Useful Commands

```bash
# Smart Contracts
cd contracts
forge build
forge test
forge script script/Deploy.s.sol --broadcast

# SDK
cd sdk
pnpm build

# Frontend
cd frontend
pnpm dev
pnpm build
pnpx convex dev

# Convex
pnpx convex deploy --prod
pnpx convex dashboard

# Testing
# Run local testnet
# Deploy contract
# Test SDK
# Test frontend flows
```

### Key Files to Reference
- Smart Contract: `contracts/src/ConditionalPayment.sol`
- SDK: `sdk/src/ConditionalPaymentSDK.ts`
- Schema: `convex/schema.ts`
- Gemini: `frontend/lib/ai-verifier.ts`

---

## 💪 DEVELOPMENT TIPS FOR AI PAIR PROGRAMMING

### When Starting New Session
1. Share this implementation plan
2. Check out repo
3. Specify which phase you're working on
4. Reference relevant docs from `/docs/`

### Best Practices
- ✅ Work in phases sequentially
- ✅ Test after each major feature
- ✅ Commit frequently with clear messages. Use conventional squashed commit messages with description included.
- ✅ Ask for code review before moving to next phase

### If You Get Stuck
- Check `/docs/dev-circle-llms.txt` for Arc/Circle specifics
- Reference smart contract for event names
- Look at Convex schema for data structure
- Test in isolation (e.g., just SDK, just API)

---

# 🚀 READY TO BUILD!

**Good luck! Let's build something amazing! 🎉**