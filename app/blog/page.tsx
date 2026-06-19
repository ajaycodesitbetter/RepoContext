import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RepoContext Blog — GitHub & AI Guides",
  description: "Guides and tutorials on how to prepare GitHub repositories for AI analysis and coding assistants.",
};

const posts = [
  {
    "title": "How to Give a GitHub Repository to Claude Code",
    "slug": "repo-to-claude-code",
    "desc": "github repo to claude code"
  },
  {
    "title": "Convert a GitHub Repo to Markdown for AI Tools",
    "slug": "convert-github-repo-to-markdown",
    "desc": "convert github repo to markdown for ai"
  },
  {
    "title": "Best Repo Context Generator for Cursor IDE",
    "slug": "repo-context-generator-cursor",
    "desc": "repo context generator for cursor"
  },
  {
    "title": "How to Generate llms.txt from Any GitHub Repo",
    "slug": "generate-llms-txt-github",
    "desc": "generate llms.txt from github"
  },
  {
    "title": "How to Prepare Any Codebase for ChatGPT",
    "slug": "prepare-codebase-for-chatgpt",
    "desc": "prepare codebase for chatgpt"
  }
];

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">RepoContext Blog</h1>
        <p className="mt-4 text-lg text-muted-foreground">Master the intersection of GitHub codebases and AI context generation.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block rounded-xl border border-border bg-card/10 p-6 transition-all hover:bg-card/30">
            <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{post.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Guide to {post.desc} using RepoContext.</p>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span>Read article</span>
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
