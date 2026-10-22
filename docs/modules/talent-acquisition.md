# Talent Acquisition (stub, Phase 2b)

> Stub: confirm against mcsu-app before Phase 2b starts (Q12).

## Purpose
Open job requisitions, track candidates through the hiring pipeline, and turn a hired candidate into an Employee record.

## Proposed shape
- `JobRequisition` (Job Profile, team, client/project if it's for a deployment, headcount, status) + `Candidate` (name, contact, resume via `DocumentStorage`, source) + `Application` (stage: Sourced → Screening → Technical → Client interview → Offer → Hired | Rejected).
- A Kanban-style pipeline per requisition. "Hire" pre-fills the Employee create form.
- Notifications: `requisition.opened`, `application.stage_changed` (to the hiring Team Lead).
- Proposed permissions: `recruitment.view` (S), `recruitment.manage` (S).
- **Personal data:** candidate data falls under RA 10173. Define retention (e.g. delete rejected candidates after 1 year).

## Open questions
Who owns recruitment (HR or the department)? Are client interviews tracked? What's the retention period?
