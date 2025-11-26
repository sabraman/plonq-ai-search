import { Bot } from "grammy";
import { env } from "./env";

// Make sure the token is available
if (!env.TG_API_TOKEN) {
  throw new Error("TG_API_TOKEN environment variable not found.");
}

// Create a bot instance
export const bot = new Bot(env.TG_API_TOKEN);

// Define your bot's logic here
bot.command("start", async (ctx) => {
  await ctx.reply("Welcome to your Telegram mini app bot!");
});

bot.on("message:text", async (ctx) => {
  await ctx.reply(`You said: ${ctx.message.text}`);
});

// Add more command handlers and logic as needed
