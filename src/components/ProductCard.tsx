import { Heart, Star } from "lucide-react";
import Image from "next/image";
import type { Product } from "~/lib/filter-utils";
import { useHaptics } from "~/lib/telegram";
import { useFavoritesStore } from "~/store/favorites-store";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { impact } = useHaptics();

  // Helper to render taste dots
  const renderDots = (count: number, colorClass: string, max: number = 3) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: Static array for visual dots
            key={i}
            className={`h-2 w-2 rounded-full ${
              i < count ? colorClass : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  const LikeButton = () => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        impact("medium");
        if (product._id) {
          toggleFavorite(product._id);
        }
      }}
      className="flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors h-8 w-8"
    >
      <Heart
        className={`transition-colors h-5 w-5 ${
          product._id && isFavorite(product._id)
            ? "fill-red-500 text-red-500"
            : "text-gray-400"
        }`}
      />
    </button>
  );

  const Rating = () => (
    <div className="flex items-center gap-0.5 font-medium text-gray-400 text-xs">
      <span>
        {product.reviews && product.reviews.length > 0
          ? (
              product.reviews.reduce((acc, r) => acc + r.rating, 0) /
              product.reviews.length
            ).toFixed(1)
          : "0.0"}
      </span>
      {product.reviews && product.reviews.length > 0 && (
        <span className="text-xs text-gray-300">
          ({product.reviews.length})
        </span>
      )}
      <Star className="fill-yellow-400 text-yellow-400 h-3 w-3" />
    </div>
  );

  return (
    // biome-ignore lint/a11y/useSemanticElements: Nested interactive elements require div
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.();
        }
      }}
      className="flex flex-col justify-between rounded-[20px] sm:rounded-[32px] bg-[#F6F5F8] p-3 sm:p-5 shadow-sm transition-shadow hover:shadow-md h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 text-left w-full"
    >
      {/* Header */}
      <div className="mb-2 sm:mb-4 flex justify-between items-start">
        <div>
          <div className="text-sm sm:text-lg font-medium text-gray-500">
            {product.name.split(" ")[0]}
          </div>
          <div className="text-xs sm:text-sm text-gray-400">
            {(product.puffs ?? 0) > 0
              ? `${(product.puffs ?? 0).toLocaleString()} затяжек`
              : "Жидкость"}
          </div>
        </div>

        {/* Like & Rating Top Right */}
        <div className="flex flex-col items-end gap-1">
          <LikeButton />
          <Rating />
        </div>
      </div>

      {/* Image */}
      <div className="relative mb-2 sm:mb-6 flex aspect-[3/4] w-full items-center justify-center">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
      </div>

      {/* Content */}
      <div className="mb-3 sm:mb-6 flex-grow">
        <h3 className="mb-2 sm:mb-3 text-sm sm:text-xl font-bold text-gray-900 leading-tight">
          {product.flavor}
        </h3>

        {/* Taste Indicators */}
        <div className="mb-2 sm:mb-4 flex gap-1.5 sm:gap-3">
          {renderDots(product.coldness || 1, "bg-cyan-400")}
          {renderDots(product.sweetness || 1, "bg-rose-400")}
          {/* Sourness */}
          {product.sourness && (
            <div className="h-2 w-8 rounded-full bg-[#ccff00]" />
          )}
        </div>

        <p className="text-xs leading-relaxed text-gray-500 line-clamp-3">
          {product.description}
        </p>
      </div>
    </div>
  );
}
