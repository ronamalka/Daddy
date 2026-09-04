import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  getPostBySlug,
  getAllSlugs,
  formatHebrewDate,
} from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/site-url";
import { serializeJsonLd } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return pageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    images: post.image ? [{ url: post.image, alt: post.title }] : undefined,
  });
}

/** Custom components for MDX rendering with site design tokens. */
const mdxComponents = {
  h2: (props: React.ComponentProps<"h2">) => (
    <h2
      className="mt-10 mb-4 text-[22px] font-extrabold text-[rgb(var(--color-text))] md:text-[26px]"
      {...props}
    />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3
      className="mt-8 mb-3 text-[18px] font-bold text-[rgb(var(--color-text))]"
      {...props}
    />
  ),
  p: (props: React.ComponentProps<"p">) => (
    <p
      className="mb-4 text-[15px] leading-relaxed text-[rgb(var(--color-text-secondary))]"
      {...props}
    />
  ),
  ul: (props: React.ComponentProps<"ul">) => (
    <ul
      className="mb-4 list-disc pr-6 text-[15px] leading-relaxed text-[rgb(var(--color-text-secondary))]"
      {...props}
    />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol
      className="mb-4 list-decimal pr-6 text-[15px] leading-relaxed text-[rgb(var(--color-text-secondary))]"
      {...props}
    />
  ),
  li: (props: React.ComponentProps<"li">) => (
    <li className="mb-2" {...props} />
  ),
  strong: (props: React.ComponentProps<"strong">) => (
    <strong
      className="font-bold text-[rgb(var(--color-text))]"
      {...props}
    />
  ),
  a: (props: React.ComponentProps<"a">) => (
    <a
      className="font-semibold text-[rgb(var(--color-primary))] hover:underline"
      {...props}
    />
  ),
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote
      className="mb-4 border-r-4 border-[rgb(var(--color-primary))] pr-4 italic text-[rgb(var(--color-text-secondary))]"
      {...props}
    />
  ),
  hr: () => (
    <hr className="my-8 border-t border-[rgb(var(--color-border))]" />
  ),
};

export default async function BlogPostPage(props: PageProps) {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "אבאל׳ה",
      url: siteUrl("/"),
    },
    url: siteUrl(`/blog/${post.slug}`),
    ...(post.image ? { image: post.image } : {}),
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg))]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-1 text-[13px] text-white/60 hover:text-white/90 transition-colors"
          >
            <span aria-hidden="true">&larr;</span>
            חזרה לבלוג
          </Link>

          {/* Tags */}
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/80"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-[28px] font-extrabold leading-tight md:text-[40px]">
            {post.title}
          </h1>

          <div className="mt-4 flex items-center gap-4 text-[13px] text-white/60">
            <span>{post.author}</span>
            <span aria-hidden="true">|</span>
            <time dateTime={post.date}>{formatHebrewDate(post.date)}</time>
            <span aria-hidden="true">|</span>
            <span>{post.readingTime}</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 md:p-10">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>

        {/* Back link */}
        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl bg-[rgba(var(--color-primary),0.1)] px-6 py-3 text-[14px] font-bold text-[rgb(var(--color-primary))] transition-all hover:bg-[rgba(var(--color-primary),0.2)]"
          >
            <span aria-hidden="true">&larr;</span>
            עוד מהבלוג
          </Link>
        </div>
      </article>
    </div>
  );
}
