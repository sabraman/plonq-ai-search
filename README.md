# Telegram Mini App Starter

This project is a starter for building Telegram Mini Apps using Next.js with integration Telegram bot using GrammyJS.

## Demo

[https://t.me/mini_app_starter_bot/app](https://t.me/mini_app_starter_bot/app)

## Stack

- [Next.js 16](https://nextjs.org) - App Router, Server Components
- [React 19](https://react.dev)
- [Bun](https://bun.sh) - Package manager and runtime
- [Convex](https://convex.dev) - Backend-as-a-Service
- [Tailwind CSS v4](https://tailwindcss.com) - Utility-first CSS framework
- [Biome](https://biomejs.dev) - Formatter and linter
- [Telegram Mini App SDK](https://docs.telegram-mini-apps.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [GrammyJS](https://grammy.dev/) - Modern Telegram bot framework for Node.js
- [Zod](https://zod.dev/) - TypeScript-first schema validation

## Features

- 🤖 Telegram Bot integration using GrammyJS
- 📱 Mobile-first UI with Shadcn components
- 🚀 Latest Next.js 16 features
- ⚡ Fast builds and installs with Bun
- 🎨 Modern styling with Tailwind v4

## Local Development

1. Install dependencies:

   ```bash
   bun install
   ```
2. Create a bot in Telegram (via **@BotFather** and using the command `/newbot`).

3. Set the `TG_API_TOKEN` in `.env` to the API token of your bot.

4. Configure a publicly accessible URL to your local machine using *ngrok* or *cloudflare tunnel*. If your public URL is http instead of https, refer to the [docs](https://core.telegram.org/bots/webapps#using-bots-in-the-test-environment) to turn on test environment.

5. Configure the bot using **@BotFather** and the command `/newapp`. Use the public URL you configured in the previous step as the "App link". This step will let you choose an App name, it can be used with the bot url to directly open the app. e.g. `https://t.me/{bot_name}/{app_name}`.

6. Configure the bot's menu button to point to the mini app's URL.

7. Run the development server:

   ```bash
   bun dev
   ```

8. Open the mini app via either the Mini App's URL or the clicking on the menu button in the bot.

## Telegram Bot Development

This starter uses [GrammyJS](https://grammy.dev/) for Telegram bot integration. The bot code is located in the `/bot` directory.

### Key Bot Features

- Webhook and long polling support
- Commands handling and menu button configuration
- Mini App data validation and secure authentication
- Integration with the Next.js backend via API routes

### Bot Configuration

1. Update your bot commands and settings using the BotFather
2. Set up webhooks or use long polling (configurable in the bot code)
3. Configure allowed updates and command handling
4. Implement custom middleware for your bot's specific needs

See the GrammyJS [documentation](https://grammy.dev/guide/) for more detailed information about bot development.
