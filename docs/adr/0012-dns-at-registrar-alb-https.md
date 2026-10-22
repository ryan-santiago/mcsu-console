# 0012 · DNS at the current provider, HTTPS on the ALB (no CloudFront, no Route 53)

**Status:** Accepted · 2026-10-22

## Context
CloudFront was added only to get HTTPS before a domain was chosen. A domain we control (e.g. one managed at Hostinger) can be used for staging now, and AWS Certificate Manager issues free certificates for any domain we can prove ownership of.

## Decision
- **No CloudFront** and **no Route 53** for now.
- DNS stays with the domain's current provider. We add two CNAME records per environment: the ACM validation record (kept permanently for auto-renewal) and the subdomain → ALB DNS name.
- The free **ACM certificate** (in `ap-southeast-1`) sits on the ALB's HTTPS listener. Port 80 redirects to 443.
- Subdomains only (`staging-console.<domain>`, `console.<domain>`). A bare domain would need Route 53 alias records.
- Staging uses a domain available now. The production domain is still decided at go-live (Q18), using the same method.

## Consequences
- ➕ Fewer moving parts: one entry point, no cache rules, and no need to lock the ALB to CloudFront.
- ➕ Everything in the request path stays in the Singapore region.
- ➖ DNS records are added by hand (not by Terraform). Whoever controls the DNS account must protect it with 2FA.
- ➖ No edge caching of static files. That's acceptable for a department app in the same region as its users. CloudFront or Route 53 can be added later without app changes.
