# 0008 · Hosting on Vercel + Neon in Singapore

**Status:** Superseded by [0011](0011-aws-ec2-rds.md) · 2026-10-22

## Decision
- **App:** Vercel, function region **`sin1` (Singapore)**, set in `vercel.json` (`"regions": ["sin1"]`).
- **Database:** Neon project in **`aws-ap-southeast-1` (Singapore)**, in the same region as the functions for low latency. Branches: `main` (prod), `dev`, plus an automatic branch per PR preview (Neon ↔ Vercel integration).
- **Cron:** Vercel Cron, with schedules in Asia/Manila business terms converted to UTC.

## Consequences
- ➕ Lowest latency for Philippine users among the managed options, with zero-ops deploys and preview environments per PR.
- ➖ Data residency is Singapore, not the Philippines. **Accepted 2026-10-22:** neither provider offers a Philippine region. Document the cross-border transfer in the privacy notice (RA 10173) and in client contracts where required.
