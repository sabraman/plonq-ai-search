import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),
}); 