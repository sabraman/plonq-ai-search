import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // posts table removed
  products: defineTable({
    name: v.string(),
    flavor: v.string(),
    puffs: v.optional(v.number()),
    description: v.optional(v.string()),
    imageUrl: v.string(),
    images: v.optional(v.array(v.string())),
    url: v.string(),
    coldness: v.optional(v.number()), // 0-2
    sweetness: v.optional(v.number()), // 0-2
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
    searchText: v.optional(v.string()),
  }).searchIndex("search_body", {
    searchField: "searchText",
  }).index("by_name", ["name"]),

  productEmbeddings: defineTable({
    productId: v.id("products"),
    embedding: v.array(v.float64()),
    strength: v.optional(v.string()),
    deviceType: v.optional(v.string()),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
    filterFields: ["strength", "deviceType"],
  }).index("by_productId", ["productId"]),

  // reviews table removed
  rateLimits: defineTable({
    key: v.string(),
    count: v.number(),
    resetTime: v.number(),
  }).index("by_key", ["key"]),
  searchLogs: defineTable({
    query: v.string(),
    userId: v.optional(v.string()),
    timestamp: v.number(),
    resultsCount: v.number(),
    type: v.string(), // "vector" | "keyword" | "hybrid"
  }).index("by_timestamp", ["timestamp"]),
}); 
