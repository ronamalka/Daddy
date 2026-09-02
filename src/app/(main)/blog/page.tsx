import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, formatHebrewDate } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "הבלוג של אבאל׳ה — טיפים, מדריכים וחדשות",
  description:
    "טיפים לתחזוקת הבית, מדריכים לבחירת בעל מקצוע, וחדשות מעולם השירותים לבית. הבלוג של אבאל׳ה.",
  path: "/blog",
});

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg))]">
      {/* Hero */}
      <section className="bg-slate-900 py-20 text-center text-white">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-[36px] font-extrabold md:text-[48px]">
            הבלוג של אבאל׳ה
          </h1>
          <p className="mt-4 text-[18px] text-white/70">
            טיפים, מדריכים וכל מה שצריך לדעת על תחזוקת הבית
          </p>
        </div>
      </section>

      {/* Posts grid */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        {posts.length === 0 ? (
          <p className="text-center text-[rgb(var(--color-text-secondary))]">
            עדיין אין פוסטים. חזרו בקרוב!
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] overflow-hidden transition-shadow hover:shadow-lg"
              >
                {/* Image placeholder */}
                <div className="relative h-48 w-full bg-[rgba(var(--color-primary),0.08)] flex items-center justify-center">
                  <span className="text-[48px]" aria-hidden="true">
                    {post.tags.includes("טיפים")
                      ? "\u{1F4A1}"
                      : post.tags.includes("הרכבות")
                        ? "\u{1F6E0}"
                        : post.tags.includes("חיסכון")
                          ? "\u{1F4B0}"
                          : "\u{1F3E0}"}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  {/* Tags */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[rgba(var(--color-primary),0.1)] px-2.5 py-0.5 text-[11px] font-bold text-[rgb(var(--color-primary))]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h2 className="text-[16px] font-bold leading-snug text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">
                    {post.title}
                  </h2>

                  {/* Description */}
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[rgb(var(--color-text-secondary))] line-clamp-3">
                    {post.description}
                  </p>

                  {/* Meta */}
                  <div className="mt-4 flex items-center justify-between text-[12px] text-[rgb(var(--color-text-muted))]">
                    <span>{formatHebrewDate(post.date)}</span>
                    <span>{post.readingTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-center text-white">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-[28px] font-extrabold md:text-[32px]">
            צריכים עזרה בבית?
          </h2>
          <p className="mt-3 text-[16px] text-white/80">
            מצאו אבאל׳ה מנוסה באזור שלכם — בחינם וללא התחייבות
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-xl bg-white px-8 py-3.5 text-[15px] font-bold text-[rgb(var(--color-primary))] shadow-md transition-shadow hover:shadow-lg"
            >
              חפש אבאל׳ה
            </Link>
            <Link
              href="/become-a-daddy"
              className="rounded-xl border-2 border-white/40 px-8 py-3.5 text-[15px] font-bold text-white transition-all hover:bg-white/10"
            >
              הפוך לאבאל׳ה
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
