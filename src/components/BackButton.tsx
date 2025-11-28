"use client";

import { backButton } from "@telegram-apps/sdk-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function BackButton() {
    const router = useRouter();

    useEffect(() => {
        if (backButton.show.isAvailable()) {
            backButton.show();
        }

        const handleClick = () => {
            router.push("/");
        };

        if (backButton.onClick.isAvailable()) {
            backButton.onClick(handleClick);
        }

        return () => {
            if (backButton.offClick.isAvailable()) {
                backButton.offClick(handleClick);
            }
            if (backButton.hide.isAvailable()) {
                backButton.hide();
            }
        };
    }, [router]);

    return null;
}
