"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
        Something went wrong!
      </h2>
      <p className="text-muted-foreground mb-8 max-w-[500px]">
        An unexpected error occurred. We've been notified and are looking into it.
        In the meantime, please try again or return to the home page.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Go back home
        </button>
      </div>
    </div>
  );
}
