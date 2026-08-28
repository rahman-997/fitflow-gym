import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./claims-cleanup.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://fitflow-gym-online.netlify.app"),
  title: "FitFlow Fitness — Personalized Training",
  description:
    "Personalized workouts, expert guidance, and a clear path to a stronger, healthier you.",
  authors: [{ name: "Abdulrahman Hajar", url: "https://www.linkedin.com/in/abdulrahman-hajjar-5430281a1" }],
  creator: "Abdulrahman Hajar",
  keywords: ["fitness", "workout planner", "training programs", "weekly progress", "FitFlow"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "FitFlow Fitness",
    description: "Move with purpose. Build strength. Thrive for life.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1731,
        height: 909,
        alt: "FitFlow Fitness - Move with purpose, build strength, thrive for life",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FitFlow Fitness",
    description: "Move with purpose. Build strength. Thrive for life.",
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
