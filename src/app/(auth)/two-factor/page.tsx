import type { Metadata } from "next";
import { Suspense } from "react";
import { TwoFactorChallenge } from "@/components/auth/two-factor-challenge";

export const metadata: Metadata = { title: "Two-factor authentication" };

export default function TwoFactorPage() {
  return (
    <Suspense>
      <TwoFactorChallenge />
    </Suspense>
  );
}
