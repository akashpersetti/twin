import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "highlight.js/styles/github-dark.css";

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
  title: "Akash Persetti — Blog",
  description: "Writing on Agentic AI, AWS, LLM apps, and digital-twin engineering.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${cooper.variable} ${maison.variable} ${jetbrainsMono.variable} antialiased`}
        style={{
          background: "var(--bg-base)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
          fontWeight: 300,
        }}
      >
        <header style={{ borderBottom: "1px solid var(--border)", padding: "1.25rem 1.5rem" }}>
          <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <a
              href="https://akashpersetti.com"
              className="flex items-center gap-2"
              style={{ textDecoration: "none", color: "var(--text-primary)", fontWeight: 700, fontSize: "1rem" }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "1.75rem",
                  height: "1.75rem",
                  borderRadius: "0.5rem",
                  background: "var(--accent)",
                  color: "#09090b",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                }}
              >
                A
              </span>
              Akash<span style={{ color: "var(--accent)" }}>.</span>
            </a>
            <a href="/" className="mono" style={{ fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.8125rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Blog
            </a>
          </div>
        </header>
        {children}
        <footer style={{ borderTop: "1px solid var(--border)", padding: "2rem 1.5rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.8125rem", marginTop: "4rem" }}>
          <span className="mono">© {new Date().getFullYear()} Akash Persetti</span>
        </footer>
      </body>
    </html>
  );
}
