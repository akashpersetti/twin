import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface PostMeta {
  title: string;
  date: string;
  updated: string;
  summary: string;
  tags: string[];
  slug: string;
  published: boolean;
}

export interface Post extends PostMeta {
  content: string;
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs.readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getPost(slug: string): Post {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { ...(data as PostMeta), slug, content: content.trim() };
}

export function getAllPosts(): Post[] {
  return getPostSlugs()
    .map(getPost)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
