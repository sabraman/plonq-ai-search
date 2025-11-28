import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { Catalog } from "~/components/Catalog";

export default async function HomePage() {
  const initialProducts = await fetchQuery(
    api.products.getPaginatedProducts,
    {
      paginationOpts: {
        numItems: 50,
        cursor: null,
        id: 1,
      },
      filters: {
        strength: [],
        deviceType: [],
        categories: [],
        puffsRange: [],
        coldness: [],
        sweetness: [],
        sourness: [],
        showFavorites: false,
        sortBy: "default"
      }
    }
  );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <Catalog initialProducts={initialProducts.page as any} />
    </main>
  );
}
