# 0003 · S3P Project and One-Lot Project are separate, linked entities

**Status:** Accepted · 2026-10-21

## Context
An S3P Project is the commercial record (S3P number, client, contract lines, cost, teams). A One-Lot Project is the delivery workspace (backlog, sprints, board, documents). One delivery often covers several S3Ps, such as an Implementation S3P and a Maintenance S3P handled by the same team.

## Decision
Keep `Project` (S3P) and `OneLotProject` as separate models, linked many-to-many through `OneLotProjectLink`. A One-Lot **must have at least one** linked S3P, enforced in `createOneLot`/`unlinkProject` actions. One-Lot visibility under `TEAM` scope follows the teams of its linked S3Ps, plus explicit membership.

## Consequences
- ➕ Commercial data (financials) stays guarded separately from delivery data.
- ➕ Team-scope flows naturally: Team ⇄ S3P ⇄ One-Lot.
- ➖ Two screens to keep consistent. The One-Lot summary shows linked S3Ps with deep links.
