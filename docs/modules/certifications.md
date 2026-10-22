# Certifications (stub, Phase 2b)

> Stub: confirm against mcsu-app before Phase 2b starts (Q12).

## Purpose
Track employees' professional certifications (vendor certs, licenses), with proof documents and expiry reminders. Useful for client proposals and staffing decisions.

## Proposed shape
- `Certification` lookup (name, vendor, validity in months) + `EmployeeCertification` (employee, certification, number, issued/expiry dates, document via `DocumentStorage`).
- Employee list filter "has certification X". Expiry reminder notification `certification.expiring` (ACTION → employee, INFO → team lead) at 60/30 days.
- Proposed permissions: `certification.view` (S), `certification.manage` (S). Employees can add their own (OWN).

## Open questions
Does HR verify uploads? Is a certification budget or reimbursement tracked?
