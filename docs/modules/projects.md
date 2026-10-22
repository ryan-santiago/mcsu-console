# Projects (S3P)

## Purpose
The commercial record of an engagement: S3P number, client, sales and solutions owners, dates, contract lines (price/cost → gross profit), and the **teams** delivering it.

## Routes
- `/projects`: list
- `/projects/new`
- `/projects/[id]`: tabs **Overview · Contract lines · Teams · Deployed employees · Linked One-Lots · Activity**

## Permissions & scope
| Key | Scoped | Notes |
|---|---|---|
| `project.view` | ✅ | TEAM = any assigned team is one the user leads (or OWN match) |
| `project.view_financials` | ✅ | Contract price, cost, gross profit, margin |
| `project.create` | — | |
| `project.update` | ✅ | Edit profile, lines, team assignment |
| `project.delete` | ✅ | Soft delete. Blocked while active deployments or One-Lot links exist |

**OWN match:** the user's employee has a deployment on the project, or the user is a member of a One-Lot linked to it.

## Screens
- **List:** S3P #, Name, Client, Engagement type, Teams (chips), Dates, Total contract price / Gross profit (only with financials), headcount deployed.
- **Detail:** overview card, contract lines table with a totals row (gross profit and margin % computed), a team assignment multi-select, deployed employees (scoped by `employee.view`), and linked One-Lot workspaces.

## Data
`Project`, `ProjectLine`, `ProjectTeam`, plus `EmployeeDeployment` and `OneLotProjectLink` for the related tabs.

## Business rules
- `s3pNumber` is unique. At least one team is required.
- The editor can only add or remove teams within their `project.update` scope. A Team Lead can't detach another team.
- Gross profit = Σ(contractPrice) − Σ(estimatedCost). It's never stored.

## Acceptance criteria
- [ ] A project assigned to Team A and Team B is visible to the leads of both teams.
- [ ] Financial columns are absent from the payload without `project.view_financials`.
- [ ] Deleting a project with active deployments is refused with a clear message.
