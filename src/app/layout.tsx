import type { Metadata } from "next";
import { BRANDING } from "@/constants/branding";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRANDING.name} - ${BRANDING.tagline}`,
  description: BRANDING.shortDescription,
  manifest: "/manifest.json",
  icons: {
    icon: "/brand/finpulse-logo.jpg",
    apple: "/brand/finpulse-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <meta name="theme-color" content="#090d16" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-dark-bg text-slate-100 antialiased selection:bg-brand-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
