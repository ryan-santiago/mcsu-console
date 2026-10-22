# One-Lot Projects (delivery workspace)

## Purpose
JIRA-like delivery for projects we build or implement end-to-end. A One-Lot workspace links **one or more S3P projects** (e.g. Implementation + Maintenance) handled by the same team(s).

## Routes
- `/one-lot`: list of visible workspaces (cards with progress)
- `/one-lot/new`: name, key (e.g. `BDO`), description, **linked S3Ps (≥1)**, initial members
- `/one-lot/[id]/summary`: stat cards, status overview, priority breakdown, types of work, team workload, active sprint burndown, velocity, recent activity, members, linked S3Ps
- `/one-lot/[id]/backlog`: sprints + backlog lists, drag to reorder or move between sprints
- `/one-lot/[id]/board`: kanban for the active sprint (configurable columns, WIP limits)
- `/one-lot/[id]/calendar`: work items by due date
- `/one-lot/[id]/documents`: folder tree, upload, rename, move

The pages and components to port are mapped in mcsu-app `src/components/one-lot-projects/**` and `src/server/one-lot-projects/**`.

## Permissions & scope
| Key | Scoped | Allows |
|---|---|---|
| `onelot.view` | ✅ | See the workspace (TEAM = linked S3P's teams ∩ led teams; OWN = member) |
| `onelot.create` | — | Create a workspace (must link S3Ps the user can `project.view`) |
| `onelot.manage` | ✅ | Settings, members, S3P links, sprints (create/start/complete), board columns |
| `onelot.work` | ✅ | Create/edit work items, move cards, comment, upload documents |
| `onelot.delete` | — | Delete or archive a workspace |

**Membership:** an `OWNER` member is granted manage-level actions inside that workspace even without `onelot.manage` (it's a resource-level role). `MEMBER` gets work-level actions and `VIEWER` is read-only. The effective right is the **union** of the group grant (in scope) and the membership role.

## Data
`OneLotProject`, `OneLotProjectLink`, `OneLotMember`, `Sprint`, `BoardColumn`, `WorkItem`, `WorkItemComment`, `OneLotDocument`.

## Business rules
- At least one S3P link is required. Unlinking the last one is refused.
- One active sprint per workspace (partial unique index). Completing a sprint offers to move unfinished items to the backlog or the next sprint.
- Work item codes are `<KEY>-<n>`. They're immutable and unique per workspace.
- Types: Epic, Story, Task, Bug, Subtask. Subtasks need a parent. An Epic groups Stories and Tasks.
- Moving to an `isDone` column sets `doneAt`; moving out clears it.
- Ordering uses fractional indexes (one-row updates). Moves are optimistic and roll back on error.
- Assignees must be workspace members.
- Rich text is sanitized on save. Mentions (`@user`) notify (Phase 2.6).

## Acceptance criteria
- [ ] Creating a workspace without an S3P link fails on the server.
- [ ] A lead of a team assigned to a linked S3P sees the workspace without being a member.
- [ ] Two users dragging cards at the same time don't corrupt ordering.
- [ ] The burndown and velocity numbers match a fixture-based unit test.
