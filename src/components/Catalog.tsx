"use client";

import { useAction, usePaginatedQuery, useQuery } from "convex/react";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterProducts, type Product } from "~/lib/filter-utils";
import { useFavoritesStore } from "~/store/favorites-store";
import { useFilterStore } from "~/store/filter-store";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CatalogHeader } from "./CatalogHeader";
import { FilterSheet } from "./FilterSheet";
import { ProductDetails } from "./ProductDetails";
import { ProductList } from "./ProductList";
import { BlurFade } from "./ui/blur-fade";
import { Button } from "./ui/button";

interface CatalogProps {
  initialProducts: Product[];
}

export function Catalog({ initialProducts }: CatalogProps) {
  const { favorites } = useFavoritesStore();
  const filters = useFilterStore();
  const { resetFilters } = filters;

  // Transform filters for backend
  const backendFilters = useMemo(
    () => ({
      strength: filters.strength,
      deviceType: filters.deviceTypes, // Note: Store uses deviceTypes, backend expects deviceType
      categories: filters.categories,
      puffsRange: filters.puffsRange,
      coldness: filters.coldness,
      sweetness: filters.sweetness,
      sourness: filters.sourness,
      showFavorites: filters.showFavorites,
      sortBy: filters.sortBy,
    }),
    [filters],
  );

  const {
    results: paginatedProducts,
    status,
    loadMore,
    isLoading,
  } = usePaginatedQuery(
    api.products.getPaginatedProducts,
    {
      filters: backendFilters,
      favoriteIds: filters.showFavorites
        ? (favorites as unknown as Id<"products">[])
        : undefined,
    },
    { initialNumItems: 50 },
  );

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastAiQuery, setLastAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [recommendationText, setRecommendationText] = useState<string | null>(
    null,
  );

  // Sync paginated results to local state (when not searching)
  useEffect(() => {
    if (paginatedProducts && !searchQuery) {
      // Cast to Product[] because paginated query returns generic objects
      setProducts(paginatedProducts as unknown as Product[]);
    }
  }, [paginatedProducts, searchQuery]);

  // Infinite Scroll Observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            console.log(`[InfiniteScroll] Intersecting. Status: ${status}`);
            if (status === "CanLoadMore") {
              console.log("[InfiniteScroll] Loading more...");
              const start = performance.now();
              loadMore(50);
              console.log(
                `[InfiniteScroll] LoadMore called in ${performance.now() - start}ms`,
              );
            }
          }
        },
        { rootMargin: "1000px" },
      );

      if (node) observerRef.current.observe(node);
    },
    [isLoading, status, loadMore],
  );

  useEffect(() => {
    console.log(
      `[Catalog] Status: ${status}, IsLoading: ${isLoading}, Products: ${paginatedProducts?.length}`,
    );
  }, [status, isLoading, paginatedProducts]);

  const search = useAction(api.products.search);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(
    async (force = false) => {
      if (!searchQuery?.trim()) return;
      if (!force && searchQuery === lastAiQuery) return;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setAiLoading(true);
      setRecommendationText("");

      try {
        const products = await search({
          preferences: searchQuery,
        });

        if (products) {
          const nextProducts = products as unknown as Product[];
          setProducts(nextProducts);
          setLastAiQuery(searchQuery);

          if (nextProducts.length === 0) {
            return;
          }
        }

        // Stream recommendation logic...
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
        const siteUrl = convexUrl.replace(".cloud", ".site");

        const response = await fetch(`${siteUrl}/stream-recommendation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferences: searchQuery,
            products: products.slice(0, 5),
          }),
          signal: controller.signal,
        });

        if (!response.body) return;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (abortControllerRef.current !== controller) break;
          setRecommendationText((prev) => (prev || "") + decoder.decode(value));
        }
      } catch {
        // ...
      } finally {
        if (abortControllerRef.current === controller) {
          setAiLoading(false);
          abortControllerRef.current = null;
        }
      }
    },
    [searchQuery, lastAiQuery, search],
  );

  // Debounce AI Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() && searchQuery !== lastAiQuery) {
        handleSearch();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, lastAiQuery, handleSearch]);

  const handleSearchChange = (value: string) => setSearchQuery(value);

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    await handleSearch(true);
  };

  // Filter logic for AI search results (local filtering)
  const filteredProducts = useMemo(() => {
    // If searching, we use the AI results stored in `products`
    if (searchQuery.trim()) {
      // We trust the backend AI search results.
      // If we filter by exact text match here, we lose the benefit of semantic search.

      // Apply client-side filters on top of AI results if needed?
      // Yes, let's keep using filterProducts for consistency if user refines AI results with chips.
      return filterProducts(products, filters, favorites);
    }

    // If NOT searching, `products` is updated from `paginatedProducts`.
    // And `paginatedProducts` is ALREADY filtered by backend.
    // So we just return `products` (which is `paginatedProducts`).
    return products;
  }, [products, searchQuery, filters, favorites]);

  // AI Re-ranking (Frontend Sync)
  const finalProducts = useMemo(() => {
    let result = filteredProducts;
    if (recommendationText) {
      const matches = recommendationText.match(/\*\*(.*?)\*\*/g);
      if (matches) {
        const promotedNames = matches.map((s) =>
          s.slice(2, -2).trim().toLowerCase(),
        );
        result = [...result].sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const aPromoted = promotedNames.some((n) => aName.includes(n));
          const bPromoted = promotedNames.some((n) => bName.includes(n));
          if (aPromoted && !bPromoted) return -1;
          if (!aPromoted && bPromoted) return 1;
          return 0;
        });
      }
    }
    return result;
  }, [filteredProducts, recommendationText]);

  const recommendationParts = useMemo(() => {
    if (!recommendationText) return [];

    let offset = 0;
    return recommendationText.split(/(\*\*.*?\*\*)/).map((part) => {
      const key = `${offset}-${part}`;
      offset += part.length;
      return { key, part };
    });
  }, [recommendationText]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const loading = isLoading || aiLoading;

  const totalFilteredCount = useQuery(api.products.getProductsCount, {
    filters: backendFilters,
    favoriteIds: filters.showFavorites
      ? (favorites as unknown as Id<"products">[])
      : undefined,
  });

  return (
    <div className="w-full">
      <CatalogHeader
        totalCount={initialProducts.length}
        filteredCount={
          searchQuery ? finalProducts.length : (totalFilteredCount ?? 0)
        }
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        loading={loading}
        onClear={() => {
          setSearchQuery("");
          setLastAiQuery("");
          resetFilters();
          setRecommendationText(null);
        }}
        filterComponent={
          <FilterSheet
            products={products}
            filteredCount={
              searchQuery ? finalProducts.length : (totalFilteredCount ?? 0)
            }
          />
        }
      />

      {recommendationText && (
        <BlurFade delay={0.02}>
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 p-6 border border-purple-100">
            <div className="flex gap-3">
              <div className="mt-1 shrink-0">
                <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-purple-900">
                  AI Рекомендация
                </h3>
                <p className="text-sm leading-relaxed text-purple-800/80">
                  {recommendationParts.map(({ key, part }) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <strong key={key} className="font-bold text-purple-900">
                        {part.slice(2, -2)}
                      </strong>
                    ) : (
                      part
                    ),
                  )}
                </p>
              </div>
            </div>
          </div>
        </BlurFade>
      )}

      {!loading && finalProducts.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
          <p className="text-lg font-medium text-gray-900">Ничего не найдено</p>
          <p className="mt-2 text-gray-500">
            Попробуйте изменить параметры поиска или фильтры
          </p>
          <Button
            variant="link"
            className="mt-4 text-blue-600"
            onClick={() => {
              setSearchQuery("");
              resetFilters();
            }}
          >
            Сбросить все фильтры
          </Button>
        </div>
      ) : (
        <>
          <ProductList
            products={finalProducts}
            onProductClick={setSelectedProduct}
            loading={loading}
          />
          {/* Load More Trigger */}
          {!searchQuery && status === "CanLoadMore" && (
            <div ref={loadMoreRef} className="py-8 flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
            </div>
          )}
        </>
      )}

      <ProductDetails
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
