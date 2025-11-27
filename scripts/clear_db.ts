import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function clear() {
    console.log("Clearing all products...");
    await client.mutation(api.ingest.clearAllProducts, {});
    console.log("Database cleared.");
}

clear().catch(console.error);
