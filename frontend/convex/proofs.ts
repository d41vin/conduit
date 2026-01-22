import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new proof record
 */
export const create = mutation({
    args: {
        paymentId: v.id("payments"),
        onChainPaymentId: v.string(),
        proofType: v.string(), // "text" | "image" | "document"
        proofText: v.optional(v.string()),
        proofStorageId: v.optional(v.string()),
        proofHash: v.string(),
        submittedBy: v.string(),
    },
    handler: async (ctx, args) => {
        const proofId = await ctx.db.insert("proofs", {
            ...args,
            submittedAt: Date.now(),
        });
        return proofId;
    },
});

/**
 * Get proof by payment ID
 */
export const getByPayment = query({
    args: { paymentId: v.id("payments") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("proofs")
            .withIndex("by_payment", (q) => q.eq("paymentId", args.paymentId))
            .first();
    },
});

/**
 * Get the most recent proof for a payment by on-chain ID
 */
export const getByOnChainPaymentId = query({
    args: { onChainPaymentId: v.string() },
    handler: async (ctx, args) => {
        // First get the payment
        const payment = await ctx.db
            .query("payments")
            .withIndex("by_on_chain_id", (q) =>
                q.eq("onChainId", args.onChainPaymentId)
            )
            .first();

        if (!payment) return null;

        return await ctx.db
            .query("proofs")
            .withIndex("by_payment", (q) => q.eq("paymentId", payment._id))
            .order("desc")
            .first();
    },
});
