import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PROD_CONVEX_URL = process.env.PROD_CONVEX_URL || "https://elated-minnow-672.convex.cloud";

if (!PROD_CONVEX_URL) {
    console.error("Please provide PROD_CONVEX_URL");
    process.exit(1);
}

const client = new ConvexHttpClient(PROD_CONVEX_URL);

async function seed() {
    const productsPath = path.join(__dirname, "../products.json");
    if (!fs.existsSync(productsPath)) {
        console.error(`products.json not found at ${productsPath}`);
        process.exit(1);
    }

    const productsData = fs.readFileSync(productsPath, "utf-8");
    const products = JSON.parse(productsData);

    console.log(`Read ${products.length} products from products.json`);
    console.log(`Targeting Convex URL: ${PROD_CONVEX_URL}`);

    const CHUNK_SIZE = 10;
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
        const chunk = products.slice(i, i + CHUNK_SIZE);
        console.log(`Ingesting chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(products.length / CHUNK_SIZE)} (${chunk.length} products)...`);

        try {
            await client.action(api.ingest.ingest, { products: chunk });
            console.log(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1} ingested successfully.`);
        } catch (e) {
            console.error(`Failed to ingest chunk ${Math.floor(i / CHUNK_SIZE) + 1}:`, e);
            // Optional: break or continue? Let's continue but log error.
        }
    }

    console.log("Seeding complete.");
}

seed().catch(console.error);
