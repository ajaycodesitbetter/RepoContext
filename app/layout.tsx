import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { StructuredData } from "@/components/structured-data";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://repocontext.ajaymathuriya.com"),
  title: "RepoContext — Read Any GitHub Repo in Seconds",
  description:
    "Convert any GitHub repository into an AI-ready context brief. Surface top files, health signals, and structured context for Claude Code, Cursor, and Gemini CLI. No AI, no signups.",
  keywords: [
    "github repo to ai context",
    "repo to markdown for ai",
    "convert github repo for claude",
    "repo context generator",
    "codebase context for cursor",
    "llms.txt generator",
    "prepare codebase for chatgpt",
    "github repository summary tool",
  ],
  openGraph: {
    title: "RepoContext — Read Any GitHub Repo in Seconds",
    description:
      "Convert any GitHub repository into an AI-ready context brief. Surface top files, health signals, and structured context for Claude Code, Cursor, and Gemini CLI. No AI, no signups.",
    url: "https://repocontext.ajaymathuriya.com",
    siteName: "RepoContext",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RepoContext — Read Any GitHub Repo in Seconds",
    description:
      "Convert any GitHub repository into an AI-ready context brief. Surface top files, health signals, and structured context for Claude Code, Cursor, and Gemini CLI. No AI, no signups.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://repocontext.ajaymathuriya.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "RepoContext",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: "https://repocontext.ajaymathuriya.com",
    description:
      "Convert any GitHub repository into structured AI-ready context brief. Surface top files, health signals, and structured context for Claude Code, Cursor, and Gemini CLI. No AI, no signups.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: {
      "@type": "Person",
      name: "Ajay Mathuriya",
      url: "https://github.com/ajaycodesitbetter",
    },
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <StructuredData data={schema} />
        {children}
      </body>
    </html>
  );
}
