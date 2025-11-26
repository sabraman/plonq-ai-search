import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { ClientRoot } from "~/components/common/client-root";
import { env } from "~/env";

export const metadata: Metadata = {
  title: "TG Mini App",
  description: "",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
      <body>
        <ClientRoot debug={env.NODE_ENV === "development"}>
          {children}
        </ClientRoot>
      </body>
    </html>
  );
}
