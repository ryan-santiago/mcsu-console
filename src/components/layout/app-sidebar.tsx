"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Logo, Mark } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import type { NavSection } from "@/lib/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { NavIconView } from "./nav-icon";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

/** The static frame: logo header + a slot for the (user-dependent) nav. */
export function AppSidebar({ children }: { children: ReactNode }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b px-3">
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="MCSU Console home">
          <Logo className="w-32 group-data-[collapsible=icon]:hidden" />
          <Mark className="hidden h-7 group-data-[collapsible=icon]:block" />
        </Link>
      </SidebarHeader>
      <SidebarContent>{children}</SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

/** Sections filtered by can() on the server (src/lib/navigation.ts). */
export function SidebarNav({
  sections,
  badges,
}: {
  sections: NavSection[];
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.title}>
          <SidebarGroupLabel className="text-[11px] tracking-wider uppercase">
            {section.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                const badge = badges?.[item.href];
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(pathname, item.href)}
                      tooltip={item.title}
                      className="data-[active=true]:shadow-[inset_2px_0_0_var(--sidebar-primary)]"
                    >
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <NavIconView name={item.icon} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {badge ? (
                      <SidebarMenuBadge className="rounded-full bg-signal text-signal-foreground">
                        {badge > 99 ? "99+" : badge}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

export function SidebarNavSkeleton() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {/* Fixed widths: shadcn's SidebarMenuSkeleton uses Math.random(), which breaks prerendering. */}
        {["70%", "55%", "80%", "60%", "65%"].map((width, i) => (
          <SidebarMenuItem key={i} className="flex h-8 items-center gap-2 px-2">
            <Skeleton className="size-4 rounded-md" />
            <Skeleton className="h-4" style={{ width }} />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
