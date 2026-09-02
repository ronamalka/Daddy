import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

/** Directory where MDX blog posts are stored. */
const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  image: string | null;
  readingTime: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

/** Reads frontmatter and content from a single MDX file. */
function parseMdxFile(filePath: string): BlogPost | null {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const slug =
    typeof data.slug === "string"
      ? data.slug
      : path.basename(filePath, path.extname(filePath));

  if (typeof data.title !== "string" || typeof data.date !== "string") {
    return null;
  }

  const stats = readingTime(content);

  return {
    slug,
    title: data.title,
    description: typeof data.description === "string" ? data.description : "",
    date: data.date,
    author: typeof data.author === "string" ? data.author : "צוות אבאל׳ה",
    tags: Array.isArray(data.tags) ? data.tags.filter((t): t is string => typeof t === "string") : [],
    image: typeof data.image === "string" ? data.image : null,
    readingTime: stats.text.replace("min read", "דקות קריאה").replace("read", ""),
    content,
  };
}

/** Returns all blog posts sorted by date (newest first). */
export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const posts = files
    .map((f) => parseMdxFile(path.join(BLOG_DIR, f)))
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Strip content for the listing
  return posts.map(({ content: _, ...meta }) => meta);
}

/** Returns a single blog post by slug, or null if not found. */
export function getPostBySlug(slug: string): BlogPost | null {
  if (!fs.existsSync(BLOG_DIR)) return null;

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  for (const f of files) {
    const post = parseMdxFile(path.join(BLOG_DIR, f));
    if (post && post.slug === slug) return post;
  }

  return null;
}

/** Returns all unique tags across all posts. */
export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort();
}

/** Returns all slugs (for generateStaticParams). */
export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

/** Formats a date string as Hebrew locale date. */
export function formatHebrewDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
