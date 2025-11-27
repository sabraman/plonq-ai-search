/* eslint-disable @typescript-eslint/no-explicit-any */
export function useHaptics() {
  const impact = (style: "light" | "medium" | "heavy" | "rigid" | "soft") => {
    try {
      if (
        typeof window !== "undefined" &&
        // biome-ignore lint/suspicious/noExplicitAny: Telegram global
        (window as any).Telegram?.WebApp?.HapticFeedback
      ) {
        // biome-ignore lint/suspicious/noExplicitAny: Telegram global
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred(style);
      }
    } catch {
      // Ignore
    }
  };

  const notification = (type: "error" | "success" | "warning") => {
    try {
      if (
        typeof window !== "undefined" &&
        // biome-ignore lint/suspicious/noExplicitAny: Telegram global
        (window as any).Telegram?.WebApp?.HapticFeedback
      ) {
        // biome-ignore lint/suspicious/noExplicitAny: Telegram global
        (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred(
          type,
        );
      }
    } catch {
      // Ignore
    }
  };

  const selection = () => {
    try {
      if (
        typeof window !== "undefined" &&
        // biome-ignore lint/suspicious/noExplicitAny: Telegram global
        (window as any).Telegram?.WebApp?.HapticFeedback
      ) {
        // biome-ignore lint/suspicious/noExplicitAny: Telegram global
        (window as any).Telegram.WebApp.HapticFeedback.selectionChanged();
      }
    } catch {
      // Ignore
    }
  };

  return { impact, notification, selection };
}
