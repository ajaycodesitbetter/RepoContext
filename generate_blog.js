const fs = require('fs');
const path = require('path');

const posts = [
  {
    slug: 'repo-to-claude-code',
    title: 'How to Give a GitHub Repository to Claude Code',
    keyword: 'github repo to claude code',
    tool: 'Claude Code',
    q1: 'Why does Claude Code need structured context instead of raw files?',
    a1: 'Claude Code operates best when provided with structured, noise-free context. Raw files often contain irrelevant build artifacts, massive lockfiles, and undocumented dependencies that consume token limits and degrade reasoning. Structured context distills the repository into clear directory trees, prioritized files, and relevant content.',
    q2: 'How do I generate an onboarding brief for Claude Code?',
    a2: 'You can generate an onboarding brief instantly by pasting your GitHub repository URL into RepoContext. It parses the codebase to extract metadata, health signals, and the most critical files without requiring any AI processing.',
    q3: 'Can I export RepoContext data directly to Claude Code?',
    a3: 'Yes. By clicking "Export for LLM" on RepoContext, you receive a Markdown-formatted context file that is specifically optimized for tools such as Claude Code, Cursor, ChatGPT, Gemini CLI, and OpenClaw.',
  },
  {
    slug: 'convert-github-repo-to-markdown',
    title: 'Convert a GitHub Repo to Markdown for AI Tools',
    keyword: 'convert github repo to markdown for ai',
    tool: 'AI Tools',
    q1: 'Why convert a GitHub repository to Markdown?',
    a1: 'Markdown is the native language of Large Language Models. Converting a repository to Markdown allows AI tools to read file structures, code snippets, and documentation with optimal token efficiency and semantic understanding.',
    q2: 'What is the best tool to convert a GitHub repo to Markdown?',
    a2: 'RepoContext deterministically analyzes the repository and generates a structured Markdown brief containing the file tree, metadata, and core file contents.',
    q3: 'Do I need an account to convert my repo?',
    a3: 'No. RepoContext is free, requires no signups, and processes public repositories directly from your browser.',
  },
  {
    slug: 'repo-context-generator-cursor',
    title: 'Best Repo Context Generator for Cursor IDE',
    keyword: 'repo context generator for cursor',
    tool: 'Cursor IDE',
    q1: 'How does Cursor IDE use repository context?',
    a1: 'Cursor IDE uses repository context to understand your codebase architecture, enabling its AI to suggest accurate completions, refactors, and navigate complex code dependencies effectively.',
    q2: 'What makes a good repo context generator for Cursor?',
    a2: 'A high-quality repo context generator must filter out noise, highlight top-tier entry files, and structure the file tree clearly. This ensures Cursor\'s AI agents do not waste tokens on trivial files.',
    q3: 'How do I use RepoContext with Cursor IDE?',
    a3: 'Run your repository through RepoContext, click "Export for LLM", and drop the resulting structured Markdown into your Cursor IDE workspace or prompt window.',
  },
  {
    slug: 'generate-llms-txt-github',
    title: 'How to Generate llms.txt from Any GitHub Repo',
    keyword: 'generate llms.txt from github',
    tool: 'llms.txt standard',
    q1: 'What is the llms.txt standard?',
    a1: 'The llms.txt standard is a convention for providing AI models with a standardized, readable map of a project\'s documentation, architecture, and core files, similar to a robots.txt for AI.',
    q2: 'How can I generate an llms.txt file from a GitHub repo?',
    a2: 'Using RepoContext, you can analyze any GitHub repository and use the "Export for LLM" feature. The resulting Markdown export functions perfectly as a comprehensive llms.txt file for your project.',
    q3: 'Does generating an llms.txt require AI processing?',
    a3: 'No. RepoContext generates the context entirely heuristically based on repository structure, ensuring deterministic, fast, and secure output without sending your code to third-party AI APIs.',
  },
  {
    slug: 'prepare-codebase-for-chatgpt',
    title: 'How to Prepare Any Codebase for ChatGPT',
    keyword: 'prepare codebase for chatgpt',
    tool: 'ChatGPT',
    q1: 'Why should I prepare my codebase before pasting it into ChatGPT?',
    a1: 'ChatGPT has strict context window limits. Pasting raw codebases often results in truncated prompts or hallucinated responses. Preparing the codebase ensures only the most relevant, high-signal files and structures are analyzed.',
    q2: 'How do I structure my codebase for ChatGPT?',
    a2: 'The best approach is to provide a high-level file tree followed by the contents of the most critical files. RepoContext automates this process by heuristically ranking files and generating a plain-text Markdown export.',
    q3: 'Can I prepare a private repository for ChatGPT?',
    a3: 'Yes. RepoContext supports private repositories through GitHub Personal Access Tokens (PAT), allowing you to securely generate structured context for ChatGPT without exposing your code.',
  }
];

