"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import type { NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { NavIconView } from "./nav-icon";

const ITEM =
  "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium";

/** Phone bottom tab bar (< md): permission-aware tabs + "More" (docs/09 §2). */
export function MobileTabs({ tabs, badges }: { tabs: NavItem[]; badges?: Record<string, number> }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
        const badge = badges?.[tab.href];
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(ITEM, active ? "text-primary" : "text-muted-foreground")}
          >
            <NavIconView name={tab.icon} className="size-5" />
            {tab.title}
            {badge ? (
              <span className="absolute top-2 left-1/2 ml-2 rounded-full bg-signal px-1.5 text-[10px] text-signal-foreground">
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
          </Link>
        );
      })}
      <button
        type="button"
        className={cn(ITEM, "text-muted-foreground")}
        onClick={() => setOpenMobile(true)}
      >
        <Menu className="size-5" aria-hidden />
        More
      </button>
    </nav>
  );
}
