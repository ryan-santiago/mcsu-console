import { Logo } from "@/components/brand/logo";

/** Screens a signed-in user must pass before the app shell (2FA enrollment, R15). */
export default function GateLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-sm space-y-8">
        <Logo className="w-48" priority />
        {children}
      </div>
    </main>
  );
}
