import { auth } from "@/auth";
import ClientProviders from "@/providers";
import "@worldcoin/mini-apps-ui-kit-react/styles.css";
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
  title: "SewaChain ",
  description: "Blockchain-powered  eliminating duplicate aid distribution",
  keywords: [
    "flood relief",
    "disaster coordination",
    "blockchain",
    "aid distribution",
    "world chain",
    "sewa",
  ],
  authors: [{ name: "SewaChain Team" }],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  themeColor: "#2563eb",
  openGraph: {
    title: "SewaChain ",
    description: "Blockchain-powered  eliminating duplicate aid distribution",
    type: "website",
    siteName: "SewaChain",
  },
  twitter: {
    card: "summary_large_image",
    title: "SewaChain ",
    description: "Blockchain-powered  eliminating duplicate aid distribution",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} safe-area-top safe-area-bottom`}
      >
        <ClientProviders session={session}>{children}</ClientProviders>
      </body>
    </html>
  );
}
