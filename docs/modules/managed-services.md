# Managed Services (stub, Phase 3)

## Purpose
Ticketing for ongoing support contracts: intake, triage, assignment, SLA timers, resolution, and reporting.

## Proposed shape (to confirm in the discovery workshop, [Q11](../08-open-questions.md))
- **Service contract** linked to an S3P Project (engagement type *Managed Services*). It holds SLA tiers (response and resolution targets per priority), coverage hours, and the client contacts allowed to raise tickets.
- **Ticket:** code `MS-<n>`, contract, category, priority (P1–P4), status (New → Triaged → In Progress → Waiting on Client → Resolved → Closed), assignee, team, SLA due timestamps (business-hours aware), comments (internal/public), attachments.
- **Queues** per team, scoped exactly like One-Lot: TEAM = teams assigned to the contract's S3P project.
- **Permissions** (already reserved in the catalog): `ticket.view`, `ticket.create`, `ticket.update`, `ticket.assign`, `ticket.close`.
- **Client sign-in:** email + password or an emailed sign-in link. No client code at login ([ADR 0009](../adr/0009-staff-and-client-accounts.md)).
- **Email-to-ticket (optional, deferred):** a shared support mailbox is polled via Graph. The sender is matched to a Client Contact by email (or a domain on the Client record). A ticket is created without needing an account, and replies thread back into the ticket.
- **Client portal:** staff invite client contacts (Client → Contacts → Invite). They become `CLIENT` users who can log in, raise and track their company's tickets, and see nothing else ([ADR 0009](../adr/0009-staff-and-client-accounts.md), [RBAC §5a](../03-rbac.md#5a-client-users-phase-3)).
- Later: CSAT surveys.

## Open questions
SLA definitions, business calendar and holidays, escalation matrix, reporting KPIs. (Client login is decided: invited client users, ADR 0009.)
