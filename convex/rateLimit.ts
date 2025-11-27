import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const check = internalMutation({
    args: {
        key: v.string(),
        limit: v.number(),
        windowMs: v.number(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const record = await ctx.db
            .query("rateLimits")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .unique();

        if (record) {
            if (now > record.resetTime) {
                // Window expired, reset
                await ctx.db.patch(record._id, {
                    count: 1,
                    resetTime: now + args.windowMs,
                });
                return { success: true };
            } else {
                // Within window
                if (record.count >= args.limit) {
                    return { success: false, retryAfter: record.resetTime };
                }
                await ctx.db.patch(record._id, {
                    count: record.count + 1,
                });
                return { success: true };
            }
        } else {
            // New record
            await ctx.db.insert("rateLimits", {
                key: args.key,
                count: 1,
                resetTime: now + args.windowMs,
            });
            return { success: true };
        }
    },
});
