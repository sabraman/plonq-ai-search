import { query } from "./_generated/server";
import { v } from "convex/values";

export const getRecentSearches = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        return await ctx.db
            .query("searchLogs")
            .withIndex("by_timestamp")
            .order("desc")
            .take(limit);
    },
});

export const getZeroResultSearches = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        const logs = await ctx.db
            .query("searchLogs")
            .withIndex("by_timestamp")
            .order("desc")
            .take(1000); // Scan more to find zero results

        return logs.filter((log) => log.resultsCount === 0).slice(0, limit);
    },
});

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const productsCount = (await ctx.db.query("products").collect()).length;
        // reviews table removed

        // Count searches in last 24h
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const recentSearches = await ctx.db
            .query("searchLogs")
            .withIndex("by_timestamp", (q) => q.gte("timestamp", oneDayAgo))
            .collect();

        return {
            productsCount,
            searchesLast24h: recentSearches.length,
        };
    },
});
