import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function seed() {
    const productsPath = path.join(process.cwd(), "products.json");
    const productsData = await fs.readFile(productsPath, "utf-8");
    const products = JSON.parse(productsData);

    console.log(`Read ${products.length} products from ${productsPath}`);

    console.log("Clearing existing product embeddings...");
    while (true) {
        const deleted = await client.mutation(api.ingest.clearProductEmbeddings, { limit: 100 });
        if (deleted === 0) break;
        console.log(`Deleted ${deleted} embeddings...`);
    }

    // Clear existing products
    console.log("Clearing existing products...");
    while (true) {
        const deleted = await client.mutation(api.ingest.clearAllProducts, { limit: 100 });
        if (deleted === 0) break;
        console.log(`Deleted ${deleted} products...`);
    }

    // Chunking to avoid payload limits
    const CHUNK_SIZE = 10;
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
        const chunk = products.slice(i, i + CHUNK_SIZE);
        console.log(`Seeding chunk ${i / CHUNK_SIZE + 1} of ${Math.ceil(products.length / CHUNK_SIZE)}...`);
        await client.action(api.ingest.ingest, { products: chunk });
    }

    console.log("Seeding complete!");
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    if (err.data) console.error("Error data:", JSON.stringify(err.data, null, 2));
    process.exit(1);
});
