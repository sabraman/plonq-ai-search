
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";
import { sign } from "@telegram-apps/init-data-node";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const token = process.env.TG_API_TOKEN;

if (!token) {
    console.error("TG_API_TOKEN is missing in .env.local");
    process.exit(1);
}

async function validateRateLimit() {
    console.log("--- Starting Rate Limit Validation ---");

    // 1. Generate valid initData
    const userId = 123456789;
    const initData = sign(
        {
            user: {
                id: userId,
                first_name: "Test",
                last_name: "User",
                username: "testuser",
                language_code: "en",
            },
        },
        token!,
        new Date() // auth_date
    );

    console.log("Generated initData for user:", userId);

    // 2. Make requests
    const limit = 5;
    console.log(`Attempting ${limit + 2} requests (Limit is ${limit})...`);

    for (let i = 1; i <= limit + 2; i++) {
        try {
            console.log(`Request ${i}...`);
            await client.action(api.products.search, {
                preferences: "mint",
                initData: initData,
            });
            console.log(`Request ${i}: Success`);
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
