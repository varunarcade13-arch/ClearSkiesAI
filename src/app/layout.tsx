import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/presentation/theme/ThemeProvider";
import { LocationProvider } from "@/presentation/context/LocationContext";
import { FamilyProfileProvider } from "@/presentation/context/FamilyProfileContext";
import { AQIProvider } from "@/presentation/context/AQIContext";
import { SkipLink } from "@/presentation/components/common/SkipLink";

export const metadata: Metadata = {
  title: "ClearSkies AI – GenAI Urban Air Pollution & Winter Smog Assistant",
  description:
    "Enterprise-grade GenAI assistant helping families navigate severe winter smog and urban air pollution with real-time AQI, personalized protection routines, indoor ventilation calculators, and sustainable alternatives.",
  keywords: [
    "Air Quality Index",
    "AQI",
    "Winter Smog",
    "PM2.5",
    "Delhi Pollution",
    "CPCB",
    "Air Purifier CADR",
    "GenAI Assistant",
    "Gemini AI",
    "N95 Masks",
  ],
  authors: [{ name: "ClearSkies AI Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased transition-colors">
        <SkipLink />
        <ThemeProvider>
          <LocationProvider>
            <FamilyProfileProvider>
              <AQIProvider>
                {children}
              </AQIProvider>
            </FamilyProfileProvider>
          </LocationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
