import { Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** 403 from requirePermission() (forbidden()). */
export default function Forbidden() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <Lock className="size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-semibold tracking-tight">You don&apos;t have access</h1>
      <p className="text-sm text-muted-foreground">
        Your group doesn&apos;t include this page. Ask an administrator if you need it.
      </p>
      <Button asChild>
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </main>
  );
}
