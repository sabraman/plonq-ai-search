import "~/styles/globals.css";

import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { ClientRoot } from "~/components/common/client-root";
import { Metrika } from "~/components/common/metrika";
import { BottomNavBar } from "~/components/ui/bottom-nav-bar";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Plonq AI Search",
  description: "AI-powered product search for the Plonq catalog.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-gray-50">
        <div className="mx-auto min-h-screen w-full max-w-lg bg-gray-50">
          <ClientRoot>{children}</ClientRoot>
        </div>
        <BottomNavBar stickyBottom />
        <Metrika />
      </body>
    </html>
  );
}
