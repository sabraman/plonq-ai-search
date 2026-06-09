import { SlidersHorizontal, Trash2 } from "lucide-react";
import { AiSearchInput } from "./AiSearchInput";
import { Button } from "./ui/button";

interface CatalogHeaderProps {
  totalCount: number;
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  loading: boolean;
  onClear: () => void;
  filterComponent?: React.ReactNode;
}

export function CatalogHeader({
  totalCount,
  filteredCount,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  loading,
  onClear,
  filterComponent,
}: CatalogHeaderProps) {
  return (
    <div className="mb-8 w-full space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Подбор вкусов Plonq</h1>

      <div className="flex w-full flex-col gap-4">
        {/* Search Input */}
        <div className="relative w-full">
          <AiSearchInput
            value={searchQuery}
            onChange={onSearchChange}
            onSubmit={onSearchSubmit}
            loading={loading}
          />
        </div>

        <div className="flex w-full items-center justify-between gap-3">
          {filterComponent || (
            <Button
              variant="outline"
              className="h-12 gap-2 rounded-full border-none bg-white px-6 text-base font-medium text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-900"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span>Фильтр</span>
              <span className="ml-1 text-blue-500">{filteredCount}</span>
              <span className="text-gray-300">из {totalCount}</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={onClear}
            className="h-12 w-12 rounded-full border-none bg-white text-gray-400 shadow-sm hover:bg-gray-50 hover:text-gray-900"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
