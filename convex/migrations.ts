import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation } from "./_generated/server";

export const splitEmbeddings = internalMutation({
    args: {},
    handler: async (ctx) => {
        const products = await ctx.db.query("products").collect();
        let migratedCount = 0;

        for (const product of products) {
            // Check if already migrated (optional, but good for idempotency if we check existence)
            // Actually, we can just check if `embedding` field exists on product.
            // But `collect` returns the shape defined in schema? 
            // If we deployed the new schema, `embedding` might not be in the type, but it's in the doc?
            // Convex schema validation happens on write, reads might return extra fields if they exist?
            // Let's assume we can access it.

            const p = product as any;
            if (p.embedding && p.embedding.length > 0) {
                // Check if already exists in productEmbeddings
                const existing = await ctx.db
                    .query("productEmbeddings")
                    .withIndex("by_productId", (q) => q.eq("productId", p._id))
                    .first();

                if (!existing) {
                    // Create entry in productEmbeddings
                    await ctx.db.insert("productEmbeddings", {
                        productId: p._id,
                        embedding: p.embedding,
                        strength: p.strength,
                        deviceType: p.deviceType,
                    });
                }

                // Remove embedding from product
                // We use `patch` to update. To delete a field, we can't easily do it with `patch` if it's not optional in schema?
                // But in new schema it is NOT present.
                // So we should `replace` or `patch`?
                // Convex `patch` doesn't delete fields unless we set them to undefined?
                // Actually, to remove a field, we need to replace the document or use `patch` with `undefined` if schema allows?
                // But the field is removed from schema.
                // Let's try `patch` with `embedding: undefined` (might not work if not in schema)
                // Or just `patch` other fields? No, that won't remove it.
                // We need to use `replace` with the new object without embedding.

                const { embedding, ...rest } = p;
                await ctx.db.replace(p._id, rest);

                migratedCount++;
            }
        }
        return `Migrated ${migratedCount} products.`;
    },
});

export const stripLegacyProductEmbeddingsPage = internalMutation({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        const page = await ctx.db.query("products").paginate(args.paginationOpts);
        let migratedCount = 0;

        for (const product of page.page) {
            const p = product as typeof product & { embedding?: number[] };
            if (!p.embedding) continue;

            const { embedding: _embedding, ...rest } = p;
            await ctx.db.replace(p._id, rest);
            migratedCount++;
        }

        return {
            migratedCount,
            continueCursor: page.continueCursor,
            isDone: page.isDone,
        };
    },
});

export const stripLegacyProductEmbeddings = action({
    args: { batchSize: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const batchSize = args.batchSize ?? 5;
        let cursor: string | null = null;
        let migratedCount = 0;

        while (true) {
            const result: {
                migratedCount: number;
                continueCursor: string;
                isDone: boolean;
            } = await ctx.runMutation(internal.migrations.stripLegacyProductEmbeddingsPage, {
                paginationOpts: {
                    numItems: batchSize,
                    cursor,
                },
            });

            migratedCount += result.migratedCount;
            if (result.isDone) break;
            cursor = result.continueCursor;
        }

        return { migratedCount };
    },
});
