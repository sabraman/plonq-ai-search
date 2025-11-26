"use client";

import { miniApp } from "@telegram-apps/sdk-react";
import { XCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useBackButton } from "~/hooks/use-back-button";

export function CloseAppButton() {
  useBackButton();

  return (
    <Button
      onClick={() => {
        miniApp.close();
      }}
      className="gap-2"
    >
      <XCircle className="size-4" /> Close App
    </Button>
  );
}
