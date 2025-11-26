import { bot } from "~/lib/bot/bot";

console.log("Starting bot in polling mode...");

// Start the bot with polling
bot
  .start({
    onStart: ({ username }) => {
      console.log(`Bot @${username} is running in polling mode!`);
      console.log("Press Ctrl+C to stop the bot");
    },
  })
  .catch((err) => {
    console.error("Error starting bot:", err);
    process.exit(1);
  });

// Handle shutdown gracefully
process.once("SIGINT", () => {
  console.log("Bot is shutting down...");
  bot.stop();
});

process.once("SIGTERM", () => {
  console.log("Bot is shutting down...");
  bot.stop();
});
