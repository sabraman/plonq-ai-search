
import { action, internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import OpenAI from "openai";

const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export const clearAllProducts = mutation({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 100;
        const products = await ctx.db.query("products").take(limit);
        for (const product of products) {
            await ctx.db.delete(product._id);
        }
        return products.length;
    },
});

export const clearProductEmbeddings = mutation({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 100;
        const embeddings = await ctx.db.query("productEmbeddings").take(limit);
        for (const embedding of embeddings) {
            await ctx.db.delete(embedding._id);
        }
        return embeddings.length;
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
                coldnessLabel: v.optional(v.string()),
                sweetnessLabel: v.optional(v.string()),
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
                images: v.optional(v.array(v.string())),
                embedding: v.array(v.float64()),
                searchText: v.optional(v.string()),
            })
        ),
    },
    handler: async (ctx, args) => {
        for (const product of args.products) {
            const { embedding, ...productData } = product;
            const productId = await ctx.db.insert("products", productData);
            await ctx.db.insert("productEmbeddings", {
                productId,
                embedding,
                strength: product.strength,
                deviceType: product.deviceType,
            });
        }
    },
});

// saveReviews mutation removed

export const getProductsForEmbedding = internalMutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("products").collect();
    },
});

export const replaceProductEmbedding = internalMutation({
    args: {
        productId: v.id("products"),
        embedding: v.array(v.float64()),
        strength: v.optional(v.string()),
        deviceType: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("productEmbeddings")
            .withIndex("by_productId", (q) => q.eq("productId", args.productId))
            .collect();

        for (const doc of existing) {
            await ctx.db.delete(doc._id);
        }

        await ctx.db.insert("productEmbeddings", {
            productId: args.productId,
            embedding: args.embedding,
            strength: args.strength,
            deviceType: args.deviceType,
        });
    },
});

export const rebuildProductEmbeddings = action({
    args: {},
    handler: async (ctx) => {
        const products = await ctx.runMutation(internal.ingest.getProductsForEmbedding);
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
        });

        let rebuilt = 0;
        let failed = 0;

        for (const product of products) {
            const textToEmbed = `
Name: ${product.name}
Flavor: ${product.flavor}
Description: ${product.description || ""}
Categories: ${product.categories?.join(", ") || ""}
Strength: ${product.strength || ""}
Coldness: ${product.coldnessLabel || ""}
Sweetness: ${product.sweetnessLabel || ""}
Device Type: ${product.deviceType || ""}
Features: ${product.features?.map((f) => `${f.name}: ${f.value}`).join(", ") || ""}
`.trim();

            const embeddingResponse = await openai.embeddings.create({
                model: EMBEDDING_MODEL,
                input: textToEmbed,
            });
            const embedding = embeddingResponse.data?.[0]?.embedding;

            if (!embedding) {
                failed++;
                continue;
            }

            await ctx.runMutation(internal.ingest.replaceProductEmbedding, {
                productId: product._id,
                embedding,
                strength: product.strength,
                deviceType: product.deviceType,
            });
            rebuilt++;
        }

        return { rebuilt, failed, model: EMBEDDING_MODEL };
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
                coldnessLabel: v.optional(v.string()),
                sweetnessLabel: v.optional(v.string()),
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
Coldness: ${product.coldnessLabel || ""}
Sweetness: ${product.sweetnessLabel || ""}
Device Type: ${product.deviceType || ""}
Features: ${product.features?.map((f) => `${f.name}: ${f.value}`).join(", ") || ""}
`.trim();

            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
                baseURL: process.env.OPENAI_BASE_URL,
            });

            const embeddingResponse = await openai.embeddings.create({
                model: EMBEDDING_MODEL,
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
                coldnessLabel: product.coldnessLabel,
                sweetnessLabel: product.sweetnessLabel,
                sourness: product.sourness,
                features: product.features,
                strength: product.strength,
                deviceType: product.deviceType,
                categories: product.categories,
                reviews: product.reviews,
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
    },
});
