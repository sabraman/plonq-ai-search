import { bot } from "~/lib/bot/bot";
import { env } from "~/env";

/**
 * Script to set up the webhook URL for your bot
 *
 * Usage:
 * - Make sure NEXT_PUBLIC_SITE_URL is properly set in your environment variables
 * - Run `pnpm bot:set-webhook`
 */

// Use the public site URL from environment variables
const webhookUrl = `${env.NEXT_PUBLIC_SITE_URL}/api/bot`;

async function main() {
  try {
    // Get current webhook info
    const webhookInfo = await bot.api.getWebhookInfo();
    console.log("Current webhook info:", webhookInfo);

    // Set the webhook
    await bot.api.setWebhook(webhookUrl, {
      drop_pending_updates: true,
    });

    console.log(`Webhook set to: ${webhookUrl}`);

    // Verify that webhook is set
    const newWebhookInfo = await bot.api.getWebhookInfo();
    console.log("New webhook info:", newWebhookInfo);

    if (newWebhookInfo.url === webhookUrl) {
      console.log("✅ Webhook successfully set!");
    } else {
      console.error("❌ Webhook setting failed!");
    }
  } catch (error) {
    console.error("Error setting webhook:", error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
