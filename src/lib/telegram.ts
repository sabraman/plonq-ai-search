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
    } catch (_e) {
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
    } catch (_e) {
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
    } catch (_e) {
      // Ignore
    }
  };

  return { impact, notification, selection };
}
