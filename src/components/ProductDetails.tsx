import { useAction } from "convex/react";
import { Star, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import type { Product } from "~/lib/filter-utils";
import { useFavoritesStore } from "~/store/favorites-store";
import { api } from "../../convex/_generated/api";
import { ProductCard } from "./ProductCard";

interface ProductDetailsProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetails({
  product,
  isOpen,
  onClose,
}: ProductDetailsProps) {
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const getSimilar = useAction(api.products.similar);

  useEffect(() => {
    if (isOpen && product && product._id) {
      setIsLoading(true);
      // biome-ignore lint/suspicious/noExplicitAny: Safe ID cast
      getSimilar({ productId: product._id as any })
        .then((res) => setSimilarProducts(res as Product[]))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setSimilarProducts([]);
    }
  }, [isOpen, product, getSimilar]);

  const { isFavorite, toggleFavorite } = useFavoritesStore();

  if (!product) return null;

  // Calculate rating
  const avgRating =
    product.reviews && product.reviews.length > 0
      ? (
        product.reviews.reduce((acc, r) => acc + r.rating, 0) /
        product.reviews.length
      ).toFixed(1)
      : "0.0";

  // Helper to render taste dots (reused from ProductCard, could be shared)
  const renderDots = (count: number, colorClass: string, max: number = 3) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: Static array for visual dots
            key={i}
            className={`h-2 w-2 rounded-full ${i < count ? colorClass : "bg-gray-200"
              }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[90vh] rounded-t-[32px]">
        <div className="mx-auto w-full max-w-md flex flex-col h-full">
          <DrawerHeader className="flex items-center justify-between border-b px-6 py-4">
            <DrawerTitle className="text-xl font-bold">
              {product.name}
            </DrawerTitle>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="-mr-2 text-gray-400"
              >
                <X className="h-6 w-6" />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Image Carousel (Placeholder for now, just main image) */}
            <div className="relative mb-8 flex aspect-square w-full items-center justify-center rounded-3xl bg-[#F6F5F8]">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain p-8"
              />
            </div>

            {/* Title & Rating */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
                  {product.flavor}
                </h2>
                <p className="text-gray-500">
                  {(product.puffs ?? 0) > 0
                    ? `${(product.puffs ?? 0).toLocaleString()} затяжек`
                    : "Жидкость"}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-yellow-600">
                <span className="font-bold">{avgRating}</span>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
            </div>

            {/* Taste Indicators */}
            <div className="mb-8 grid grid-cols-3 gap-4 rounded-2xl bg-gray-50 p-4">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Холод</span>
                {renderDots(product.coldness ?? 0, "bg-cyan-400")}
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-gray-500">
                  Сладость
                </span>
                {renderDots(product.sweetness ?? 0, "bg-rose-400")}
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-gray-500">
                  Кислость
                </span>
                <div
                  className={`h-2 w-8 rounded-full ${product.sourness ? "bg-[#ccff00]" : "bg-gray-200"}`}
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="mb-3 text-lg font-bold text-gray-900">Описание</h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Specs */}
            {product.features && product.features.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-3 text-lg font-bold text-gray-900">
                  Характеристики
                </h3>
                <div className="space-y-3">
                  {product.features.map((feature) => (
                    <div
                      key={feature.name}
                      className="flex justify-between border-b border-gray-100 pb-2 last:border-0"
                    >
                      <span className="text-gray-500">{feature.name}</span>
                      <span className="font-medium text-gray-900">
                        {feature.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {product.reviews && product.reviews.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-3 text-lg font-bold text-gray-900">
                  Отзывы ({product.reviews.length})
                </h3>
                <div className="space-y-4">
                  {product.reviews.map((review, i) => (
                    <div
                      key={`${review.author}-${i}`}
                      className="rounded-2xl bg-gray-50 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {review.author}
                        </span>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <span className="text-sm font-bold">
                            {review.rating}
                          </span>
                          <Star className="h-3 w-3 fill-current" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {review.text}
                      </p>
                      <div className="mt-2 text-xs text-gray-400">
                        {review.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Products */}
            <div className="mb-8">
              <h3 className="mb-3 text-lg font-bold text-gray-900">
                Похожие вкусы
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {similarProducts.map((p, i) => (
                  <ProductCard key={`${p.name}-${i}`} product={p} />
                ))}
                {isLoading && similarProducts.length === 0 && (
                  <div className="col-span-2 text-center text-gray-400 text-sm py-4">
                    Загрузка похожих товаров...
                  </div>
                )}
                {!isLoading && similarProducts.length === 0 && (
                  <div className="col-span-2 text-center text-gray-400 text-sm py-4">
                    Нет похожих товаров
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t bg-white px-6 py-4">
            <Button
              onClick={() => product._id && toggleFavorite(product._id)}
              className={`w-full h-14 rounded-full text-lg font-medium transition-colors ${product._id && isFavorite(product._id)
                ? "bg-red-50 text-red-500 hover:bg-red-100"
                : "bg-black text-white hover:bg-gray-800"
                }`}
            >
              {product._id && isFavorite(product._id)
                ? "Убрать из избранного"
                : "Добавить в избранное"}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
