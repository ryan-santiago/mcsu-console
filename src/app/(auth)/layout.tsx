import Link from "next/link";
import { AuthHero, AuthHeroBand } from "@/components/auth/auth-hero";
import { Logo } from "@/components/brand/logo";
import { ThemeMenu } from "@/components/layout/theme-menu";

/**
 * Sign-in / register / password screens. Desktop: form left, brand stage right.
 * Phones/tablets: brand band on top, form on a sheet that overlaps it (docs/09 §2).
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="relative flex min-h-dvh flex-col">
        <AuthHeroBand />
        {/* Phones: theme toggle floats in the brand band's corner; desktop: header row. */}
        <header className="absolute top-[max(1.25rem,env(safe-area-inset-top))] right-3 z-10 flex items-center justify-between text-hero-foreground lg:static lg:px-10 lg:pt-8 lg:text-foreground">
          <Link href="/login" className="hidden lg:block" aria-label="MCSU Console">
            <Logo className="w-44" />
          </Link>
          <div className="lg:ml-auto">
            <ThemeMenu />
          </div>
        </header>

        <div className="relative -mt-8 flex flex-1 flex-col rounded-t-3xl border-t bg-background shadow-[0_-12px_32px_-12px_rgb(0_0_0/0.35)] lg:mt-0 lg:rounded-none lg:border-t-0 lg:shadow-none">
          <main className="flex flex-1 items-center justify-center px-6 py-8 sm:px-10">
            <div className="w-full max-w-[400px]">{children}</div>
          </main>

          <footer className="flex flex-col items-center gap-1 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground sm:flex-row sm:justify-between lg:px-10">
            <span>QSERV – MCSU · Questronix</span>
            <span>Need help? Contact your department administrator.</span>
          </footer>
        </div>
      </div>

      <AuthHero className="sticky top-0 hidden h-dvh border-l border-border lg:flex" />
    </div>
  );
}
