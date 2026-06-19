import { Metadata } from "next";
import { StructuredData } from "@/components/structured-data";

export const metadata: Metadata = {
  title: "How to Generate llms.txt from Any GitHub Repo | RepoContext",
  description: "Learn how to generate llms.txt from any github repo securely and quickly using RepoContext.",
  keywords: ["generate llms.txt from github", "repocontext", "ai coding"],
  alternates: {
    canonical: "https://repocontext.ajaymathuriya.com/blog/generate-llms-txt-github",
  },
  openGraph: {
    title: "How to Generate llms.txt from Any GitHub Repo",
    description: "Learn how to generate llms.txt from any github repo securely and quickly using RepoContext.",
    type: "article",
    url: "https://repocontext.ajaymathuriya.com/blog/generate-llms-txt-github",
    authors: ["Ajay Mathuriya"],
  },
};

export default function BlogPost() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Generate llms.txt from Any GitHub Repo",
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
        name: "What makes RepoContext ideal for generate llms.txt from github?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "RepoContext strips away the noise from standard GitHub repositories, leaving only structured, relevant data. This reduces context window usage and significantly improves the output quality for generate llms.txt from github."
        }
      },
      {
        "@type": "Question",
        name: "What is the llms.txt standard?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The llms.txt standard is a convention for providing AI models with a standardized, readable map of a project's documentation, architecture, and core files, similar to a robots.txt for AI."
        }
      },
      {
        "@type": "Question",
        name: "How can I generate an llms.txt file from a GitHub repo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Using RepoContext, you can analyze any GitHub repository and use the 'Export for LLM' feature. The resulting Markdown export functions perfectly as a comprehensive llms.txt file for your project."
        }
      },
      {
        "@type": "Question",
        name: "Does generating an llms.txt require AI processing?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. RepoContext generates the context entirely heuristically based on repository structure, ensuring deterministic, fast, and secure output without sending your code to third-party AI APIs."
        }
      }
    ]
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to generate llms.txt from github",
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
          How to Generate llms.txt from Any GitHub Repo
        </h1>
        
        <p className="lead text-lg text-muted-foreground mb-8">
          Mastering the art of providing context to AI tools like llms.txt standard is the key to unlocking 10x developer productivity. In this guide, we explore how to seamlessly generate llms.txt from github using RepoContext.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">Why Context Matters for llms.txt standard</h2>
        <p className="mb-4">
          Large Language Models are incredibly powerful, but they are bounded by their context windows. When working with complex codebases, simply pasting raw files or relying on broad prompts leads to hallucination, missed dependencies, and degraded output. To truly leverage llms.txt standard, you must supply it with a structured, high-signal map of your repository.
        </p>
        <p className="mb-8">
          This means filtering out the noise: node_modules, massive lockfiles, and irrelevant build artifacts. Instead, AI needs to see the directory hierarchy, the most critical entry files, and the underlying architectural patterns. This is exactly what RepoContext is designed to provide.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">Step-by-Step: How to generate llms.txt from github</h2>
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
            <strong>Export Context:</strong> Click the "Export for LLM" button in the upper right corner. You now have a perfectly structured Markdown document optimized for llms.txt standard.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold mt-10 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6 mb-12">
          <div>
            <h3 className="font-medium text-foreground">What is the llms.txt standard?</h3>
            <p className="text-sm text-muted-foreground mt-1">The llms.txt standard is a convention for providing AI models with a standardized, readable map of a project's documentation, architecture, and core files, similar to a robots.txt for AI.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground">How can I generate an llms.txt file from a GitHub repo?</h3>
            <p className="text-sm text-muted-foreground mt-1">Using RepoContext, you can analyze any GitHub repository and use the "Export for LLM" feature. The resulting Markdown export functions perfectly as a comprehensive llms.txt file for your project.</p>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Does generating an llms.txt require AI processing?</h3>
            <p className="text-sm text-muted-foreground mt-1">No. RepoContext generates the context entirely heuristically based on repository structure, ensuring deterministic, fast, and secure output without sending your code to third-party AI APIs.</p>
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
