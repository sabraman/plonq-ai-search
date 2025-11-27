
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function syncProducts() {
    console.log("Fetching products from Convex...");
    const products = await client.query(api.products.list);

    console.log(`Fetched ${products.length} products.`);

    const filePath = path.join(process.cwd(), "products.json");

    // Sanitize: Remove embedding to save space (crucial for initial load size)
    const sanitizedProducts = products.map(({ embedding, ...rest }: any) => rest);

    fs.writeFileSync(filePath, JSON.stringify(sanitizedProducts, null, 2));
    console.log(`Updated ${filePath}`);
}

syncProducts().catch(console.error);
