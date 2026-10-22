"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Unexpected errors inside the app shell. Stack traces never reach the client (docs/07). */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <TriangleAlert className="mx-auto size-10 text-destructive" aria-hidden />
      <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        Try again. If it keeps happening, send this reference to the team:{" "}
        <code className="font-mono text-xs">{error.digest ?? "n/a"}</code>
      </p>
      <Button onClick={reset}>
        <RotateCcw aria-hidden /> Try again
      </Button>
    </div>
  );
}
