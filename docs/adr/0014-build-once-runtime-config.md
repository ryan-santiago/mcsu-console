# 0014 · Build the image once and promote it; public config at runtime

**Status:** Accepted · 2026-10-22 · *Amends [0010](0010-docker-support.md) and [11-aws-deployment.md §6](../11-aws-deployment.md#6-configuration--secrets).*

## Context
`NEXT_PUBLIC_*` variables are inlined at `next build`. With per-environment values (`NEXT_PUBLIC_APP_URL`, the VAPID public key), staging and production would need separate builds, so production would run an image that was never tested on staging. 11 §6 had left this decision for milestone 1.1.

## Decision
- **No `NEXT_PUBLIC_*` variables.** Public config (`APP_URL`, `VAPID_PUBLIC_KEY`) is read from `env` on the server at runtime and passed to client components as props, from the root layout or the component that needs it.
- CI builds the `runner` and `migrate` images **once**, on merge to `main` (`:<sha>`, `:<sha>-migrate`), and deploys them to staging.
- A release tag **copies those images by digest** into the prod account's ECR and deploys them. The prod pipeline never runs `docker build`, and it fails if that commit was never built for staging.

## Consequences
- ➕ What runs in production is byte-for-byte what was tested on staging.
- ➕ Faster prod deploys (no build step).
- ➖ Client components can't read `process.env.*` directly. A lint rule (`no-restricted-syntax` on `process.env` in `"use client"` files) enforces this.
