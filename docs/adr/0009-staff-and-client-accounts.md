# 0009 · Staff self-registration vs invited client accounts

**Status:** Accepted · 2026-10-22

## Context
Staff should self-register (ADR 0004), but open registration invites spam and stray sign-ups. Later, clients must be able to log in and raise Managed Services tickets, and they use their own email domains.

## Decision
- **Staff (`User.type = STAFF`):** self-register **only with an allowed domain** (`AppSetting auth.allowedEmailDomains`, default `["questronix.com.ph"]`), then go through approval as in ADR 0004.
- **Clients (`User.type = CLIENT`, Phase 3):** no self-registration. Staff with ticket-management rights **invite** a client contact from the Client record. The invite email sets a password. The user is bound to `clientId` and placed in the `Client Portal` group (rank 90).
- Client users can only hold `clientAllowed` permissions (ticket features), and every query they run is constrained to their own client (RBAC R12/R13).
- **Client sign-in = email + password** on the same login page as staff, with an optional **emailed sign-in link** (Better Auth `magicLink` plugin) so clients don't have to remember a password. **No Client Code or account number at login.** Each email maps to exactly one user, which is already bound to its client. The `Client Code` is shown on tickets and in the portal for reference only. If one contact ever serves several clients, add a post-login company switcher (not a code field).
- **Email:** all outbound mail (invites, password reset, sign-in links, ticket notifications) is sent through Microsoft Graph from **one sender shared mailbox** (`MAIL_SENDER`, e.g. reuse mcsu-app's sender or create `mcsu-console@questronix.com.ph`; no license needed). Restrict the app registration's `Mail.Send` to that mailbox only (Exchange application access policy / RBAC for Applications). Set a monitored `Reply-To` if the sender is a no-reply address.
- **Deferred (optional):** **email-to-ticket** via a `support@questronix.com.ph` shared mailbox, and a **no-account ticket form** (Client Code + email + one-time email code). Neither is needed for launch, and both can be added later without changing this model.

## Consequences
- ➕ The staff approval queue stays clean, while clients can still come in under control.
- ➕ One identity system (Better Auth) for staff and clients, so it's audited in one place.
- ➖ Client portal UX (a simpler shell with no sidebar of internal modules) is built in Phase 3.
