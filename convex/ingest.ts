
import { action, internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
});

export const clearAllProducts = mutation({
    args: {},
    handler: async (ctx) => {
        const products = await ctx.db.query("products").collect();
        for (const product of products) {
            await ctx.db.delete(product._id);
        }
    },
});
export const saveProducts = internalMutation({
    args: {
        products: v.array(
            v.object({
                name: v.string(),
                flavor: v.string(),
                puffs: v.optional(v.number()),
                description: v.optional(v.string()),
                imageUrl: v.string(),
                url: v.string(),
                coldness: v.optional(v.number()),
                sweetness: v.optional(v.number()),
                sourness: v.optional(v.boolean()),
                features: v.optional(v.array(v.object({ name: v.string(), value: v.string() }))),
                strength: v.optional(v.string()),
                deviceType: v.optional(v.string()),
                categories: v.optional(v.array(v.string())),
                images: v.optional(v.array(v.string())),
                embedding: v.array(v.float64()),
                searchText: v.optional(v.string()),
            })
        ),
    },
    handler: async (ctx, args) => {
        for (const product of args.products) {
            await ctx.db.insert("products", product);
        }
    },
});

export const saveReviews = internalMutation({
    args: {
        reviews: v.array(
            v.object({
                productName: v.string(), // We'll use name to link for now, or we need to pass the ID back
                author: v.string(),
                rating: v.number(),
                text: v.string(),
                date: v.string(),
            })
        ),
    },
    handler: async (ctx, args) => {
        for (const review of args.reviews) {
            const product = await ctx.db
                .query("products")
                .withIndex("by_name", (q) => q.eq("name", review.productName))
                .first();

            if (product) {
                await ctx.db.insert("reviews", {
                    productId: product._id,
                    author: review.author,
                    rating: review.rating,
                    text: review.text,
                    date: review.date,
                });
            }
        }
    },
});

export const ingest = action({
    args: {
        products: v.array(
            v.object({
                name: v.string(),
                flavor: v.string(),
                puffs: v.optional(v.number()),
                description: v.optional(v.string()),
                imageUrl: v.string(),
                images: v.optional(v.array(v.string())),
                url: v.string(),
                coldness: v.optional(v.number()),
                sweetness: v.optional(v.number()),
                sourness: v.optional(v.boolean()),
                features: v.optional(v.array(v.object({ name: v.string(), value: v.string() }))),
                strength: v.optional(v.string()),
                deviceType: v.optional(v.string()),
                categories: v.optional(v.array(v.string())),
                reviews: v.optional(
                    v.array(
                        v.object({
                            author: v.string(),
                            rating: v.number(),
                            text: v.string(),
                            date: v.string(),
                        })
                    )
                ),
            })
        ),
    },
    handler: async (ctx, args) => {
        const productsWithEmbeddings = [];
        const allReviews = [];

        for (const product of args.products) {
            const textToEmbed = `
Name: ${product.name}
Flavor: ${product.flavor}
Description: ${product.description || ""}
Categories: ${product.categories?.join(", ") || ""}
Strength: ${product.strength || ""}
Device Type: ${product.deviceType || ""}
Features: ${product.features?.map((f) => `${f.name}: ${f.value}`).join(", ") || ""}
`.trim();

            const embeddingResponse = await openai.embeddings.create({
                model: "google/gemini-embedding-001",
                input: textToEmbed,
            });
            if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
                console.error(`Failed to generate embedding for product: ${product.name}`);
                continue;
            }
            const embedding = embeddingResponse.data[0]?.embedding;
            if (!embedding) continue;

            productsWithEmbeddings.push({
                name: product.name,
                flavor: product.flavor,
                puffs: product.puffs,
                description: product.description,
                imageUrl: product.imageUrl,
                images: product.images,
                url: product.url,
                coldness: product.coldness,
                sweetness: product.sweetness,
                sourness: product.sourness,
                features: product.features,
                strength: product.strength,
                deviceType: product.deviceType,
                categories: product.categories,
                embedding,
                searchText: textToEmbed,
            });

            if (product.reviews) {
                for (const review of product.reviews) {
                    allReviews.push({
                        productName: product.name,
                        ...review,
                    });
                }
            }
        }

        await ctx.runMutation(internal.ingest.saveProducts, {
            products: productsWithEmbeddings,
        });

        if (allReviews.length > 0) {
            await ctx.runMutation(internal.ingest.saveReviews, {
                reviews: allReviews,
            });
        }
    },
});
