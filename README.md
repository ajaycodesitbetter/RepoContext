# RepoContext

> Read any GitHub repo, in seconds

[![Live Website](https://img.shields.io/badge/Live-repocontext.ajaymathuriya.com-blue?style=for-the-badge)](https://repocontext.ajaymathuriya.com)
[![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](#)

## What is RepoContext?

RepoContext is a blazing-fast, fully deterministic web application designed to instantly parse and present the structure, health, and context of any GitHub repository. It requires no signups and uses absolutely no AI, giving developers an instant, objective heuristic-based onboarding brief for any codebase.

## Features

- **Public Repo Brief** — Paste any GitHub URL or owner/repo, get an instant structured brief: project type, metadata, health signals, dependency risk, open issues/PRs.
- **Onboarding Brief** — Start reading order, top files most worth reading first, heuristic-based (no AI).
- **Full File Tree** — Browse the complete repo tree with directory expansion and support for 28k+ entries.
- **File Preview** — Inline 16KB preview of any file. Press `ESC` or click ✕ to close. Truncated files show a "Showing first 16KB" notice.
- **Single File Download** — Download any file directly in its original format with one click, no ZIP required.
- **Bulk File Download** — Checkbox multi-select on file rows with a "Download Selected (N)" floating toolbar that downloads all selected files as a single ZIP archive.
- **Copy as Markdown** — Copy the entire repo brief as a Markdown document.
- **Export for LLM** — Export structured context explicitly optimized for LLMs like Claude, Cursor, ChatGPT, Gemini CLI, and OpenClaw.
- **Quick Download** — One-click brief download.
- **Private Repo Access** — Native support for private repositories using a GitHub Personal Access Token (PAT).
- **Repository Health Layer** — Insights into activity status, review pressure, community breadth, and open issues/PRs preview.
- **GitHub API Counter** — Live remaining rate limit display to manage API requests.

## Use Cases

- **Developers** evaluating open-source projects before integrating or contributing.
- **Engineers** preparing comprehensive codebase context to feed into LLMs.
- **Students** exploring unfamiliar repositories and learning repository structures.
- **Teams** rapidly onboarding new members to existing codebases.

## Getting Started

### Prerequisites
- **Node.js**: v18+
- **Package Manager**: pnpm
- **GitHub PAT**: A Personal Access Token for GitHub API access.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ajaycodesitbetter/RepoContext.git
   cd RepoContext
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root directory and add your GitHub token:
   ```env
   GITHUB_TOKEN=your_personal_access_token_here
   ```

4. **Start the Development Server:**
   ```bash
   pnpm dev
   ```
   Open `http://localhost:3000` with your browser to see the result.

## API Reference

RepoContext provides internal API routes used by the frontend to fetch repository data.

### `GET /api/brief`
Generates a structured brief for a given repository.

- **Parameters:**
  - `owner` (string): Repository owner.
  - `repo` (string): Repository name.
- **Response:** JSON object containing metadata, health signals, dependencies, and file tree.
- **Example cURL:**
  ```bash
  curl "http://localhost:3000/api/brief?owner=ajaycodesitbetter&repo=RepoContext"
  ```

### `GET /api/file`
Fetches file contents or triggers a direct download.

- **Parameters:**
  - `owner` (string): Repository owner.
  - `repo` (string): Repository name.
  - `path` (string): File path in the repository.
  - `branch` (string): Target branch.
  - `download` (boolean, optional): If `true`, sets `Content-Disposition` to `attachment`.
- **Response:** JSON object containing base64 encoded content (for previews) or raw file bytes (for downloads).
- **Example cURL:**
  ```bash
  curl "http://localhost:3000/api/file?owner=ajaycodesitbetter&repo=RepoContext&path=package.json&branch=main"
  ```

## Tech Stack

| Category         | Technology                 |
|------------------|----------------------------|
| **Framework**    | Next.js 14 (App Router)    |
| **Language**     | TypeScript                 |
| **Styling**      | Tailwind CSS v4            |
| **Hosting**      | Vercel                     |

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes. Ensure that your code passes all linting and typing checks before submitting.

## License

This project is licensed under the MIT License.
