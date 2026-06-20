import { Metadata } from "next";
import { StructuredData } from "@/components/structured-data";

export const metadata: Metadata = {
  title: "Convert a GitHub Repo to Markdown for AI Tools | RepoContext",
  description: "Learn convert a github repo to markdown for ai tools securely and quickly using RepoContext.",
  keywords: ["convert github repo to markdown for ai", "repocontext", "ai coding"],
  alternates: {
    canonical: "https://repocontext.ajaymathuriya.com/blog/convert-github-repo-to-markdown",
  },
  openGraph: {
    title: "Convert a GitHub Repo to Markdown for AI Tools",
    description: "Learn convert a github repo to markdown for ai tools securely and quickly using RepoContext.",
    type: "article",
    url: "https://repocontext.ajaymathuriya.com/blog/convert-github-repo-to-markdown",
    authors: ["Ajay Mathuriya"],
  },
};

export default function BlogPost() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Convert a GitHub Repo to Markdown for AI Tools",
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
        name: "What makes RepoContext ideal for convert github repo to markdown for ai?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "RepoContext strips away the noise from standard GitHub repositories, leaving only structured, relevant data. This reduces context window usage and significantly improves the output quality for convert github repo to markdown for ai."
        }
      },
      {
        "@type": "Question",
        name: "Why convert a GitHub repository to Markdown?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Markdown is the native language of Large Language Models. Converting a repository to Markdown allows AI tools to read file structures, code snippets, and documentation with optimal token efficiency and semantic understanding."
        }
      },
      {
        "@type": "Question",
        name: "What is the best tool to convert a GitHub repo to Markdown?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "RepoContext deterministically analyzes the repository and generates a structured Markdown brief containing the file tree, metadata, and core file contents."
        }
      },
      {
        "@type": "Question",
        name: "Do I need an account to convert my repo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. RepoContext is free, requires no signups, and processes public repositories directly from your browser."
        }
      }
    ]
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to convert github repo to markdown for ai",
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
          Convert a GitHub Repo to Markdown for AI Tools
        </h1>
        
        <p className="lead text-lg text-muted-foreground mb-8">
          To get the best results from tools like AI Tools, you need to provide clear, deterministic repository context. In this guide, we cover how to convert github repo to markdown for ai using RepoContext.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">Why Raw Code Causes Problems for AI Tools</h2>
        <p className="mb-4">
          When working with complex codebases, pasting raw files or relying on broad prompts often leads to missed dependencies and degraded output. To get reliable results from AI Tools, you need to supply a structured, high-signal map of your repository.
        </p>
        <p className="mb-8">
          This means filtering out the noise: large lockfiles, build artifacts, and trivial configuration. RepoContext is designed to heuristically surface the directory hierarchy and the most critical entry files.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">Step-by-Step: How to convert github repo to markdown for ai</h2>
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
            <strong>Export Context:</strong> Click the "Export for LLM" button. You will receive a Markdown document containing the file tree and top file contents, ready to be passed to AI Tools.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold mt-10 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6 mb-12">
          <div>
            <h3 className="font-medium text-foreground">Why convert a GitHub repository to Markdown?</h3>
            <p className="text-sm text-muted-foreground mt-1">Markdown is the native language of Large Language Models. Converting a repository to Markdown allows AI tools to read file structures, code snippets, and documentation with optimal token efficiency and semantic understanding.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground">What is the best tool to convert a GitHub repo to Markdown?</h3>
            <p className="text-sm text-muted-foreground mt-1">RepoContext deterministically analyzes the repository and generates a structured Markdown brief containing the file tree, metadata, and core file contents.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Do I need an account to convert my repo?</h3>
            <p className="text-sm text-muted-foreground mt-1">No. RepoContext is free, requires no signups, and processes public repositories directly from your browser.</p>
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
