# Plonq AI Search

Next.js app for browsing and searching the Plonq product catalog with Convex-backed filters and AI recommendations.

## Stack

- [Next.js](https://nextjs.org) - App Router, Server Components
- [React 19](https://react.dev)
- [Bun](https://bun.sh) - Package manager and runtime
- [Convex](https://convex.dev) - Backend-as-a-Service
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Biome](https://biomejs.dev) - Formatter and linter
- [Shadcn UI](https://ui.shadcn.com/)
- [Zod](https://zod.dev/) - TypeScript-first schema validation

## Features

- AI-powered semantic product search
- Product catalog, filters, favorites, and product details
- Convex backend functions and data storage
- Mobile-first UI with Shadcn components
- Fast installs and scripts with Bun

## Local Development

1. Install dependencies:

   ```bash
   bun install
   ```
2. Configure `.env.local`:

   ```bash
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
   ```

3. Configure Convex environment variables for AI search:

   ```bash
   OPENAI_API_KEY=<your-api-key>
   OPENAI_BASE_URL=<optional-compatible-base-url>
   ```

4. Run the development server:

   ```bash
   bun dev
   ```
