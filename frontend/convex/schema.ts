import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex schema for Conduit Protocol
 * Minimal schema for the core flow: create → accept → submit → verify → release
 */
export default defineSchema({
  /**
   * Users - linked to Clerk authentication
   */
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    walletAddress: v.optional(v.string()), // Circle wallet address
    circleWalletId: v.optional(v.string()), // Circle wallet ID
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkUserId"])
    .index("by_wallet", ["walletAddress"]),

  /**
   * Payments - mirrors on-chain state with additional off-chain metadata
   */
  payments: defineTable({
    // On-chain identifiers
    onChainId: v.string(), // The uint256 payment ID from smart contract
    transactionHash: v.optional(v.string()), // Creation transaction hash

    // Parties
    principalAddress: v.string(), // Creator's wallet address
    principalUserId: v.optional(v.string()), // Clerk user ID if human
    workerAddress: v.optional(v.string()), // Worker's wallet address
    workerUserId: v.optional(v.string()), // Clerk user ID if human
    verifierAddress: v.string(), // AI verifier address

    // Payment details
    amount: v.number(), // USDC amount (human readable, e.g. 100.50)
    condition: v.string(), // Full condition text (hash stored on-chain)
    conditionHash: v.string(), // SHA256 hash of condition

    // Status tracking
    status: v.string(), // "Created" | "Accepted" | "Submitted" | "Released" | "Refunded"

    // Timestamps
    deadline: v.number(), // Unix timestamp
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
    submittedAt: v.optional(v.number()),
    verifiedAt: v.optional(v.number()),
    releasedAt: v.optional(v.number()),
  })
    .index("by_on_chain_id", ["onChainId"])
    .index("by_principal", ["principalAddress"])
    .index("by_worker", ["workerAddress"])
    .index("by_status", ["status"]),

  /**
   * Proofs - submitted by workers for verification
   */
  proofs: defineTable({
    paymentId: v.id("payments"), // Reference to payment
    onChainPaymentId: v.string(), // For quick lookup

    // Proof data
    proofType: v.string(), // "text" | "image" | "document"
    proofText: v.optional(v.string()), // Text content if text proof
    proofStorageId: v.optional(v.string()), // Convex file storage ID if file
    proofHash: v.string(), // Hash stored on-chain

    // Metadata
    submittedBy: v.string(), // Wallet address
    submittedAt: v.number(),
  }).index("by_payment", ["paymentId"]),

  /**
   * Verifications - AI verification results
   */
  verifications: defineTable({
    paymentId: v.id("payments"),
    onChainPaymentId: v.string(),

    // Verification result
    approved: v.boolean(),
    confidence: v.number(), // 0-1 confidence score
    reason: v.string(), // AI explanation
    issues: v.optional(v.array(v.string())), // Specific issues found

    // Transaction
    transactionHash: v.optional(v.string()),
    verifiedAt: v.number(),
  }).index("by_payment", ["paymentId"]),
});
