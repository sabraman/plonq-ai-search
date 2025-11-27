import "~/styles/globals.css";

import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { ClientRoot } from "~/components/common/client-root";
import { env } from "~/env";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "TG Mini App",
  description: "",
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
      <body>
        <ClientRoot debug={env.NODE_ENV === "development"}>
          {children}
        </ClientRoot>
      </body>
    </html>
  );
}
