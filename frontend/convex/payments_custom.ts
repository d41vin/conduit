import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ... existing imports ...

// ... existing functions ...

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
                    .withIndex("by_payment_id", (q) => q.eq("paymentId", payment._id))
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

// ... existing exports ...
