import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center text-center px-4">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
        Page not found
      </h1>
      <p className="mb-8 max-w-[450px] text-muted-foreground">
        We couldn't find the page you're looking for. Please check the URL or return to the homepage to explore a repository.
      </p>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Go back home
      </Link>
    </div>
  );
}
