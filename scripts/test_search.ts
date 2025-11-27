import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function testSearch() {
    const queries = [
        { text: "Strong mint", desc: "Should return high strength mint products" },
        { text: "Disposable fruit", desc: "Should return disposable fruit products" },
        { text: "Plonq Alpha Mango", desc: "Should return exact match first" },
    ];

    for (const q of queries) {
        console.log(`\n--- Testing: "${q.text}" (${q.desc}) ---`);
        try {
            const products = await client.action(api.products.search, { preferences: q.text });
            console.log(`Found ${products.length} products`);
            console.log("Top 3 Products:");
            products.slice(0, 3).forEach((p: any, i: number) => {
                console.log(`${i + 1}. ${p.name} | Strength: ${p.strength} | Cats: ${p.categories?.join(", ")}`);
            });
        } catch (e) {
            console.error("Error:", e);
        }
    }
}

testSearch().catch(console.error);
