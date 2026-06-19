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
          text: "The best approach is to provide a high-level file tree followed by the contents of the most critical files. RepoContext automates this entire process by heuristically ranking files and generating a ChatGPT-ready prompt."
        }
      },
      {
        "@type": "Question",
        name: "Can I prepare a private repository for ChatGPT?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. RepoContext supports private repositories through GitHub Personal Access Tokens (PAT), allowing you to securely generate structured context for ChatGPT without exposing your code publicly."
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
          Mastering the art of providing context to AI tools like ChatGPT is the key to unlocking 10x developer productivity. In this guide, we explore how to seamlessly prepare codebase for chatgpt using RepoContext.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">Why Context Matters for ChatGPT</h2>
        <p className="mb-4">
          Large Language Models are incredibly powerful, but they are bounded by their context windows. When working with complex codebases, simply pasting raw files or relying on broad prompts leads to hallucination, missed dependencies, and degraded output. To truly leverage ChatGPT, you must supply it with a structured, high-signal map of your repository.
        </p>
        <p className="mb-8">
          This means filtering out the noise: node_modules, massive lockfiles, and irrelevant build artifacts. Instead, AI needs to see the directory hierarchy, the most critical entry files, and the underlying architectural patterns. This is exactly what RepoContext is designed to provide.
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
            <strong>Generate Brief:</strong> Wait a few seconds for RepoContext to deterministically parse the repository. It uses zero AI, guaranteeing lightning-fast and secure results.
          </li>
          <li>
            <strong>Export Context:</strong> Click the "Export for LLM" button in the upper right corner. You now have a perfectly structured Markdown document optimized for ChatGPT.
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
            <p className="text-sm text-muted-foreground mt-1">The best approach is to provide a high-level file tree followed by the contents of the most critical files. RepoContext automates this entire process by heuristically ranking files and generating a ChatGPT-ready prompt.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Can I prepare a private repository for ChatGPT?</h3>
            <p className="text-sm text-muted-foreground mt-1">Yes. RepoContext supports private repositories through GitHub Personal Access Tokens (PAT), allowing you to securely generate structured context for ChatGPT without exposing your code publicly.</p>
          </div>
        </div>

        <div className="bg-muted/30 border border-border rounded-xl p-6 text-center mt-12">
          <h2 className="text-xl font-semibold mb-2">Ready to supercharge your workflow?</h2>
          <p className="text-muted-foreground mb-4">Experience instant repository analysis without signups.</p>
          <a href="https://repocontext.ajaymathuriya.com" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Try RepoContext Now
          </a>
        </div>
      </article>
    </div>
  );
}
