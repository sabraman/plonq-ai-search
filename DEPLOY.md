# Deployment Guide

## Prerequisites
- Node.js / Bun
- Convex Account
- Telegram Bot Token
- OpenAI / OpenRouter API Key

## Environment Variables
Ensure the following environment variables are set in your production environment (e.g., Vercel, Railway, or `.env.production`):

| Variable | Description |
|----------|-------------|
| `TG_API_TOKEN` | Telegram Bot Token from @BotFather |
| `NEXT_PUBLIC_TG_APP_URL` | URL to your Telegram Mini App (e.g., `https://t.me/mybot/app`) |
| `NEXT_PUBLIC_SITE_URL` | Public URL of your deployed website |
| `CONVEX_DEPLOYMENT` | Convex deployment name (e.g., `prod:my-project`) |
| `NEXT_PUBLIC_CONVEX_URL` | Convex public URL |
| `OPENAI_BASE_URL` | Base URL for AI model (e.g., `https://openrouter.ai/api/v1`) |
| `OPENAI_API_KEY` | API Key for AI model |

## Build & Deploy

### 1. Convex Deployment
Deploy your Convex functions and schema:
```bash
bun convex deploy
```
This will push your backend code to the production Convex deployment.

### 2. Frontend Build
Build the Next.js application:
```bash
bun run build
```
This command compiles the application for production.

### 3. Start
Start the production server:
```bash
bun run start
```

## Verification
After deployment:
1. Open the Mini App in Telegram.
2. Verify that products load (Convex connection).
3. Test the AI search (OpenAI connection).
