import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { getPrivyEnv } from "@/core/auth/privy-env";
import { themeInitScript } from "@/core/theme/theme-init-script";
import { AppProvider } from "@/providers/app-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.lyrabuild.xyz"),
  title: "Lyra Terminal",
  description: "A clean, command-driven paper trading workspace.",
  openGraph: {
    title: "Lyra Terminal",
    description: "A clean, command-driven paper trading workspace.",
    url: "https://www.lyrabuild.xyz/terminal",
    siteName: "Lyra Terminal",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Lyra Terminal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lyra Terminal",
    description: "A clean, command-driven paper trading workspace.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const privy = getPrivyEnv();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="lyra-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body>
        <AppProvider
          privyAppId={privy.appId}
          privyClientId={privy.clientId}
          privyServerAuthReady={privy.serverAuthReady}
        >
          {children}
        </AppProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
