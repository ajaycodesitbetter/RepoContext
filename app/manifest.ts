import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RepoContext",
    short_name: "RepoContext",
    description:
      "Convert any GitHub repository into a structured context brief. Surface top files, health signals, and Markdown exports for Claude Code, Cursor, and Gemini CLI. No AI, no signups.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#f59e0b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
