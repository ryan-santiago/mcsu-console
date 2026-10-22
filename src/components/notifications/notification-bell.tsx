"use client";

import { Bell, CircleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { markNotificationsRead } from "@/server/notifications/actions";
import type { NotificationDTO } from "@/server/notifications/queries";
import { RelativeTime } from "./relative-time";

export function NotificationBell({
  unread,
  latest,
}: {
  unread: number;
  latest: NotificationDTO[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const markAll = () =>
    startTransition(async () => {
      await markNotificationsRead({});
      router.refresh();
    });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell aria-hidden />
          {unread > 0 ? (
            <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-signal px-1 text-[10px] font-semibold text-signal-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <Button variant="link" size="sm" disabled={pending || unread === 0} onClick={markAll}>
            Mark all read
          </Button>
        </div>
        {latest.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y">
              {latest.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link ?? "/inbox"}
                    onClick={() => {
                      setOpen(false);
                      if (!n.readAt) void markNotificationsRead({ ids: [n.id] });
                    }}
                    className={cn(
                      "flex gap-3 px-4 py-3 text-sm hover:bg-muted/60",
                      !n.readAt && "bg-accent/40",
                    )}
                  >
                    {n.kind === "ACTION" && !n.resolvedAt ? (
                      <CircleAlert
                        className="mt-0.5 size-4 shrink-0 text-warning"
                        aria-label="Needs action"
                      />
                    ) : (
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-transparent"
                        aria-hidden
                      />
                    )}
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="block font-medium">{n.title}</span>
                      {n.body ? (
                        <span className="block truncate text-muted-foreground">{n.body}</span>
                      ) : null}
                      <RelativeTime
                        iso={n.createdAt}
                        className="block text-xs text-muted-foreground"
                      />
                    </span>
                    {!n.readAt ? (
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-signal"
                        aria-label="Unread"
                      />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
        <div className="border-t p-2">
          <Button asChild variant="ghost" className="w-full" onClick={() => setOpen(false)}>
            <Link href="/inbox">Open inbox</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
