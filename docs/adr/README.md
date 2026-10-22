# Architecture Decision Records

Short records of significant decisions. Format: Context → Decision → Consequences. Never edit an accepted ADR. Supersede it with a new one.

| # | Title | Status |
|---|---|---|
| [0001](0001-prisma-over-drizzle.md) | Prisma 7 instead of Drizzle | Accepted |
| [0002](0002-groups-rank-scoped-permissions.md) | Groups with inverted rank and scoped permissions | Accepted |
| [0003](0003-s3p-and-one-lot-separate.md) | S3P Project and One-Lot Project are separate, linked entities | Accepted |
| [0004](0004-self-registration-with-approval.md) | Self-registration with permission-based approval | Accepted |
| [0005](0005-fresh-start-no-migration.md) | Fresh start: no data migration from mcsu-app | Accepted |
| [0006](0006-no-cached-authz.md) | Authorization data is loaded per request, never cookie-cached | Accepted |
| [0007](0007-sharepoint-document-storage.md) | SharePoint for document storage | Accepted |
| [0008](0008-hosting-vercel-neon-singapore.md) | Hosting on Vercel + Neon in Singapore | Superseded by 0011 |
| [0009](0009-staff-and-client-accounts.md) | Staff self-registration vs invited client accounts | Accepted |
| [0010](0010-docker-support.md) | Docker support alongside Vercel | Accepted (amended by 0011) |
| [0011](0011-aws-ec2-rds.md) | Host on AWS (EC2 + ALB + RDS) in Singapore | Accepted |
| [0012](0012-dns-at-registrar-alb-https.md) | DNS at the current provider, HTTPS on the ALB (no CloudFront, no Route 53) | Accepted |
