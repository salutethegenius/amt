import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kemisdigital.com"),
  title: {
    default: "KemisDigital — Software Platforms for Bahamian Business",
    template: "%s — KemisDigital",
  },
  description:
    "KemisDigital designs and builds software platforms for Bahamian businesses — payments, portals, automation, and AI tools on production-ready infrastructure.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "KemisDigital — Software Platforms for Bahamian Business",
    description:
      "KemisDigital designs and builds software platforms for Bahamian businesses — payments, portals, automation, and AI tools on production-ready infrastructure.",
    url: "https://kemisdigital.com/",
    siteName: "KemisDigital",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "KemisDigital — Software Platforms for Bahamian Business",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KemisDigital — Software Platforms for Bahamian Business",
    description:
      "KemisDigital designs and builds software platforms for Bahamian businesses — payments, portals, automation, and AI tools on production-ready infrastructure.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
