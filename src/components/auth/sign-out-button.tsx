"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/** Signs out, then clears client caches (service worker + offline drafts arrive in 1.2b). */
export async function signOutEverywhereLocal() {
  await authClient.signOut();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.controller?.postMessage({ type: "SIGN_OUT" });
  }
}

export function SignOutButton(props: Omit<ComponentProps<typeof Button>, "onClick">) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      {...props}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await signOutEverywhereLocal();
          router.replace("/login");
          router.refresh();
        })
      }
    >
      <LogOut aria-hidden /> Sign out
    </Button>
  );
}
