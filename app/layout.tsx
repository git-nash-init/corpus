import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { ThemeSync } from "@/components/ui/ThemeToggle";
import { themeInitScript } from "@/lib/theme";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://crorpus.com"),
  title: { default: "Crorpus | Your whole wealth picture, calculated correctly", template: "%s | Crorpus" },
  description:
    "Track mutual funds, SIPs, stocks, PPF, EPF, NPS, FDs, gold, property and loans in one place. Returns, XIRR, net worth and your path to 1 crore, all computed from your own records.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e1311" },
    { media: "(prefers-color-scheme: light)", color: "#f3efe6" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" data-theme-pref="system" suppressHydrationWarning className={`${newsreader.variable} ${plex.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
