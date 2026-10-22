# Employee Recommendation (stub, Phase 2b)

> Stub: confirm against mcsu-app's Employee Recommendation module before Phase 2b starts (Q12).

## Purpose
Team Leads recommend **salary increases, promotions and regularization** for their team members, and Managers/Admins decide. This is where Team Leads use their `employee.view_compensation@TEAM` access (Q9).

## Proposed shape
- `EmployeeRecommendation`: employee, type (`SALARY_INCREASE`, `PROMOTION`, `REGULARIZATION`), proposed position/level/employment type/salary, effective date, justification, status `DRAFT → SUBMITTED → APPROVED | REJECTED`.
- On approval, a new `EmployeeEmployment` record is created from the proposal (same transaction, audited).
- Notifications: `recommendation.submitted` (ACTION → approvers in scope), `recommendation.decided` (INFO → recommender).
- Proposed permissions: `recommendation.create` (S, Team Lead@TEAM), `recommendation.approve` (S, Manager/Admin@ALL). The approver can't approve their own recommendation.

## Open questions
Approval levels (one or two?), whether HR must be involved, regularization timing rules (e.g. 6 months probation), and whether the employee is notified.
