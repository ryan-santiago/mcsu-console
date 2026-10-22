"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { useSyncExternalStore } from "react";
import { formatManila } from "@/lib/dates";

const subscribe = () => () => {};

/**
 * "5 minutes ago" with the absolute Manila time as a tooltip. Renders the absolute time on the
 * server (deterministic HTML) and switches to relative after hydration.
 */
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const date = new Date(iso);
  const absolute = formatManila(date, "MMM d, yyyy h:mm a");
  return (
    <time dateTime={iso} title={absolute} className={className}>
      {hydrated ? formatDistanceToNowStrict(date, { addSuffix: true }) : absolute}
    </time>
  );
}
