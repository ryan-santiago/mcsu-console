# 0011 · Host on AWS (EC2 + ALB + RDS PostgreSQL) in Singapore

**Status:** Accepted · 2026-10-22 · **Supersedes [0008](0008-hosting-vercel-neon-singapore.md)** and the Neon parts of [0001](0001-prisma-over-drizzle.md) and [0010](0010-docker-support.md).

## Context
ADR 0008 chose Vercel + Neon. The team decided to run the system on AWS instead (EC2 + RDS), to keep infrastructure within an AWS account it controls. Docker support (ADR 0010) already made the app portable.

## Decision
- **Region:** `ap-southeast-1` (Singapore). The data-residency acceptance (Q17) carries over.
- **Compute:** one EC2 Graviton instance per environment running the Docker `runner` image, behind an **Application Load Balancer** with an **ACM** certificate.
- **Database:** **RDS for PostgreSQL 17**, private subnets, encrypted, SSL enforced, automated backups with PITR.
- **Prisma driver:** **`@prisma/adapter-pg` only.** The Neon adapter and `DATABASE_DRIVER=neon` are removed. Local Docker, CI and AWS all use the same driver.
- **Delivery:** GitHub Actions (OIDC) → ECR → SSM Run Command deploy script. **Staging** deploys automatically on merge to `main`. **Production** deploys on release tags with manual approval.
- **Ops:** SSM Parameter Store for secrets, Session Manager for access (no SSH), CloudWatch logs and alarms, EventBridge API destinations for scheduled jobs, Terraform for infrastructure.
- Full design: [11-aws-deployment.md](../11-aws-deployment.md).

## Consequences
- ➕ Full control of infrastructure in the company's AWS account. One driver everywhere, so local Docker matches production.
- ➕ The Docker image, Microsoft 365 email and SharePoint integrations are unchanged.
- ➖ The team now owns HTTPS, deploys, patching, monitoring and backups (which Vercel/Neon handled before). This is mitigated by IaC, runbooks and alarms.
- ➖ No automatic per-PR preview environments. A shared **staging** environment replaces them.
- ➖ A single instance means short restarts during deploys. Two instances or blue/green can come later, and need a shared Next.js cache handler.
