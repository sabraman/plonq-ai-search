
import { action, internalQuery, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import OpenAI from "openai";
import { Id } from "./_generated/dataModel";

interface Product {
    _id: Id<"products">;
    _creationTime: number;
    name: string;
    flavor: string;
    description?: string;
    imageUrl: string;
    url: string;
    embedding: number[];
    puffs?: number;
    strength?: string;
    deviceType?: string;
    categories?: string[];
    features?: { name: string; value: string }[];
    images?: string[];
    reviews?: { author: string; date: string; rating: number; text: string }[];
    coldness?: number;
    sweetness?: number;
    coldnessLabel?: string;
    sweetnessLabel?: string;
    sourness?: boolean;
}

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("products").collect();
    },
});

export const getProduct = internalQuery({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});



export const searchProducts = internalQuery({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("products")
            .withSearchIndex("search_body", (q) => q.search("searchText", args.query))
            .take(10);
    },
});

export const search = action({
    args: {
        preferences: v.string(),
        initData: v.string(),
        filters: v.optional(v.object({
            strength: v.optional(v.array(v.string())),
            deviceType: v.optional(v.array(v.string())),
            categories: v.optional(v.array(v.string())),
        })),
    },
    handler: async (ctx, args) => {
        console.time("Total Execution");

        // 0. Rate Limiting
        const { parse, isValid } = await import("@telegram-apps/init-data-node/web");
        const token = process.env.TG_API_TOKEN;
        if (!token) throw new Error("TG_API_TOKEN not configured");

        if (!isValid(args.initData, token)) {
            throw new Error("Invalid initData");
        }

        const user = parse(args.initData).user;
        if (!user) throw new Error("User not found in initData");

        const result = await ctx.runMutation(internal.rateLimit.check, {
            key: user.id.toString(),
            limit: 5, // 5 requests
            windowMs: 60 * 1000, // per minute
        });

        if (!result.success) {
            throw new ConvexError({
                code: "RATE_LIMIT_EXCEEDED",
                message: "You are sending too many requests. Please try again later.",
                retryAfter: result.retryAfter
            });
        }

        // 1. Generate embedding for preferences
        console.time("Embedding Generation");
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
        });
        const embeddingResponse = await openai.embeddings.create({
            model: "google/gemini-embedding-001",
            input: args.preferences,
        });
        console.timeEnd("Embedding Generation");
        const embedding = embeddingResponse.data[0]?.embedding;
        if (!embedding) {
            throw new Error("Failed to generate embedding");
        }

        // 2. Hybrid Search (Vector + Keyword)
        const vectorSearchOptions: any = {
            vector: embedding,
            limit: 20,
        };

        // Apply vector search filter if possible (single value exact match)
        if (args.filters?.strength?.length === 1) {
            vectorSearchOptions.filter = (q: any) => q.eq("strength", args.filters!.strength![0]);
        } else if (args.filters?.deviceType?.length === 1) {
            vectorSearchOptions.filter = (q: any) => q.eq("deviceType", args.filters!.deviceType![0]);
        }

        console.time("Hybrid Search");
        const [vectorResults, keywordResults] = await Promise.all([
            // Vector Search
            ctx.vectorSearch("products", "by_embedding", vectorSearchOptions),
            // Keyword Search (if preferences is not empty)
            args.preferences.trim().length > 0
                ? ctx.runQuery(internal.products.searchProducts, { query: args.preferences })
                : Promise.resolve([]),
        ]);
        console.timeEnd("Hybrid Search");

        console.log(`Vector results: ${vectorResults.length}`);
        console.log(`Keyword results: ${keywordResults.length}`);

        // Fetch all unique products
        const uniqueIds = new Set<string>();
        const productsToFetch: Id<"products">[] = [];

        // Helper to add IDs
        const addIds = (ids: Id<"products">[]) => {
            for (const id of ids) {
                if (!uniqueIds.has(id)) {
                    uniqueIds.add(id);
                    productsToFetch.push(id);
                }
            }
        };

        addIds(vectorResults.map((r: any) => r._id));
        addIds(keywordResults.map((r: any) => r._id));

        console.time("Product Fetching");
        let products: Product[] = await ctx.runQuery(internal.products.getProductsByIds, {
            ids: productsToFetch,
        });
        console.timeEnd("Product Fetching");

        // 2.1 Post-Filter in Memory
        if (args.filters) {
            products = products.filter((p) => {
                if (
                    args.filters?.strength?.length &&
                    p.strength &&
                    !args.filters.strength.includes(p.strength)
                )
                    return false;
                if (
                    args.filters?.deviceType?.length &&
                    p.deviceType &&
                    !args.filters.deviceType.includes(p.deviceType)
                )
                    return false;
                if (args.filters?.categories?.length && p.categories) {
                    if (
                        !p.categories.some((cat) =>
                            args.filters!.categories!.includes(cat)
                        )
                    )
                        return false;
                }
                return true;
            });
        }

        // 2.2 Heuristic Re-ranking
        // Boost products that match attribute keywords in the query
        const queryLower = args.preferences.toLowerCase();

        // Check for negation first
        const isNotSweet = queryLower.includes("не сладк") || queryLower.includes("not sweet") || queryLower.includes("no sweet");
        const isNotCold = queryLower.includes("не холод") || queryLower.includes("not cold") || queryLower.includes("no ice");
        const isNotSour = queryLower.includes("не кисл") || queryLower.includes("not sour") || queryLower.includes("no sour");

        // Positive checks (only if not negated)
        const isStrong = queryLower.includes("крепк") || queryLower.includes("strong");
        // "Fresh" usually implies cold/ice
        const isCold = !isNotCold && (queryLower.includes("холод") || queryLower.includes("лед") || queryLower.includes("ice") || queryLower.includes("свеж") || queryLower.includes("fresh"));
        const isSweet = !isNotSweet && (queryLower.includes("сладк") || queryLower.includes("sweet"));
        const isSour = !isNotSour && (queryLower.includes("кисл") || queryLower.includes("sour"));

        if (isStrong || isCold || isSweet || isSour || isNotSweet || isNotCold || isNotSour) {
            products.sort((a, b) => {
                let scoreA = 0;
                let scoreB = 0;

                if (isStrong) {
                    if (a.strength === "High") scoreA += 2;
                    if (b.strength === "High") scoreB += 2;
                }

                // Coldness logic
                if (isCold) {
                    if ((a.coldness ?? 0) >= 3) scoreA += 3;
                    else if ((a.coldness ?? 0) >= 2) scoreA += 1;

                    if ((b.coldness ?? 0) >= 3) scoreB += 3;
                    else if ((b.coldness ?? 0) >= 2) scoreB += 1;
                } else if (isNotCold) {
                    if ((a.coldness ?? 0) <= 1) scoreA += 2;
                    if ((b.coldness ?? 0) <= 1) scoreB += 2;
                }

                // Sweetness logic
                if (isSweet) {
                    if ((a.sweetness ?? 0) >= 3) scoreA += 3;
                    else if ((a.sweetness ?? 0) >= 2) scoreA += 1;

                    if ((b.sweetness ?? 0) >= 3) scoreB += 3;
                    else if ((b.sweetness ?? 0) >= 2) scoreB += 1;
                } else if (isNotSweet) {
                    if ((a.sweetness ?? 0) <= 1) scoreA += 2; // Boost low sweetness
                    if ((b.sweetness ?? 0) <= 1) scoreB += 2;
                }

                // Sourness logic
                if (isSour) {
                    if (a.sourness) scoreA += 2;
                    if (b.sourness) scoreB += 2;
                } else if (isNotSour) {
                    if (!a.sourness) scoreA += 2;
                    if (!b.sourness) scoreB += 2;
                }

                // Sort by score descending
                return scoreB - scoreA;
            });
        }

        const sanitizedProducts = products.map((p) => {
            const { embedding, ...rest } = p;
            return rest;
        });

        if (sanitizedProducts.length > 0) {
            const firstProduct = sanitizedProducts[0];
            if (firstProduct) {
                console.log("Sanitized Product Keys:", Object.keys(firstProduct));
                if (firstProduct.images) {
                    console.log("Image URL length:", firstProduct.images[0]?.length);
                }
            }
        }

        console.timeEnd("Total Execution");
        return sanitizedProducts;
    },
});
export const similar = action({
    args: {
        productId: v.id("products"),
    },
    handler: async (ctx, args) => {
        // 1. Fetch the source product to get its embedding
        const product = await ctx.runQuery(internal.products.getProduct, {
            id: args.productId,
        });

        if (!product) {
            console.log(`Similar: Product not found for ID ${args.productId}`);
            return [];
        }
        if (!product.embedding) {
            console.log(`Similar: No embedding for product ${product.name} (${args.productId})`);
            return [];
        }

        // 2. Perform vector search
        const results = await ctx.vectorSearch("products", "by_embedding", {
            vector: product.embedding,
            limit: 4, // Fetch 4, we'll drop the first one (itself)
        });

        // 3. Filter out the source product and fetch details
        const similarIds: Id<"products">[] = results
            .filter((r: any) => r._id !== args.productId)
            .slice(0, 3) // Keep top 3
            .map((r: any) => r._id);

        if (similarIds.length === 0) return [];

        const similarProducts: Product[] = await ctx.runQuery(internal.products.getProductsByIds, {
            ids: similarIds,
        });

        return similarProducts;
    },
});

export const getProductsByIds = internalQuery({
    args: { ids: v.array(v.id("products")) },
    handler: async (ctx, args): Promise<Product[]> => {
        const products: Product[] = [];
        for (const id of args.ids) {
            const product = (await ctx.db.get(id)) as Product | null;
            if (product) products.push(product);
        }
        return products;
    },
});

export const checkReviews = query({
    args: {},
    handler: async (ctx) => {
        const reviews = await ctx.db.query("reviews").collect();
        console.log(`Total reviews in DB: ${reviews.length}`);
        return reviews.length;
    },
});
