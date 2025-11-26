import { Cherry } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { getAuth } from "~/lib/security";

export default async function HomePage() {
  const { userData } = await getAuth();
  // const name: string = userData?.firstName ?? userData?.username ?? "world";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-8">
      <h1 className="text-3xl font-bold">
        Hello {userData?.firstName}!
        <br />
        <span className="text-sm text-muted-foreground">
          {userData?.username}
        </span>
      </h1>

      <p className="text-muted-foreground w-full">
        This is a server-side rendered page. This page does not trigger any
        telegram specific functionalities.
      </p>

      <div className="flex items-center gap-3">
        <Link href="/demo">
          <Button className="gap-2">
            <Cherry className="size-4" /> Demo
          </Button>
        </Link>
      </div>
    </main>
  );
}
