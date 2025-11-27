import type { FilterState } from "~/store/filter-store";

// Define Product interface here or import if centralized.
// For now, let's define a compatible interface based on schema.
export interface Product {
  _id: string;
  name: string;
  flavor: string;
  puffs: number;
  description: string;
  imageUrl: string;
  url: string;
  coldness?: number;
  sweetness?: number;
  sourness?: boolean;
  strength?: string;
  deviceType?: string;
  categories?: string[];
  category?: string; // Legacy support if needed, but we should migrate to deviceType
  features?: { name: string; value: string }[];
  reviews?: { author: string; date: string; rating: number; text: string }[];
}

export function filterProducts(
  products: Product[],
  filters: FilterState,
  favoriteIds?: string[], // Pass favorite IDs if showFavorites is true
): Product[] {
  let result = products;

  // Filter by Favorites
  if (filters.showFavorites && favoriteIds) {
    result = result.filter((product) => favoriteIds.includes(product._id));
  }

  // Filter by Device Type
  if (filters.deviceTypes.length > 0) {
    result = result.filter((product) => {
      // Map UI labels to schema values if necessary, or assume direct match
      // Schema: "Disposable", "POD System", "E-Liquid"
      // UI might use Russian labels? Let's check what we store.
      // If store has Russian labels, we need mapping.
      // Let's assume store stores the Schema values for simplicity,
      // and UI handles translation.
      return filters.deviceTypes.includes(product.deviceType || "");
    });
  }

  // Filter by Categories (Flavor Categories)
  if (filters.categories.length > 0) {
    result = result.filter((product) =>
      product.categories?.some((cat) => filters.categories.includes(cat)),
    );
  }

  // Filter by Strength
  if (filters.strength.length > 0) {
    result = result.filter((product) =>
      filters.strength.includes(product.strength || ""),
    );
  }

  // Filter by Puffs (Specific values)
  if (filters.puffs && filters.puffs.length > 0) {
    result = result.filter((product) =>
      filters.puffs.includes(product.puffs || 0),
    );
  }
  // Fallback to Range if no specific puffs selected (legacy support)
  else if (filters.puffsRange[0] > 0 || filters.puffsRange[1] < 20000) {
    result = result.filter((product) => {
      if (!product.puffs) return true; // Skip if no puffs (e.g. liquid)
      return (
        product.puffs >= filters.puffsRange[0] &&
        product.puffs <= filters.puffsRange[1]
      );
    });
  }

  // Filter by Coldness (0-2)
  if (filters.coldness.length > 0) {
    result = result.filter((product) => {
      return filters.coldness.includes(product.coldness ?? 0);
    });
  }

  // Filter by Sweetness (0-2)
  if (filters.sweetness.length > 0) {
    result = result.filter((product) => {
      return filters.sweetness.includes(product.sweetness ?? 0);
    });
  }

  // Filter by Sourness (boolean)
  // Store has sourness: boolean[]. [true] means show sour, [false] means show not sour.
  // Or maybe sourness: boolean | null?
  // Let's stick to array for consistency? Or just a tri-state?
  // Plonq UI: "All", "No Sourness", "Sour".
  // If "All" -> no filter.
  // If "No Sourness" -> sourness === false.
  // If "Sour" -> sourness === true.
  // In store, let's use `sourness: boolean | null` (null = all).
  // Or keep array logic: [] = all, [false] = no sour, [true] = sour.
  if (filters.sourness.length > 0) {
    result = result.filter((product) => {
      // If both true and false selected, show all (same as empty)
      if (filters.sourness.includes(true) && filters.sourness.includes(false))
        return true;
      return filters.sourness.includes(!!product.sourness);
    });
  }

  // Sorting
  if (filters.sortBy) {
    result = [...result].sort((a, b) => {
      if (filters.sortBy === "rating-desc" || filters.sortBy === "rating-asc") {
        // Bayesian Average (Weighted Rating)
        // WR = (v / (v + m)) * R + (m / (v + m)) * C
        // R = Average rating for the item
        // v = number of votes for the item
        // m = minimum votes required to be listed (weight) -> Let's use 5
        // C = the mean vote across the whole report -> Let's assume 4.5

        const m = 5;
        const C = 4.5;

        const getWeightedRating = (p: Product) => {
          if (!p.reviews || p.reviews.length === 0) return 0;
          const v = p.reviews.length;
          const R = p.reviews.reduce((acc, r) => acc + r.rating, 0) / v;

          return (v / (v + m)) * R + (m / (v + m)) * C;
        };

        const ratingA = getWeightedRating(a);
        const ratingB = getWeightedRating(b);

        return filters.sortBy === "rating-desc"
          ? ratingB - ratingA
          : ratingA - ratingB;
      }
      return 0;
    });
  }

  return result;
}
