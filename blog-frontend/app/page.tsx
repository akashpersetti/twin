import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";

export default function Home() {
  const posts = getAllPosts();

  return (
    <main style={{ maxWidth: "720px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      <header style={{ marginBottom: "3rem" }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--accent)", fontFamily: "var(--font-mono)", margin: "0 0 0.5rem" }}>
          Writing
        </p>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 0.75rem" }}>Blog</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", margin: 0 }}>
          Notes on Agentic AI, AWS, LLM apps, and digital-twin engineering.
        </p>
      </header>

      {posts.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No posts yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
