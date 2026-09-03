import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://fitflow-gym.onrender.com"),
  title: "FitFlow — Local-First Fitness PWA",
  description:
    "A local-first fitness PWA with program discovery, plan recommendations, guided interval training, weekly progress tracking, accessibility, and offline-ready behavior.",
  authors: [{ name: "Abdulrahman Hajar", url: "https://www.linkedin.com/in/abdulrahman-hajjar-5430281a1" }],
  creator: "Abdulrahman Hajar",
  keywords: ["fitness PWA", "workout planner", "interval timer", "local-first", "accessibility", "FitFlow"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "FitFlow — Local-First Fitness PWA",
    description: "Plan a training week, run guided intervals, and keep progress on-device in an installable fitness experience.",
    type: "website",
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1731,
        height: 909,
        alt: "FitFlow local-first fitness PWA product preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FitFlow — Local-First Fitness PWA",
    description: "Plan a training week, run guided intervals, and keep progress on-device.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#071312",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
