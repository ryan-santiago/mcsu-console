"use client";

import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markNotificationsRead } from "@/server/notifications/actions";

export function MarkAllReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markNotificationsRead({});
          if (!result.ok) {
            toast.error(result.message ?? "Couldn't update notifications.");
            return;
          }
          router.refresh();
        })
      }
    >
      <CheckCheck aria-hidden /> Mark all read
    </Button>
  );
}
