"use client";

import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Same-origin client: no baseURL needed (and no NEXT_PUBLIC_* variable, ADR 0014).
export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        const next = new URLSearchParams(window.location.search).get("next");
        // Plugin callback runs outside React, so useRouter() isn't available: hard navigation.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/two-factor${next ? `?next=${encodeURIComponent(next)}` : ""}`;
      },
    }),
  ],
});
