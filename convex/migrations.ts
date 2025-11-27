
import { internalMutation } from "./_generated/server";

export const embedReviews = internalMutation({
    args: {},
    handler: async (ctx) => {
        const products = await ctx.db.query("products").collect();
        let updatedCount = 0;

        for (const product of products) {
            // Find reviews for this product
            const reviews = await ctx.db
                .query("reviews")
                .withIndex("by_product", (q) => q.eq("productId", product._id))
                .collect();

            if (reviews.length > 0) {
                // Map to the format expected by the schema
                const embeddedReviews = reviews.map((r) => ({
                    author: r.author,
                    date: r.date,
                    rating: r.rating,
                    text: r.text,
                }));

                await ctx.db.patch(product._id, {
                    reviews: embeddedReviews,
                });
                updatedCount++;
            }
        }
        console.log(`Updated ${updatedCount} products with reviews.`);
    },
});
