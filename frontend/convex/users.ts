import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get current user by Clerk ID
 */
export const getByClerkId = query({
    args: { clerkUserId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
            .first();
    },
});

/**
 * Get user by wallet address
 */
export const getByWallet = query({
    args: { walletAddress: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
            .first();
    },
});

/**
 * Create or update user from Clerk webhook
 */
export const upsertFromClerk = mutation({
    args: {
        clerkUserId: v.string(),
        email: v.string(),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if user exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
            .first();

        if (existingUser) {
            // Update existing user
            await ctx.db.patch(existingUser._id, {
                email: args.email,
                name: args.name,
            });
            return existingUser._id;
        }

        // Create new user
        const userId = await ctx.db.insert("users", {
            clerkUserId: args.clerkUserId,
            email: args.email,
            name: args.name,
            createdAt: Date.now(),
        });

        return userId;
    },
});

/**
 * Update user's wallet address
 */
export const updateWallet = mutation({
    args: {
        clerkUserId: v.string(),
        walletAddress: v.string(),
        circleWalletId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
            .first();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(user._id, {
            walletAddress: args.walletAddress,
            circleWalletId: args.circleWalletId,
        });

        return user._id;
    },
});
