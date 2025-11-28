import type { Product } from "~/lib/filter-utils";
import { ProductCard } from "./ProductCard";

import { BlurFade } from "./ui/blur-fade";

interface ProductListProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
  loading?: boolean;
}

export function ProductList({
  products,
  onProductClick,
  loading,
}: ProductListProps) {
  // Remove skeletons to prevent layout shift.
  // We rely on infinite scroll spinner or parent loading state if initial load.
  // But for infinite scroll, we just append items.
  // If it's initial load, we might want a spinner instead of skeletons if skeletons cause shift.
  // User said "shows fucking skeleton and shift ui".
  // So let's just return null or a simple spinner if loading AND no products?
  // But ProductList is used for both initial and appended.
  // If loading is true, it means we are fetching.
  // If we have products, we should show them.
  // If we don't have products and loading is true, show spinner.

  if (loading && products.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <BlurFade
          key={product._id}
          delay={0.05 + index * 0.05}
          inView
        >
          <ProductCard
            product={product}
            onClick={() => onProductClick?.(product)}
            priority={index < 4}
          />
        </BlurFade>
      ))}
    </div>
  );
}
