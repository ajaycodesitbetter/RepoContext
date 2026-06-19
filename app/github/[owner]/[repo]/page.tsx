import { Metadata } from "next";
import Link from "next/link";
import { getBriefForUrl } from "@/lib/github/service";

type Props = {
  params: { owner: string; repo: string };
};

export async function generateStaticParams() {
  const seeds = [
    { owner: "facebook", repo: "react" },
    { owner: "vercel", repo: "next.js" },
    { owner: "microsoft", repo: "vscode" },
    { owner: "langchain-ai", repo: "langchain" },
    { owner: "openai", repo: "openai-python" },
    { owner: "supabase", repo: "supabase" },
    { owner: "shadcn-ui", repo: "ui" },
    { owner: "tiangolo", repo: "fastapi" },
    { owner: "expressjs", repo: "express" },
    { owner: "ajaycodesitbetter", repo: "RepoContext" },
  ];
  return seeds;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, repo } = params;
  const result = await getBriefForUrl(`${owner}/${repo}`, null);

  let description = `${owner}/${repo} GitHub Repository. Explore the repository with RepoContext — get structured context in seconds.`;
  if (result.ok && result.data.meta.description) {
    description = `${result.data.meta.description}. Explore ${owner}/${repo} with RepoContext — get structured context in seconds.`;
  }

  const url = `https://repocontext.ajaymathuriya.com/github/${owner}/${repo}`;

  return {
    title: `${repo} — GitHub Repository Brief | RepoContext`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${repo} — GitHub Repository Brief | RepoContext`,
      description,
      url,
      type: "website",
    },
  };
}

export default async function RepoLandingPage({ params }: Props) {
  const { owner, repo } = params;
  const result = await getBriefForUrl(`${owner}/${repo}`, null);

  if (!result.ok) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">{owner}/{repo}</h1>
        <p className="text-muted-foreground mb-8">Unable to fetch detailed repository data right now.</p>
        <Link href={`/?q=${owner}/${repo}`} className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Explore full brief →
        </Link>
      </div>
    );
  }

  const { meta, health, topFiles } = result.data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-border bg-card/10 backdrop-blur-sm p-8 text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-foreground">{meta.repo}</h1>
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">{meta.description || "No description provided."}</p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="bg-muted px-4 py-2 rounded-full text-sm font-mono text-muted-foreground">★ {meta.stars} Stars</div>
          <div className="bg-muted px-4 py-2 rounded-full text-sm font-mono text-muted-foreground">⑂ {meta.forks} Forks</div>
          <div className="bg-muted px-4 py-2 rounded-full text-sm font-mono text-muted-foreground">Code: {meta.language || "Unknown"}</div>
          {health && <div className="bg-muted px-4 py-2 rounded-full text-sm font-mono text-muted-foreground">Status: {health.activityStatus}</div>}
        </div>

        <Link href={`/?q=${owner}/${repo}`} className="inline-block rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
          Explore full brief →
        </Link>
      </div>

      <h2 className="text-2xl font-semibold mb-4 text-foreground">Top Files</h2>
      <div className="rounded-xl border border-border bg-card/10 overflow-hidden">
        <ul className="divide-y divide-border">
          {topFiles.slice(0, 5).map((file: any) => (
            <li key={file.path} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
              <div className="font-mono text-sm text-foreground">{file.path}</div>
              <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
