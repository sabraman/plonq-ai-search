import { Skeleton } from "./ui/skeleton";

export function ProductCardSkeleton() {
    return (
        <div className="flex flex-col justify-between rounded-[20px] sm:rounded-[32px] bg-[#F6F5F8] p-3 sm:p-5 shadow-sm h-full w-full">
            {/* Header */}
            <div className="mb-2 sm:mb-4 flex justify-between items-start">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16 sm:w-24 bg-gray-200" />
                    <Skeleton className="h-3 w-12 sm:w-20 bg-gray-200" />
                </div>

                {/* Like & Rating Top Right */}
                <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-full bg-gray-200" />
                    <Skeleton className="h-3 w-8 bg-gray-200" />
                </div>
            </div>

            {/* Image */}
            <div className="relative mb-2 sm:mb-6 flex aspect-[3/4] w-full items-center justify-center">
                <Skeleton className="h-full w-2/3 bg-gray-200 rounded-xl" />
            </div>

            {/* Content */}
            <div className="mb-3 sm:mb-6 flex-grow space-y-3">
                <Skeleton className="h-5 sm:h-6 w-3/4 bg-gray-200" />

                {/* Taste Indicators */}
                <div className="mb-2 sm:mb-4 flex gap-1.5 sm:gap-3">
                    <Skeleton className="h-2 w-8 bg-gray-200 rounded-full" />
                    <Skeleton className="h-2 w-8 bg-gray-200 rounded-full" />
                    <Skeleton className="h-2 w-8 bg-gray-200 rounded-full" />
                </div>

                <div className="space-y-1.5">
                    <Skeleton className="h-3 w-full bg-gray-200" />
                    <Skeleton className="h-3 w-full bg-gray-200" />
                    <Skeleton className="h-3 w-2/3 bg-gray-200" />
                </div>
            </div>
        </div>
    );
}
