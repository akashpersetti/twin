import { getPost, getPostSlugs } from "@/lib/posts";
import PostBody from "@/components/PostBody";
import type { Metadata } from "next";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  return { title: `${post.title} — Akash Persetti`, description: post.summary };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);

  return (
    <main style={{ maxWidth: "680px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      <a href="/" className="hover-accent" style={{ fontSize: "0.875rem", color: "var(--accent-ink)", textDecoration: "none", display: "inline-block", marginBottom: "2rem", padding: "0.25rem 0.5rem" }}>
        ← All posts
      </a>
      <article>
        <header style={{ marginBottom: "2rem" }}>
          <h1 className="font-display" style={{ fontSize: "2.25rem", lineHeight: 1.2, margin: "0 0 1rem" }}>{post.title}</h1>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <time style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              {post.date}{post.updated !== post.date ? ` · updated ${post.updated}` : ""}
            </time>
            {(post.tags ?? []).map((tag) => (
              <span key={tag} className="tag" style={{ color: "var(--accent-ink)" }}>
                {tag}
              </span>
            ))}
          </div>
        </header>
        <PostBody content={post.content} />
      </article>
    </main>
  );
}
