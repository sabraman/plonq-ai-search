import { internalQuery } from "./_generated/server";

export const verifyMigration = internalQuery({
    args: {},
    handler: async (ctx) => {
        const productsCount = (await ctx.db.query("products").collect()).length;
        const embeddingsCount = (await ctx.db.query("productEmbeddings").collect()).length;

        // Check a sample product to see if embedding is gone (it won't be physically gone unless we replaced the doc, which we did)
        const sampleProduct = await ctx.db.query("products").first();
        const hasEmbedding = sampleProduct ? "embedding" in sampleProduct : false;

        return {
            productsCount,
            embeddingsCount,
            sampleProductHasEmbedding: hasEmbedding,
            status: productsCount === embeddingsCount ? "Migration Complete" : "Migration Incomplete"
        };
    },
});
