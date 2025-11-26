import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query to get all posts
export const getAllPosts = query({
  handler: async (ctx) => {
    return await ctx.db.query("posts").order("desc").collect();
  },
});

// Query to get a single post by ID
export const getPost = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query to get posts by name
export const getPostsByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .collect();
  },
});

// Mutation to create a new post
export const createPost = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("posts", {
      name: args.name,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Mutation to update a post
export const updatePost = mutation({
  args: { 
    id: v.id("posts"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: now,
    });
  },
});

// Mutation to delete a post
export const deletePost = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
}); 