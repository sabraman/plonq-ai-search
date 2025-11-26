import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

export default function Loader({ className }: { className?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Loader2
        className={cn("text-muted-foreground size-8 animate-spin", className)}
      />
    </div>
  );
}
