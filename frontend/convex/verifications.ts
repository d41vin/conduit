import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a verification record
 */
export const create = mutation({
    args: {
        paymentId: v.id("payments"),
        onChainPaymentId: v.string(),
        approved: v.boolean(),
        confidence: v.number(),
        reason: v.string(),
        issues: v.optional(v.array(v.string())),
        transactionHash: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const verificationId = await ctx.db.insert("verifications", {
            ...args,
            verifiedAt: Date.now(),
        });
        return verificationId;
    },
});

/**
 * Get verification by payment ID
 */
export const getByPayment = query({
    args: { paymentId: v.id("payments") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("verifications")
            .withIndex("by_payment", (q) => q.eq("paymentId", args.paymentId))
            .order("desc")
            .first();
    },
});

/**
 * Get verification by on-chain payment ID
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
            .query("verifications")
            .withIndex("by_payment", (q) => q.eq("paymentId", payment._id))
            .order("desc")
            .first();
    },
});
