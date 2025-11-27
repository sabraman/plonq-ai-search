
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function testSearch() {
    const query = "самое сладкое";
    console.log(`Searching for: "${query}"...`);

    // Mock initData for testing
    const { sign } = await import("@telegram-apps/init-data-node");
    const token = process.env.TG_API_TOKEN!;
    const initData = sign({ user: { id: 12345, first_name: "Test" } }, token, new Date());

    const results = await client.action(api.products.search, {
        preferences: query,
        initData: initData
    });

    console.log(`Found ${results.length} products.`);
    results.slice(0, 5).forEach((p: any, i: number) => {
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   Flavor: ${p.flavor}`);
        console.log(`   Sweetness: ${p.sweetness} (${p.sweetnessLabel})`);
        console.log(`   Coldness: ${p.coldness} (${p.coldnessLabel})`);
        console.log("---");
    });
}

testSearch().catch(console.error);
