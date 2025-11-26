import { Undo2 } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { CloseAppButton } from "./close-app-button";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="text-muted-foreground space-y-2 text-sm">
        <p>
          This is a server-side rendered Settings page. It is opened via the
          native settings menu item.
        </p>

        <p>
          The &quot;Close App&quot; button itself is a client-side component and
          it will close the mini app.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Undo2 className="size-4" /> Home
          </Button>
        </Link>
        <CloseAppButton />
      </div>
    </div>
  );
}
