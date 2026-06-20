import { Metadata } from "next";
import { StructuredData } from "@/components/structured-data";

export const metadata: Metadata = {
  title: "How to Prepare Any Codebase for ChatGPT | RepoContext",
  description: "Learn how to prepare any codebase for chatgpt securely and quickly using RepoContext.",
  keywords: ["prepare codebase for chatgpt", "repocontext", "ai coding"],
  alternates: {
    canonical: "https://repocontext.ajaymathuriya.com/blog/prepare-codebase-for-chatgpt",
  },
  openGraph: {
    title: "How to Prepare Any Codebase for ChatGPT",
    description: "Learn how to prepare any codebase for chatgpt securely and quickly using RepoContext.",
    type: "article",
    url: "https://repocontext.ajaymathuriya.com/blog/prepare-codebase-for-chatgpt",
    authors: ["Ajay Mathuriya"],
  },
};

export default function BlogPost() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Prepare Any Codebase for ChatGPT",
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
        name: "What makes RepoContext ideal for prepare codebase for chatgpt?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "RepoContext strips away the noise from standard GitHub repositories, leaving only structured, relevant data. This reduces context window usage and significantly improves the output quality for prepare codebase for chatgpt."
        }
      },
      {
        "@type": "Question",
        name: "Why should I prepare my codebase before pasting it into ChatGPT?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ChatGPT has strict context window limits. Pasting raw codebases often results in truncated prompts or hallucinated responses. Preparing the codebase ensures only the most relevant, high-signal files and structures are analyzed."
        }
      },
      {
        "@type": "Question",
        name: "How do I structure my codebase for ChatGPT?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The best approach is to provide a high-level file tree followed by the contents of the most critical files. RepoContext automates this process by heuristically ranking files and generating a plain-text Markdown export."
        }
      },
      {
        "@type": "Question",
        name: "Can I prepare a private repository for ChatGPT?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. RepoContext supports private repositories through GitHub Personal Access Tokens (PAT), allowing you to securely generate structured context for ChatGPT without exposing your code."
        }
      }
    ]
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to prepare codebase for chatgpt",
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
          How to Prepare Any Codebase for ChatGPT
        </h1>
        
        <p className="lead text-lg text-muted-foreground mb-8">
          To get the best results from tools like ChatGPT, you need to provide clear, deterministic repository context. In this guide, we cover how to prepare codebase for chatgpt using RepoContext.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">Why Raw Code Causes Problems for ChatGPT</h2>
        <p className="mb-4">
          When working with complex codebases, pasting raw files or relying on broad prompts often leads to missed dependencies and degraded output. To get reliable results from ChatGPT, you need to supply a structured, high-signal map of your repository.
        </p>
        <p className="mb-8">
          This means filtering out the noise: large lockfiles, build artifacts, and trivial configuration. RepoContext is designed to heuristically surface the directory hierarchy and the most critical entry files.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">Step-by-Step: How to prepare codebase for chatgpt</h2>
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
            <strong>Export Context:</strong> Click the "Export for LLM" button. You will receive a Markdown document containing the file tree and top file contents, ready to be passed to ChatGPT.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold mt-10 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6 mb-12">
          <div>
            <h3 className="font-medium text-foreground">Why should I prepare my codebase before pasting it into ChatGPT?</h3>
            <p className="text-sm text-muted-foreground mt-1">ChatGPT has strict context window limits. Pasting raw codebases often results in truncated prompts or hallucinated responses. Preparing the codebase ensures only the most relevant, high-signal files and structures are analyzed.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground">How do I structure my codebase for ChatGPT?</h3>
            <p className="text-sm text-muted-foreground mt-1">The best approach is to provide a high-level file tree followed by the contents of the most critical files. RepoContext automates this process by heuristically ranking files and generating a plain-text Markdown export.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Can I prepare a private repository for ChatGPT?</h3>
            <p className="text-sm text-muted-foreground mt-1">Yes. RepoContext supports private repositories through GitHub Personal Access Tokens (PAT), allowing you to securely generate structured context for ChatGPT without exposing your code.</p>
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
