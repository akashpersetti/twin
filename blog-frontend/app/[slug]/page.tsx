import { getAllPosts, getPost, getPostSlugs } from "@/lib/posts";
import PostBody from "@/components/PostBody";
import type { Metadata } from "next";

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
      <a href="/" style={{ fontSize: "0.875rem", color: "var(--accent)", textDecoration: "none", display: "inline-block", marginBottom: "2rem" }}>
        ← All posts
      </a>
      <article>
        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.2, margin: "0 0 1rem" }}>{post.title}</h1>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <time style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              {post.date}{post.updated !== post.date ? ` · updated ${post.updated}` : ""}
            </time>
            {(post.tags ?? []).map((tag) => (
              <span key={tag} style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", border: "1px solid var(--accent-soft)", borderRadius: "999px", color: "var(--accent)", fontWeight: 500 }}>
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
