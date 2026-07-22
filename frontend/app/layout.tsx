import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { resume } from "@/data/resume";

const cooper = localFont({
  src: "./fonts/cooper-bt-light.otf",
  variable: "--font-display",
  weight: "300",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const maison = localFont({
  src: "./fonts/maison-neue-light.ttf",
  variable: "--font-sans",
  weight: "300",
  display: "swap",
  fallback: ["system-ui", "Helvetica Neue", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${resume.basics.name} - ${resume.basics.title}`,
  description: `${resume.basics.name} - AI Engineer building adaptive AI tutoring and agentic systems. M.S. in Computer Science, Indiana University Bloomington (Graduated May 2026).`,
  icons: {
    icon: "./icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cooper.variable} ${maison.variable} ${jetbrainsMono.variable} antialiased`}
        style={{
          background: "var(--bg-base)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
