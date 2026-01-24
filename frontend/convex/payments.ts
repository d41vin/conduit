import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new payment record (called after on-chain creation)
 */
export const create = mutation({
    args: {
        onChainId: v.string(),
        transactionHash: v.optional(v.string()),
        principalAddress: v.string(),
        principalUserId: v.optional(v.string()),
        verifierAddress: v.string(),
        amount: v.number(),
        condition: v.string(),
        conditionHash: v.string(),
        deadline: v.number(),
    },
    handler: async (ctx, args) => {
        const paymentId = await ctx.db.insert("payments", {
            ...args,
            status: "Created",
            createdAt: Date.now(),
        });
        return paymentId;
    },
});

/**
 * Get a payment by its on-chain ID
 */
export const getByOnChainId = query({
    args: { onChainId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("payments")
            .withIndex("by_on_chain_id", (q) => q.eq("onChainId", args.onChainId))
            .first();
    },
});

/**
 * Get a payment by its Convex ID
 */
export const get = query({
    args: { id: v.id("payments") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

/**
 * List payments with optional filters
 */
export const list = query({
    args: {
        status: v.optional(v.string()),
        principalAddress: v.optional(v.string()),
        workerAddress: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        let payments;

        if (args.status) {
            payments = await ctx.db
                .query("payments")
                .withIndex("by_status", (q) => q.eq("status", args.status!))
                .order("desc")
                .take(limit);
        } else if (args.principalAddress) {
            payments = await ctx.db
                .query("payments")
                .withIndex("by_principal", (q) =>
                    q.eq("principalAddress", args.principalAddress!)
                )
                .order("desc")
                .take(limit);
        } else if (args.workerAddress) {
            payments = await ctx.db
                .query("payments")
                .withIndex("by_worker", (q) =>
                    q.eq("workerAddress", args.workerAddress!)
                )
                .order("desc")
                .take(limit);
        } else {
            payments = await ctx.db.query("payments").order("desc").take(limit);
        }

        return payments;
    },
});

/**
 * List available payments (status = Created) for the marketplace
 */
export const listAvailable = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        return await ctx.db
            .query("payments")
            .withIndex("by_status", (q) => q.eq("status", "Created"))
            .order("desc")
            .take(limit);
    },
});

/**
 * Update payment when worker accepts
 */
export const accept = mutation({
    args: {
        onChainId: v.string(),
        workerAddress: v.string(),
        workerUserId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const payment = await ctx.db
            .query("payments")
            .withIndex("by_on_chain_id", (q) => q.eq("onChainId", args.onChainId))
            .first();

        if (!payment) throw new Error("Payment not found");

        await ctx.db.patch(payment._id, {
            workerAddress: args.workerAddress,
            workerUserId: args.workerUserId,
            status: "Accepted",
            acceptedAt: Date.now(),
        });

        return payment._id;
    },
});

/**
 * Update payment when proof is submitted
 */
export const markSubmitted = mutation({
    args: {
        onChainId: v.string(),
    },
    handler: async (ctx, args) => {
        const payment = await ctx.db
            .query("payments")
            .withIndex("by_on_chain_id", (q) => q.eq("onChainId", args.onChainId))
            .first();

        if (!payment) throw new Error("Payment not found");

        await ctx.db.patch(payment._id, {
            status: "Submitted",
            submittedAt: Date.now(),
        });

        return payment._id;
    },
});

/**
 * Update payment after verification
 */
export const updateAfterVerification = mutation({
    args: {
        onChainId: v.string(),
        approved: v.boolean(),
    },
    handler: async (ctx, args) => {
        const payment = await ctx.db
            .query("payments")
            .withIndex("by_on_chain_id", (q) => q.eq("onChainId", args.onChainId))
            .first();

        if (!payment) throw new Error("Payment not found");

        if (args.approved) {
            await ctx.db.patch(payment._id, {
                status: "Released",
                verifiedAt: Date.now(),
                releasedAt: Date.now(),
            });
        } else {
            // On rejection, go back to Accepted to allow resubmission
            await ctx.db.patch(payment._id, {
                status: "Accepted",
                verifiedAt: Date.now(),
            });
        }

        return payment._id;
    },
});

/**
 * Update payment when refunded
 */
export const markRefunded = mutation({
    args: {
        onChainId: v.string(),
    },
    handler: async (ctx, args) => {
        const payment = await ctx.db
            .query("payments")
            .withIndex("by_on_chain_id", (q) => q.eq("onChainId", args.onChainId))
            .first();

        if (!payment) throw new Error("Payment not found");

        await ctx.db.patch(payment._id, {
            status: "Refunded",
        });

        return payment._id;
    },
});

/**
 * List submitted payments with their proof
 */
export const listSubmittedWithProofs = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        // 1. Get all submitted payments
        const payments = await ctx.db
            .query("payments")
            .withIndex("by_status", (q) => q.eq("status", "Submitted"))
            .order("desc")
            .take(limit);

        // 2. Fetch proofs for each
        const paymentsWithProofs = await Promise.all(
            payments.map(async (payment) => {
                const proof = await ctx.db
                    .query("proofs")
                    .withIndex("by_payment", (q) => q.eq("paymentId", payment._id))
                    .first();

                return {
                    ...payment,
                    proofHash: proof?.proofHash,
                    proofText: proof?.proofText,
                };
            })
        );

        return paymentsWithProofs;
    },
});
