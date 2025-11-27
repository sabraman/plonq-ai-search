import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  favorites: string[]; // List of product IDs (or names if IDs unstable, but IDs preferred)
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (productId) =>
        set((state) => {
          const isFav = state.favorites.includes(productId);
          return {
            favorites: isFav
              ? state.favorites.filter((id) => id !== productId)
              : [...state.favorites, productId],
          };
        }),
      isFavorite: (productId) => get().favorites.includes(productId),
    }),
    {
      name: "plonq-favorites",
    },
  ),
);
