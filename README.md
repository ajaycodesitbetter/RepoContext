<div align="center">
  <h1>RepoContext</h1>
  <p><strong>Read any GitHub repo, in seconds</strong></p>
  
  [![Website](https://img.shields.io/badge/Website-repocontext.ajaymathuriya.com-blue?style=for-the-badge)](https://repocontext.ajaymathuriya.com)
  <br />

  ![Next.js](https://img.shields.io/badge/next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat-square&logo=typescript&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)
  ![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=flat-square&logo=vercel&logoColor=white)
</div>

## What is RepoContext?
RepoContext converts any public or private GitHub repository into a structured brief. It uses deterministic, heuristic-based analysis to surface the file tree and rank the files most worth reading first. No AI processing, no signups, no agents.

## Features
1. **Public Repo Brief** — Paste any GitHub URL or owner/repo to get a structured brief including project type, metadata, health signals, dependency risk, and open issues/PRs.
2. **Onboarding Brief** — Get a recommended starting reading order with top files ranked by importance via heuristic-based analysis (no AI).
3. **Full File Tree** — Browse the complete repository tree with directory expansion, supporting up to 28k+ entries.
4. **File Preview** — Inline 16KB preview of any file. Press ESC or click ✕ to close.
5. **Single File Download** — Download any file in its original format with one click, without needing a ZIP.
6. **Bulk File Download** — Checkbox multi-select on file rows, featuring a floating "Download Selected (N)" toolbar and ZIP archive generation.
7. **Copy as Markdown** — Copy the entire repository brief to your clipboard as a single Markdown document.
8. **Export for LLM** — Generate and export structured context specifically formatted for tools like Claude Code, Cursor, ChatGPT, Gemini CLI, and OpenClaw.
9. **Quick Download** — One-click download of the complete brief.
10. **Private Repo Access** — Support for private repositories via Personal Access Token (PAT).
11. **Repository Health Layer** — Insights into activity status, review pressure, community breadth, and open issues/PRs previews.
12. **GitHub API Counter** — Live display of your remaining GitHub rate limit.

## Use Cases
- **Developers** evaluating open-source projects before deciding to use or contribute to them.
- **Engineers** preparing codebase context for LLMs (Claude Code, Cursor, ChatGPT, Gemini CLI, OpenClaw).
- **Students** exploring and understanding unfamiliar codebases.
- **Teams** onboarding new members to existing code repositories.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- GitHub PAT (Optional, for private repos and higher rate limits)

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/ajaycodesitbetter/RepoContext.git
cd RepoContext
pnpm install
```

### Environment Setup
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```
Add your GitHub Personal Access Token (PAT) for expanded API limits:
```env
GITHUB_TOKEN=your_personal_access_token_here
```

### Running the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack
| Category | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Hosting** | Vercel |

## Contributing
We welcome contributions! Please open an issue on the [GitHub repository](https://github.com/ajaycodesitbetter/RepoContext/issues) to discuss proposed changes before submitting a pull request.

## License
Please refer to the LICENSE file in this repository if provided.
