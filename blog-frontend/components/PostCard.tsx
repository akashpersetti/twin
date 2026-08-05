'use client';

import { PostMeta } from "@/lib/posts";

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <a
      href={`/${post.slug}`}
      style={{ display: "block", textDecoration: "none", color: "inherit" }}
    >
      <article className="row">
        <h2 className="font-display" style={{ fontSize: "1.375rem", margin: "0 0 0.5rem", color: "var(--text-primary)" }}>
          {post.title}
        </h2>
        <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", margin: "0 0 0.75rem", lineHeight: 1.6 }}>
          {post.summary}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <time className="mono" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            {post.date}
          </time>
          {(post.tags ?? []).map((tag) => (
            <span key={tag} className="tag" style={{ color: "var(--accent-ink)" }}>
              {tag}
            </span>
          ))}
        </div>
      </article>
    </a>
  );
}
