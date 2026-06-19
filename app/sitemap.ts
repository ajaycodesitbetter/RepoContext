import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://repocontext.ajaymathuriya.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: "https://repocontext.ajaymathuriya.com/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://repocontext.ajaymathuriya.com/blog/repo-to-claude-code",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://repocontext.ajaymathuriya.com/blog/convert-github-repo-to-markdown",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://repocontext.ajaymathuriya.com/blog/repo-context-generator-cursor",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://repocontext.ajaymathuriya.com/blog/generate-llms-txt-github",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://repocontext.ajaymathuriya.com/blog/prepare-codebase-for-chatgpt",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
