import type { Product } from "~/lib/filter-utils";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
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
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <BlurFade
            // biome-ignore lint/suspicious/noArrayIndexKey: Skeletons are static
            key={`skeleton-${index}`}
            delay={0.05 + index * 0.05}
            inView
          >
            <ProductCardSkeleton />
          </BlurFade>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <BlurFade
          key={`${product.name}-${index}`}
          delay={0.05 + index * 0.05}
          inView
        >
          <ProductCard
            product={product}
            onClick={() => onProductClick?.(product)}
          />
        </BlurFade>
      ))}
    </div>
  );
}
