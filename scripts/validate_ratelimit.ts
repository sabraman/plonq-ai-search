
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function validateRateLimit() {
    console.log("--- Starting Rate Limit Validation ---");

    const limit = 30;
    console.log(`Attempting ${limit + 2} requests (Limit is ${limit})...`);

    for (let i = 1; i <= limit + 2; i++) {
        try {
            console.log(`Request ${i}...`);
            await client.action(api.products.search, {
                preferences: "mint",
            });
            console.log(`Request ${i}: Success`);
        } catch (e: any) {
            const errorMessage = e.message || JSON.stringify(e);
            if (errorMessage.includes("RATE_LIMIT_EXCEEDED") || errorMessage.includes("RateLimitExceeded")) {
                console.log(`Request ${i}: BLOCKED (Expected) - ${errorMessage}`);
            } else {
                console.log(`Request ${i}: FAILED (Unexpected) - ${errorMessage}`);
            }
        }
    }
}

validateRateLimit().catch(console.error);
