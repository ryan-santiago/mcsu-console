# 00 · Vision

## Why
MCSU (under QNX QSERV) runs three kinds of work for clients. Today it uses spreadsheets, email threads and the first-generation `mcsu-app`. `mcsu-app` proved the features, but its role/rank system was hard to reason about and could be bypassed (see [03-rbac.md § Lessons from mcsu-app](03-rbac.md#lessons-from-mcsu-app)).

**MCSU Console** is the rebuild. It keeps the same domain and has a secure, consistent permission model that every future module can reuse.

## Business lines

| Line | Description | Console capabilities |
|---|---|---|
| **Staff Augmentation** | Our employees are deployed to a client. We handle contracts, renewals and monthly reporting. | Employee records, deployment history, contract and renewal tracking, daily activity logs, **Monthly Activity Report** PDF |
| **One-Lot Project** | We deliver a whole project (development or implementation) for a client. | S3P (commercial) projects + One-Lot delivery workspace: backlog, sprints, kanban, calendar, documents, dashboards |
| **Managed Services** | Ongoing support with SLAs. | Tickets, queues, SLA timers, client contacts *(Phase 3)* |

## Personas

| Persona | Typical group | Needs |
|---|---|---|
| Department Head / Admin | Administrator (rank 10) | See everything, manage users and groups, approve |
| Manager / Unit Manager | Manager (rank 20) | All employees and projects, dashboards, renewals |
| Team Lead | Team Lead (rank 30) | **Only their team's** employees, projects and reports. Approve their team's items |
| Employee | Employee (rank 40) | Their own profile, activity reports, MAR, assigned work items |
| Viewer / Auditor | Viewer (rank 50) | Read-only |
| System owner | Super Admin (rank 0) | Break-glass full access. Exactly one or two people |

## Principles
1. **Least privilege by default.** A new user gets the `Employee` group (OWN scope) on approval.
2. **One way to authorize.** Permission + scope + rank, enforced on the server, the same in every module.
3. **Data with an audit trail.** Every change is recorded with who, when and what changed.
4. **Professional, calm UI.** Dense but readable, brand-consistent, light and dark, keyboard-friendly.
5. **Docs before code.** Modules are specified in `docs/modules/` before they're built.

## In scope / out of scope (v1)
- **In:** everything in Phases 1–2 of the [roadmap](06-roadmap.md).
- **Out (for now):** payroll, leave management, client-facing portal, mobile app, data migration from `mcsu-app` (fresh start, as decided).
