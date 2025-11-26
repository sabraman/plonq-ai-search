import { webhookCallback } from "grammy";
import { bot } from "~/lib/bot/bot";

// Ensure the route is dynamic
export const dynamic = "force-dynamic";
// Disable caching
export const fetchCache = "force-no-store";

// Export the webhook handler
export const POST = webhookCallback(bot, "std/http");
