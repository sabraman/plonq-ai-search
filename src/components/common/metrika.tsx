"use client";

import { useEffect } from "react";
import { env } from "~/env";

type MetrikaFunction = ((...args: unknown[]) => void) & {
  a?: unknown[][];
  l?: number;
};

declare global {
  interface Window {
    ym?: MetrikaFunction;
  }
}

export function Metrika() {
  useEffect(() => {
    const id = env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

    if (!id) return;
    if (
      document.querySelector(
        'script[src="https://mc.yandex.ru/metrika/tag.js"]',
      )
    ) {
      return;
    }

    const ym: MetrikaFunction =
      window.ym ||
      function queueMetrikaCall(...args: unknown[]) {
        ym.a = ym.a || [];
        ym.a.push(args);
      };
    window.ym = ym;
    ym.l = Date.now();

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://mc.yandex.ru/metrika/tag.js";
    document.head.appendChild(script);

    ym(Number(id), "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    });
  }, []);

  return null;
}
