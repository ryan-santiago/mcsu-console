import { Suspense } from "react";
import { Mark } from "@/components/brand/logo";
import { AppSidebar, SidebarNavSkeleton } from "@/components/layout/app-sidebar";
import { SearchButton } from "@/components/layout/search-button";
import {
  CommandMenuLoader,
  MobileTabsLoader,
  NotificationBellLoader,
  SidebarNavLoader,
  UserMenuLoader,
} from "@/components/layout/shell-loaders";
import { ThemeMenu } from "@/components/layout/theme-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The signed-in app shell (docs/05 §4, docs/09 §2). The frame is static and prerenders; every
 * user-dependent piece streams in behind its own <Suspense> (ADR 0015). Pages authorize
 * themselves with requirePermission() inside their own boundary (loading.tsx).
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <AppSidebar>
        <Suspense fallback={<SidebarNavSkeleton />}>
          <SidebarNavLoader />
        </Suspense>
      </AppSidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur md:px-4">
          <SidebarTrigger className="hidden md:inline-flex" />
          <Mark className="h-7 md:hidden" />
          <Separator orientation="vertical" className="mx-1 hidden h-5 md:block" />
          <SearchButton />
          <div className="ml-auto flex items-center gap-1">
            <ThemeMenu />
            <Suspense fallback={<Skeleton className="size-9 rounded-lg" />}>
              <NotificationBellLoader />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-9 w-9 rounded-full md:w-36" />}>
              <UserMenuLoader />
            </Suspense>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 pb-28 md:px-6 md:pb-10">
          {children}
        </div>
      </SidebarInset>
      <Suspense>
        <MobileTabsLoader />
      </Suspense>
      <Suspense>
        <CommandMenuLoader />
      </Suspense>
    </SidebarProvider>
  );
}
