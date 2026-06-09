import { fetchQuery } from "convex/nextjs";
import { Catalog } from "~/components/Catalog";
import type { Product } from "~/lib/filter-utils";
import { api } from "../../convex/_generated/api";

export default async function HomePage() {
  const initialProducts = await fetchQuery(api.products.getPaginatedProducts, {
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
      sortBy: "default",
    },
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg bg-gray-50 px-4 py-8 pb-24">
      <Catalog initialProducts={initialProducts.page as Product[]} />
    </main>
  );
}
