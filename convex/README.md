# Convex Backend Setup

This project has been successfully migrated from Prisma to Convex. Convex provides a reactive, real-time database with TypeScript functions.

## Schema

The database schema is defined in `convex/schema.ts`:

```typescript
// Posts table with name, createdAt, and updatedAt fields
posts: defineTable({
  name: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_name", ["name"]),
```

## Available Functions

### Queries (Read Operations)
- `getAllPosts()` - Get all posts ordered by creation date (descending)
- `getPost(id)` - Get a specific post by ID
- `getPostsByName(name)` - Get posts by name using the indexed field

### Mutations (Write Operations)
- `createPost(name)` - Create a new post
- `updatePost(id, name)` - Update an existing post
- `deletePost(id)` - Delete a post

## Usage Examples

### In React Components

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Query data
const posts = useQuery(api.posts.getAllPosts);

// Mutate data
const createPost = useMutation(api.posts.createPost);

// Use in handler
const handleCreate = async () => {
  await createPost({ name: "My New Post" });
};
```

### In Server Actions

```typescript
import { convex, api } from "~/server/db";

// Query data
const posts = await convex.query(api.posts.getAllPosts);

// Mutate data
const newPost = await convex.mutation(api.posts.createPost, { 
  name: "Server Post" 
});
```

## Development

- Run `pnpm convex:dev` to start the Convex development server
- Run `pnpm dev` to start the Next.js development server
- Visit the demo page at `/demo` to see the Convex integration in action

## Deployment

- Run `pnpm convex:deploy` to deploy to production
- The production URL will be automatically set in your environment variables

## Dashboard

View your Convex dashboard at: https://dashboard.convex.dev

---

# Original Convex Documentation

Write your Convex functions here.
See https://docs.convex.dev/functions for more.

A query function that takes two arguments looks like:

```ts
// convex/myFunctions.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myQueryFunction = query({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Read the database as many times as you need here.
    // See https://docs.convex.dev/database/reading-data.
    const documents = await ctx.db.query("tablename").collect();

    // Arguments passed from the client are properties of the args object.
    console.log(args.first, args.second);

    // Write arbitrary JavaScript here: filter, aggregate, build derived data,
    // remove non-public properties, or create new objects.
    return documents;
  },
});
```

Using this query function in a React component looks like:

```ts
const data = useQuery(api.myFunctions.myQueryFunction, {
  first: 10,
  second: "hello",
});
```

A mutation function looks like:

```ts
// convex/myFunctions.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const myMutationFunction = mutation({
  // Validators for arguments.
  args: {
    first: v.string(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Insert or modify documents in the database here.
    // Mutations can also read from the database like queries.
    // See https://docs.convex.dev/database/writing-data.
    const message = { body: args.first, author: args.second };
    const id = await ctx.db.insert("messages", message);

    // Optionally, return a value from your mutation.
    return await ctx.db.get(id);
  },
});
```

Using this mutation function in a React component looks like:

```ts
const mutation = useMutation(api.myFunctions.myMutationFunction);
function handleButtonPress() {
  // fire and forget, the most common way to use mutations
  mutation({ first: "Hello!", second: "me" });
  // OR
  // use the result once the mutation has completed
  mutation({ first: "Hello!", second: "me" }).then((result) =>
    console.log(result),
  );
}
```

Use the Convex CLI to push your functions to a deployment. See everything
the Convex CLI can do by running `npx convex -h` in your project root
directory. To learn more, launch the docs with `npx convex docs`.
