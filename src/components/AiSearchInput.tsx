"use client";

import { CornerDownLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface AiSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    loading?: boolean;
    suggestions?: string[];
    placeholder?: string;
}

export function AiSearchInput({
    value,
    onChange,
    onSubmit,
    loading,
    suggestions = [
        "Не слишком сладкое, свежее",
        "Как тропический коктейль",
        "Чтобы проснуться утром",
        "Максимально крепкое",
        "Вкус детства",
    ],
    placeholder = "Опишите, какой вкус вы ищете...",
}: AiSearchInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="w-full space-y-3">
            <div
                className={cn(
                    "relative flex flex-col rounded-3xl border bg-white transition-all",
                    isFocused
                        ? "border-purple-500 ring-4 ring-purple-500/10 shadow-lg"
                        : "border-gray-200 shadow-sm hover:border-gray-300",
                )}
            >
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={placeholder}
                        rows={1}
                        className="w-full resize-none bg-transparent py-4 pl-6 pr-14 text-base placeholder:text-gray-400 focus:outline-none min-h-[56px] max-h-[200px]"
                    />
                    <div className="absolute right-2 bottom-2">
                        <Button
                            size="icon"
                            onClick={onSubmit}
                            disabled={!value.trim() || loading}
                            className={cn(
                                "h-10 w-10 rounded-full transition-all",
                                value.trim()
                                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                                    : "bg-gray-100 text-gray-400 hover:bg-gray-200",
                            )}
                        >
                            <CornerDownLeft className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <div className="relative">
                    <div className="flex overflow-x-auto pb-2 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className="flex gap-2">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => onChange(suggestion)}
                                    className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Fade Gradient */}
                    <div className="pointer-events-none absolute -right-4 top-0 bottom-2 w-16 bg-gradient-to-l from-white to-transparent" />
                </div>
            )}
        </div>
    );
}
