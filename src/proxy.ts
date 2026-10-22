import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge gate (docs/01-architecture.md). Runs per request with the runtime environment, so
 * environment checks work even though one image serves every environment (ADR 0014).
 * It only checks that a session COOKIE exists; it never makes authorization decisions.
 * Those happen on the server through src/lib/authz (requireUser / requirePermission).
 */

/** Pages reachable without a session cookie. */
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/two-factor"];

/** Lets server code build `?next=` redirects (see src/lib/authz/session.ts). */
const PATHNAME_HEADER = "x-mcsu-pathname";

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The /design reference page is never served in production (docs/05-design-system.md §8).
  if (pathname.startsWith("/design")) {
    return process.env.APP_ENV === "prod"
      ? new NextResponse(null, { status: 404 })
      : NextResponse.next();
  }

  const hasSession = getSessionCookie(request) !== null;

  if (!hasSession && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const headers = new Headers(request.headers);
  headers.set(PATHNAME_HEADER, pathname + search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Skip Next internals, API routes (they authorize themselves), and public files.
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|api/|brand/|icons/|favicon.ico|manifest.webmanifest|sw.js|robots.txt).*)",
  ],
};
