import { backButton } from "@telegram-apps/sdk-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

/**
 * The back button is a native telegram button that is displayed at the top-left
 * of the screen/view. It is used to navigate back in the app. This hook
 * activates the back button and sets up an event listener for the click event.
 * The button will be deactivated during clean-up.
 *
 * @param url - The URL to navigate to when the back button is clicked. If not
 * provided, the browser's default back button behavior will be used.
 */
export function useBackButton(url?: string) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    if (url) {
      router.push(url);
    } else {
      router.back();
    }
  }, [router, url]);

  useEffect(() => {
    // Check availability before using methods
    if (backButton.show.isAvailable()) {
      backButton.show();
    }

    if (backButton.onClick.isAvailable()) {
      backButton.onClick(handleClick);
    }

    return () => {
      if (backButton.hide.isAvailable()) {
        backButton.hide();
      }

      if (backButton.offClick.isAvailable()) {
        backButton.offClick(handleClick);
      }
    };
  }, [handleClick]);
}
