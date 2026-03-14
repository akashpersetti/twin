import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { resume } from "@/data/resume";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${resume.basics.name} - ${resume.basics.title}`,
  description: `Portfolio of ${resume.basics.name} - ${resume.education[0].degree} at ${resume.education[0].institution}. Building agentic AI systems, real-time ML pipelines, and full-stack applications.`,
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* FOWT prevention: apply stored theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.add('light');}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' }}
      >
        {children}
      </body>
    </html>
  );
}
