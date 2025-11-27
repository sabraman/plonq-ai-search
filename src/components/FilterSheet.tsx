import { Heart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { filterProducts, type Product } from "~/lib/filter-utils";
import { cn } from "~/lib/utils";
import { useFavoritesStore } from "~/store/favorites-store";
import { type FilterState, useFilterStore } from "~/store/filter-store";

interface FilterSheetProps {
  filteredCount: number;
  products?: Product[];
}

interface FilterOption {
  label: string;
  value: string | number | boolean;
}

export function FilterSheet({
  filteredCount,
  products = [],
}: FilterSheetProps) {
  const {
    deviceTypes,
    categories,
    flavors,
    puffs,
    puffsRange,
    coldness,
    sweetness,
    sourness,
    strength,
    sortBy,
    showFavorites,
    setFilters,
    resetFilters,
  } = useFilterStore();

  const { favorites } = useFavoritesStore();

  const [isOpen, setIsOpen] = useState(false);

  const [localFilters, setLocalFilters] = useState({
    deviceTypes,
    categories,
    flavors,
    puffs,
    puffsRange,
    coldness,
    sweetness,
    sourness,
    strength,
    sortBy,
    showFavorites,
  });

  // Calculate dynamic count based on local filters
  const dynamicFilteredCount =
    products.length > 0
      ? filterProducts(products, { ...localFilters } as FilterState, favorites)
          .length
      : filteredCount;

  // Sync local state with store when drawer opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters({
        deviceTypes,
        categories,
        flavors,
        puffs,
        puffsRange,
        coldness,
        sweetness,
        sourness,
        strength,
        sortBy,
        showFavorites,
      });
    }
  }, [
    isOpen,
    deviceTypes,
    categories,
    puffs,
    puffsRange,
    coldness,
    sweetness,
    sourness,
    strength,
    sortBy,
    showFavorites,
    flavors,
  ]);

  const handleApply = () => {
    // If showFavorites is true, we need to pass that to the main filter logic.
    // But filter-store doesn't have showFavorites yet.
    // Let's add it to the store or handle it here.
    // Ideally, filter-store should know about it.
    // For now, let's just update the other filters and maybe we need to update the store schema.
    setFilters(localFilters);
    // Wait, localFilters has showFavorites but setFilters expects FilterState which might not have it.
    // I need to update FilterState in store/filter-store.ts first.
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalFilters({
      deviceTypes: [],
      categories: [],
      flavors: [],
      puffs: [],
      puffsRange: [0, 20000],
      coldness: [],
      sweetness: [],
      sourness: [],
      strength: [],
      sortBy: "rating-desc",
      showFavorites: false,
    });
    resetFilters();
  };

  // Helper for Pill Button Group
  const FilterSection = ({
    title,
    options,
    selectedValues,
    onChange,
    multiSelect = true,
  }: {
    title: string;
    options: FilterOption[];
    selectedValues: (string | number | boolean)[];
    onChange: (values: (string | number | boolean)[]) => void;
    multiSelect?: boolean;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange([])}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-medium transition-all border",
            selectedValues.length === 0
              ? "border-gray-200 bg-white text-gray-900 shadow-sm"
              : "border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200",
          )}
          style={
            selectedValues.length === 0
              ? { boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }
              : {}
          }
        >
          Все
        </button>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => {
                if (multiSelect) {
                  onChange(
                    isSelected
                      ? selectedValues.filter((v) => v !== option.value)
                      : [...selectedValues, option.value],
                  );
                } else {
                  onChange([option.value]);
                }
              }}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-all border",
                isSelected
                  ? "border-gray-200 bg-white text-gray-900 shadow-sm"
                  : "border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className="h-12 gap-2 rounded-full border-none bg-white px-6 text-base font-medium text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-900"
        >
          <span>Фильтры</span>
          <span className="ml-1 text-blue-500">{filteredCount}</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[90vh] rounded-t-[32px]">
        <div className="mx-auto w-full max-w-md flex flex-col h-full">
          <DrawerHeader className="flex items-center justify-between border-b px-6 py-4">
            <DrawerTitle className="text-xl font-bold">Фильтры</DrawerTitle>
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
            <div className="space-y-8 pb-20">
              {/* Favorites Toggle */}
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                    <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                  </div>
                  <span className="font-bold text-gray-900">
                    Только избранное
                  </span>
                </div>
                <Switch
                  checked={localFilters.showFavorites}
                  onCheckedChange={(checked) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      showFavorites: checked,
                    }))
                  }
                />
              </div>

              {/* Strength */}
              <FilterSection
                title="Ощущение крепости"
                options={[
                  { label: "Сбалансированная", value: "Balanced" },
                  { label: "Высокая", value: "High" },
                ]}
                selectedValues={localFilters.strength}
                onChange={(vals) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    strength: vals as string[],
                  }))
                }
              />

              {/* Flavors (Categories) */}
              <FilterSection
                title="Вкус"
                options={[
                  { label: "Новые вкусы", value: "New Flavors" },
                  { label: "Фрукты", value: "Fruits" },
                  { label: "Ягоды", value: "Berries" },
                  { label: "Мята", value: "Mint" },
                  { label: "Хвойные", value: "Coniferous" },
                  { label: "Цитрусовые", value: "Citrus" },
                  { label: "Напитки", value: "Drinks" },
                  { label: "Другое", value: "Other" },
                ]}
                selectedValues={localFilters.categories}
                onChange={(vals) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    categories: vals as string[],
                  }))
                }
              />

              {/* Device Type (Category) */}
              <FilterSection
                title="Категория"
                options={[
                  { label: "Одноразовые", value: "Disposable" },
                  { label: "POD-системы", value: "POD System" },
                  { label: "Жидкости", value: "E-Liquid" },
                ]}
                selectedValues={localFilters.deviceTypes}
                onChange={(vals) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    deviceTypes: vals as string[],
                  }))
                }
              />

              {/* Puffs */}
              <FilterSection
                title="Выбор по затяжкам"
                options={[
                  { label: "600", value: 600 },
                  { label: "1 500", value: 1500 },
                  { label: "4 000", value: 4000 },
                  { label: "5 500", value: 5500 },
                  { label: "6 000", value: 6000 },
                  { label: "8 000", value: 8000 },
                  { label: "10 000", value: 10000 },
                  { label: "12 000", value: 12000 },
                  { label: "20 000", value: 20000 },
                ]}
                selectedValues={localFilters.puffs || []}
                onChange={(vals) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    puffs: vals as number[],
                  }))
                }
              />

              {/* Puffs Range Slider */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold">Диапазон затяжек</h3>
                <div className="flex items-center justify-between gap-2">
                  <div className="rounded-xl border border-gray-200 px-4 py-2">
                    <span className="text-sm text-gray-500">от </span>
                    <span className="font-bold">
                      {localFilters.puffsRange[0]}
                    </span>
                  </div>
                  <div className="rounded-xl border border-gray-200 px-4 py-2">
                    <span className="text-sm text-gray-500">до </span>
                    <span className="font-bold">
                      {localFilters.puffsRange[1]}
                    </span>
                  </div>
                </div>
                <Slider
                  defaultValue={[0, 20000]}
                  value={localFilters.puffsRange}
                  max={20000}
                  step={100}
                  min={0}
                  onValueChange={(value) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      puffsRange: value as [number, number],
                    }))
                  }
                  className="[&>.relative>.absolute]:bg-black"
                  thumbClassName="border-black bg-white"
                />
              </div>

              {/* Rating Sorting */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Рейтинг по отзывам</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        sortBy: "",
                      }))
                    }
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-medium transition-all border",
                      !localFilters.sortBy
                        ? "border-gray-200 bg-white text-gray-900 shadow-sm"
                        : "border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200",
                    )}
                    style={
                      !localFilters.sortBy
                        ? { boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }
                        : {}
                    }
                  >
                    По умолчанию
                  </button>
                  {[
                    { label: "Сначала высокий", value: "rating-desc" },
                    { label: "Сначала низкий", value: "rating-asc" },
                  ].map((option) => {
                    const isSelected = localFilters.sortBy === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            sortBy: option.value,
                          }))
                        }
                        className={cn(
                          "rounded-xl px-4 py-2 text-sm font-medium transition-all border",
                          isSelected
                            ? "border-gray-200 bg-white text-gray-900 shadow-sm"
                            : "border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200",
                        )}
                        style={
                          isSelected
                            ? { boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }
                            : {}
                        }
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t px-6 py-4 bg-white">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClear}
                className="h-14 flex-1 rounded-full border-gray-200 text-base font-medium hover:bg-gray-50"
              >
                Сбросить
              </Button>
              <Button
                onClick={handleApply}
                className="h-14 flex-[2] rounded-full bg-black text-base font-medium text-white hover:bg-gray-800"
              >
                Показать {dynamicFilteredCount} товаров
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
