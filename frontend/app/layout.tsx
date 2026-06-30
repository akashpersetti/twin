import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { resume } from "@/data/resume";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
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
