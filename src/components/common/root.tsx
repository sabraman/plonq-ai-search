"use client";

import {
  backButton,
  init,
  isTMA,
  mainButton,
  miniApp,
  settingsButton,
  themeParams,
  useLaunchParams,
  useSignal,
  viewport,
} from "@telegram-apps/sdk-react";
import { Rocket, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { env } from "~/env";
import { Toaster } from "../ui/sonner";
import { AuthProvider, useAuth } from "./auth";
import Loader from "./loader";
import { ThemeProvider } from "./theme-provider";

export default function Root({
  children,
  debug,
}: {
  children: React.ReactNode;
  debug: boolean;
}) {
  const [tma, setTMA] = useState<"loading" | "tma" | "web">("loading");

  useEffect(() => {
    // In v3, isTMA() returns a boolean directly, not a Promise
    const isTelegram = isTMA();
    setTMA(isTelegram ? "tma" : "web");
  }, []);

  switch (tma) {
    case "loading":
      return <Loader />;
    case "tma":
      return <MiniApp debug={debug}>{children}</MiniApp>;
    case "web":
      return <NonTgView />;
  }
}

export function MiniApp({
  children,
  debug,
}: {
  children: React.ReactNode;
  debug: boolean;
}) {
  const isDark = useSignal(miniApp.isDark);

  const router = useRouter();

  const openSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  useEffect(() => {
    // Initialize the SDK
    init();

    // Always check availability before mounting
    if (miniApp.mountSync.isAvailable()) {
      miniApp.mountSync();
    }

    if (themeParams.mountSync.isAvailable()) {
      themeParams.mountSync();
    }

    if (backButton.mount.isAvailable()) {
      backButton.mount();
    }

    if (mainButton.mount.isAvailable()) {
      mainButton.mount();
    }

    if (miniApp.bindCssVars.isAvailable() && !miniApp.isCssVarsBound()) {
      miniApp.bindCssVars();
    }

    if (
      themeParams.bindCssVars.isAvailable() &&
      !themeParams.isCssVarsBound()
    ) {
      themeParams.bindCssVars();
    }

    if (
      viewport.mount.isAvailable() &&
      !viewport.isMounted() &&
      !viewport.isMounting()
    ) {
      void viewport.mount().then(() => {
        if (viewport.bindCssVars.isAvailable()) {
          viewport.bindCssVars();
        }
        if (viewport.expand.isAvailable() && !viewport.isExpanded()) {
          viewport.expand();
        }
      });
    }

    if (settingsButton.mount.isAvailable()) {
      settingsButton.mount();

      if (settingsButton.onClick.isAvailable()) {
        settingsButton.onClick(openSettings);
      }

      if (settingsButton.show.isAvailable()) {
        settingsButton.show();
      }
    }

    if (miniApp.ready.isAvailable()) {
      miniApp.ready();
    }

    return () => {
      if (settingsButton.hide.isAvailable()) {
        settingsButton.hide();
      }

      if (settingsButton.offClick.isAvailable()) {
        settingsButton.offClick(openSettings);
      }
    };
  }, [openSettings]);

  useEffect(() => {
    if (debug) {
      void import("eruda").then((lib) => lib.default.init());
    }
  }, [debug]);

  return (
    <ThemeProvider
      attribute="class"
      forcedTheme={isDark ? "dark" : "light"}
      enableSystem={false}
      disableTransitionOnChange
    >
      <AuthProvider>
        <AppContent>{children}</AppContent>
        {debug && <DebugInfo />}
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <Loader className="text-primary" />;
  }

  return (
    <>
      {children}
      <Toaster position="top-center" />
    </>
  );
}

function DebugInfo() {
  // In v3, useLaunchParams returns different property names
  const launchParams = useLaunchParams();

  useEffect(() => {
    setTimeout(
      () =>
        console.log({
          tgWebAppData: launchParams.tgWebAppData,
          tgWebAppThemeParams: launchParams.tgWebAppThemeParams,
          tgWebAppStartParam: launchParams.tgWebAppStartParam,
          viewport: {
            height: viewport.height(),
            width: viewport.width(),
          },
        }),
      2000,
    );
  }, [launchParams]);

  return null;
}

function NonTgView() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12">
      <div className="space-y-4">
        <TriangleAlert className="text-primary mx-auto size-16" />
        <p className="text-muted-foreground">
          This app is only available in Telegram
        </p>
      </div>

      <Link href={env.NEXT_PUBLIC_TG_APP_URL}>
        <Button className="gap-2" size="lg">
          <Rocket className="size-5" />
          Open App in Telegram
        </Button>
      </Link>
    </div>
  );
}
