import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),
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
    embedding: v.array(v.float64()),
    searchText: v.optional(v.string()),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 3072,
    filterFields: ["strength", "deviceType"],
  }).searchIndex("search_body", {
    searchField: "searchText",
  }).index("by_name", ["name"]),
  reviews: defineTable({
    productId: v.id("products"),
    author: v.string(),
    rating: v.number(),
    text: v.string(),
    date: v.string(),
  }).index("by_product", ["productId"]),
  rateLimits: defineTable({
    key: v.string(),
    count: v.number(),
    resetTime: v.number(),
  }).index("by_key", ["key"]),
}); 