const generatePost = (post) => {
  const content = `import { Metadata } from "next";
import { StructuredData } from "@/components/structured-data";

export const metadata: Metadata = {
  title: "${post.title} | RepoContext",
  description: "Learn ${post.title.toLowerCase()} securely and quickly using RepoContext.",
  keywords: ["${post.keyword}", "repocontext", "ai coding"],
  alternates: {
    canonical: "https://repocontext.ajaymathuriya.com/blog/${post.slug}",
  },
  openGraph: {
    title: "${post.title}",
    description: "Learn ${post.title.toLowerCase()} securely and quickly using RepoContext.",
    type: "article",
    url: "https://repocontext.ajaymathuriya.com/blog/${post.slug}",
    authors: ["Ajay Mathuriya"],
  },
};

export default function BlogPost() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "${post.title}",
    author: {
      "@type": "Person",
      name: "Ajay Mathuriya",
      url: "https://github.com/ajaycodesitbetter"
    },
    publisher: {
      "@type": "Organization",
      name: "RepoContext",
      logo: {
        "@type": "ImageObject",
        url: "https://repocontext.ajaymathuriya.com/favicon.ico"
      }
    },
    datePublished: new Date().toISOString(),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What makes RepoContext ideal for ${post.keyword}?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "RepoContext strips away the noise from standard GitHub repositories, leaving only structured, relevant data. This reduces context window usage and significantly improves the output quality for ${post.keyword}."
        }
      },
      {
        "@type": "Question",
        name: "${post.q1}",
        acceptedAnswer: {
          "@type": "Answer",
          text: "${post.a1.replace(/"/g, "'")}"
        }
      },
      {
        "@type": "Question",
        name: "${post.q2}",
        acceptedAnswer: {
          "@type": "Answer",
          text: "${post.a2.replace(/"/g, "'")}"
        }
      },
      {
        "@type": "Question",
        name: "${post.q3}",
        acceptedAnswer: {
          "@type": "Answer",
          text: "${post.a3.replace(/"/g, "'")}"
        }
      }
    ]
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to ${post.keyword}",
    step: [
      {
        "@type": "HowToStep",
        name: "Go to RepoContext",
        text: "Step 1: Go to repocontext.ajaymathuriya.com"
      },
      {
        "@type": "HowToStep",
        name: "Paste GitHub URL",
        text: "Step 2: Paste any GitHub URL or owner/repo identifier"
      },
      {
        "@type": "HowToStep",
        name: "Read the structured brief",
        text: "Step 3: Read the structured onboarding brief"
      },
      {
        "@type": "HowToStep",
        name: "Export for LLM",
        text: "Step 4: Click 'Export for LLM' to get the AI-ready context"
      }
    ]
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <StructuredData data={articleSchema} />
      <StructuredData data={faqSchema} />
      <StructuredData data={howToSchema} />
      
      <article className="prose prose-invert max-w-none">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8">
          ${post.title}
        </h1>
        
        <p className="lead text-lg text-muted-foreground mb-8">
          To get the best results from tools like ${post.tool}, you need to provide clear, deterministic repository context. In this guide, we cover how to ${post.keyword} using RepoContext.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">Why Raw Code Causes Problems for ${post.tool}</h2>
        <p className="mb-4">
          When working with complex codebases, pasting raw files or relying on broad prompts often leads to missed dependencies and degraded output. To get reliable results from ${post.tool}, you need to supply a structured, high-signal map of your repository.
        </p>
        <p className="mb-8">
          This means filtering out the noise: large lockfiles, build artifacts, and trivial configuration. RepoContext is designed to heuristically surface the directory hierarchy and the most critical entry files.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">Step-by-Step: How to ${post.keyword}</h2>
        <ol className="list-decimal pl-6 space-y-4 mb-8">
          <li>
            <strong>Access the Tool:</strong> Navigate to <a href="https://repocontext.ajaymathuriya.com" className="text-primary hover:underline">repocontext.ajaymathuriya.com</a>.
          </li>
          <li>
            <strong>Input Repository:</strong> Paste the target GitHub URL or the owner/repo identifier into the search bar.
          </li>
          <li>
            <strong>Generate Brief:</strong> Wait for RepoContext to deterministically parse the repository. It uses zero AI, running heuristic checks to map the project.
          </li>
          <li>
            <strong>Export Context:</strong> Click the "Export for LLM" button. You will receive a Markdown document containing the file tree and top file contents, ready to be passed to ${post.tool}.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold mt-10 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6 mb-12">
          <div>
            <h3 className="font-medium text-foreground">${post.q1}</h3>
            <p className="text-sm text-muted-foreground mt-1">${post.a1}</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground">${post.q2}</h3>
            <p className="text-sm text-muted-foreground mt-1">${post.a2}</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground">${post.q3}</h3>
            <p className="text-sm text-muted-foreground mt-1">${post.a3}</p>
          </div>
        </div>

        <div className="bg-muted/30 border border-border rounded-xl p-6 text-center mt-12">
          <h2 className="text-xl font-semibold mb-2">Prepare your repository context</h2>
          <p className="text-muted-foreground mb-4">Generate deterministic onboarding briefs without signups.</p>
          <a href="https://repocontext.ajaymathuriya.com" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Try RepoContext
          </a>
        </div>
      </article>
    </div>
  );
}
`;
  
  const dirPath = path.join(__dirname, 'app', 'blog', post.slug);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), content);
};

posts.forEach(generatePost);

// Generate Blog Index
const blogIndexContent = `import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RepoContext Blog — GitHub & AI Guides",
  description: "Guides and tutorials on how to prepare GitHub repositories for AI analysis and coding assistants.",
};

const posts = ${JSON.stringify(posts.map(p => ({ title: p.title, slug: p.slug, desc: p.keyword })), null, 2)};

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">RepoContext Blog</h1>
        <p className="mt-4 text-lg text-muted-foreground">Master the intersection of GitHub codebases and AI context generation.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <Link key={post.slug} href={\`/blog/\${post.slug}\`} className="group block rounded-xl border border-border bg-card/10 p-6 transition-all hover:bg-card/30">
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
`;

fs.mkdirSync(path.join(__dirname, 'app', 'blog'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'app', 'blog', 'page.tsx'), blogIndexContent);

console.log("Blog posts generated successfully.");
