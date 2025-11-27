"use client";

import { useAction, useQuery } from "convex/react";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterProducts, type Product } from "~/lib/filter-utils";
import { useFavoritesStore } from "~/store/favorites-store";
import { useFilterStore } from "~/store/filter-store";
import { api } from "../../convex/_generated/api";
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
  const convexProducts = useQuery(api.products.list);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const [searchQuery, setSearchQuery] = useState("");
  const [lastAiQuery, setLastAiQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendationText, setRecommendationText] = useState<string | null>(
    null,
  );

  // Update local products state when convex data loads, but only if not searching
  useEffect(() => {
    if (convexProducts && !searchQuery) {
      setProducts(convexProducts as Product[]);
    }
  }, [convexProducts, searchQuery]);

  const { favorites } = useFavoritesStore();
  const filters = useFilterStore();
  const { resetFilters } = filters;

  const search = useAction(api.products.search);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(
    async (force = false) => {
      if (!searchQuery?.trim()) return;
      // Don't re-fetch if query is same as last successful AI search, unless forced
      if (!force && searchQuery === lastAiQuery) return;

      // Create new controller
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setRecommendationText(""); // Clear previous text

      try {
        // 1. Fetch products (Fast)
        const { retrieveRawInitData } = await import(
          "@telegram-apps/sdk-react"
        );
        const initData = retrieveRawInitData();

        if (!initData) {
          console.error("No initData available");
          return;
        }

        const products = await search({
          preferences: searchQuery,
          initData: initData,
        });

        if (products) {
          setProducts(products as unknown as Product[]);
          setLastAiQuery(searchQuery);
        }

        // 2. Stream recommendation (Optimistic)
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
        const siteUrl = convexUrl.replace(".cloud", ".site");

        const response = await fetch(`${siteUrl}/stream-recommendation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferences: searchQuery,
            products: products.slice(0, 5), // Send top 5 for context
          }),
          signal: controller.signal,
        });

        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Paranoid check: stop if we've been aborted (even if fetch didn't throw yet)
          if (abortControllerRef.current !== controller) break;

          const chunk = decoder.decode(value);
          setRecommendationText((prev) => (prev || "") + chunk);
        }
      } catch {
        // ...
      } finally {
        if (abortControllerRef.current === controller) {
          setLoading(false);
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
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, lastAiQuery, handleSearch]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    // Allow manual submit to force refresh even if query is same
    await handleSearch(true);
  };

  // Apply filters
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by search query (local filtering)
    if (searchQuery.trim() && searchQuery !== lastAiQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query),
      );
    }

    // Use centralized filter logic
    // Disable sorting if we are showing AI search results (relevance matters more)
    // const isAiSearchActive = searchQuery.trim() && searchQuery === lastAiQuery;

    let finalResult = filterProducts(result, filters, favorites);

    // AI Re-ranking (Frontend Sync)
    // If the AI explicitly recommends a product (bolded text), move it to the top
    if (recommendationText) {
      const matches = recommendationText.match(/\*\*(.*?)\*\*/g);
      if (matches) {
        const promotedNames = matches.map((s) =>
          s.slice(2, -2).trim().toLowerCase(),
        );
        finalResult = [...finalResult].sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          // Check if name contains any of the promoted strings
          const aPromoted = promotedNames.some((n) => aName.includes(n));
          const bPromoted = promotedNames.some((n) => bName.includes(n));

          if (aPromoted && !bPromoted) return -1;
          if (!aPromoted && bPromoted) return 1;
          return 0;
        });
      }
    }

    return finalResult;
  }, [
    products,
    searchQuery,
    filters,
    lastAiQuery,
    favorites,
    recommendationText,
  ]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <div className="mx-auto max-w-7xl">
      <CatalogHeader
        totalCount={initialProducts.length}
        filteredCount={filteredProducts.length}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        loading={loading}
        onClear={() => {
          setSearchQuery("");
          setLastAiQuery(""); // Reset last query so we can search same thing again
          resetFilters();
          setRecommendationText(null);
          setProducts(initialProducts); // Reset to initial products on clear
        }}
        filterComponent={
          <FilterSheet
            products={products}
            filteredCount={filteredProducts.length}
          />
        }
      />

      {recommendationText && (
        <BlurFade delay={0.1}>
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
                  {recommendationText
                    ?.split(/(\*\*.*?\*\*)/)
                    .map((part, index) =>
                      part.startsWith("**") && part.endsWith("**") ? (
                        <strong
                          // biome-ignore lint/suspicious/noArrayIndexKey: Splitting text for highlighting
                          key={index}
                          className="font-bold text-purple-900"
                        >
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

      {!loading && filteredProducts.length === 0 ? (
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
              setProducts(initialProducts);
            }}
          >
            Сбросить все фильтры
          </Button>
        </div>
      ) : (
        <ProductList
          products={filteredProducts}
          onProductClick={setSelectedProduct}
          loading={loading}
        />
      )}

      <ProductDetails
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
