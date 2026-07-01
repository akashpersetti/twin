import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "highlight.js/styles/github.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Akash Persetti — Blog",
  description: "Writing on Agentic AI, AWS, LLM apps, and digital-twin engineering.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable}`} style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
        <header style={{ borderBottom: "1px solid var(--border)", padding: "1rem 1.5rem" }}>
          <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <a href="https://akashpersetti.com" style={{ fontWeight: 700, color: "var(--accent)", textDecoration: "none", fontFamily: "var(--font-mono)", fontSize: "0.9375rem" }}>
              akashpersetti.com
            </a>
            <a href="/" style={{ fontWeight: 600, color: "var(--text-primary)", textDecoration: "none", fontSize: "0.875rem" }}>
              Blog
            </a>
          </div>
        </header>
        {children}
        <footer style={{ borderTop: "1px solid var(--border)", padding: "2rem 1.5rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4rem" }}>
          © {new Date().getFullYear()} Akash Persetti
        </footer>
      </body>
    </html>
  );
}
