# Deployment Guide

## Prerequisites
- Node.js / Bun
- Convex Account
- OpenAI / OpenRouter API Key

## Environment Variables
Ensure the following environment variables are set in your production environment (e.g., Vercel, Railway, or `.env.production`):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Public URL of your deployed website |
| `CONVEX_DEPLOYMENT` | Convex deployment name (e.g., `prod:my-project`) |
| `NEXT_PUBLIC_CONVEX_URL` | Convex public URL |
| `OPENAI_BASE_URL` | Base URL for AI model (e.g., `https://openrouter.ai/api/v1`) |
| `OPENAI_API_KEY` | API Key for AI model |

## Vercel Deployment

### 1. Create Vercel Project
1.  Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** > **Project**.
2.  Import your GitHub repository.

### 2. Configure Build Settings
The project includes a `vercel.json` file that automatically configures the build command.
-   **Build Command**: Should automatically be set to `bun run build:vercel`.
-   **Output Directory**: Leave as default (`.next`).
-   **Install Command**: Leave as default.

### 3. Environment Variables
Add the following environment variables in the Vercel Project Settings:

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `CONVEX_DEPLOY_KEY` | Production deploy key | **Convex Dashboard** > Settings > Deployment > Generate Production Deploy Key |
| `NEXT_PUBLIC_CONVEX_URL` | Production Convex URL | **Convex Dashboard** > Settings > URL & Deploy Key |
| `NEXT_PUBLIC_SITE_URL` | Vercel Deployment URL | Vercel (after first deploy) |
| `OPENAI_API_KEY` | OpenAI API Key | OpenAI Platform (Set this in **Convex Dashboard**, NOT Vercel) |
| `OPENAI_BASE_URL` | Optional: Custom Base URL | Set in **Convex Dashboard** if needed |

> [!IMPORTANT]
> **Convex Environment Variables**: Variables used by your backend functions (like `OPENAI_API_KEY`) must be set in the **Convex Dashboard**, not just in Vercel. Vercel env vars are for the frontend build and runtime.

### 4. Deploy
Click **Deploy**. Vercel will:
1.  Run `bun run build:vercel`.
2.  Deploy your Convex functions to production.
3.  Build your Next.js frontend.
4.  Publish the site.

## Verification
After deployment:
1. Open the deployed website.
2. Verify that products load (Convex connection).
3. Test the AI search (OpenAI connection).
