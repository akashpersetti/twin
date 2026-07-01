'use client';

import { PostMeta } from "@/lib/posts";

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <a
      href={`/${post.slug}`}
      style={{ display: "block", textDecoration: "none", color: "inherit" }}
    >
      <article
        style={{
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "1.5rem",
          background: "var(--bg-card)",
          transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-soft)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(13,148,136,0.10)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }}
      >
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--text-primary)" }}>
          {post.title}
        </h2>
        <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", margin: "0 0 0.75rem", lineHeight: 1.6 }}>
          {post.summary}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <time style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {post.date}
          </time>
          {(post.tags ?? []).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "0.75rem",
                padding: "0.2rem 0.6rem",
                border: "1px solid var(--accent-soft)",
                borderRadius: "999px",
                color: "var(--accent)",
                fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </article>
    </a>
  );
}
