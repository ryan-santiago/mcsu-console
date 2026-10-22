import { CircleAlert, Inbox } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";
import { RelativeTime } from "@/components/notifications/relative-time";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/authz/session";
import { cn } from "@/lib/utils";
import { INBOX_PAGE_SIZE, listInbox } from "@/server/notifications/queries";

export const metadata: Metadata = { title: "Inbox" };

const TABS = [
  { value: "todo", label: "To do" },
  { value: "all", label: "Notifications" },
] as const;

export default async function InboxPage({ searchParams }: PageProps<"/inbox">) {
  const user = await requireUser();
  const params = await searchParams;
  const tab = params.tab === "all" ? "all" : "todo";
  const page = Math.max(1, Number(params.page) || 1);
  const { total, items } = await listInbox(user, tab, page);
  const pages = Math.max(1, Math.ceil(total / INBOX_PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Everything that needs your attention, and what happened while you were away."
        actions={<MarkAllReadButton />}
      />

      <div
        role="tablist"
        aria-label="Inbox"
        className="mb-4 inline-flex rounded-xl border bg-card p-1"
      >
        {TABS.map((t) => (
          <Link
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            href={t.value === "todo" ? "/inbox" : "/inbox?tab=all"}
            className={cn(
              "flex min-h-10 items-center rounded-lg px-4 text-sm font-medium",
              tab === t.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
          <Inbox className="mx-auto mb-2 size-8" aria-hidden />
          <p className="text-sm">
            {tab === "todo" ? "Nothing needs your attention right now." : "No notifications yet."}
          </p>
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                href={n.link ?? "/inbox"}
                className={cn(
                  "flex min-h-14 gap-3 px-4 py-3 hover:bg-muted/50",
                  !n.readAt && "bg-accent/40",
                )}
              >
                {n.kind === "ACTION" && !n.resolvedAt ? (
                  <CircleAlert
                    className="mt-0.5 size-4 shrink-0 text-warning"
                    aria-label="Needs action"
                  />
                ) : (
                  <span className="size-4 shrink-0" aria-hidden />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{n.title}</span>
                  {n.body ? (
                    <span className="block text-sm text-muted-foreground">{n.body}</span>
                  ) : null}
                </span>
                <RelativeTime
                  iso={n.createdAt}
                  className="shrink-0 text-xs text-muted-foreground"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 ? (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between">
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/inbox?tab=${tab}&page=${Math.max(1, page - 1)}`}
              className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
            >
              Previous
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/inbox?tab=${tab}&page=${Math.min(pages, page + 1)}`}
              className={page >= pages ? "pointer-events-none opacity-50" : undefined}
            >
              Next
            </Link>
          </Button>
        </nav>
      ) : null}
    </>
  );
}
