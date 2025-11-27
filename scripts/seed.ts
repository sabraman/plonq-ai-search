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

    // Clear existing products
    console.log("Clearing existing products...");
    await client.mutation(api.ingest.clearAllProducts, {});

    // Chunking to avoid payload limits
    const CHUNK_SIZE = 10;
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
        const chunk = products.slice(i, i + CHUNK_SIZE);
        console.log(`Seeding chunk ${i / CHUNK_SIZE + 1} of ${Math.ceil(products.length / CHUNK_SIZE)}...`);
        await client.action(api.ingest.ingest, { products: chunk });
    }

    console.log("Seeding complete!");
}

seed().catch(console.error);
