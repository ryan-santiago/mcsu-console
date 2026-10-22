# Announcements (stub, Phase 2b)

> Stub: confirm against mcsu-app before Phase 2b starts (Q12).

## Purpose
Department-wide or team-targeted announcements (policy updates, events, reminders) shown on the dashboard and delivered as notifications.

## Proposed shape
- `Announcement` (title, rich-text body (sanitized), audience: everyone or selected teams, publish/expire dates, pinned flag) + read receipts.
- Publishing creates an INFO notification `announcement.published` for the audience (in-app, plus email/push if the recipient opted in).
- Proposed permissions: `announcement.manage` (S: TEAM = only for teams you lead). Reading needs no permission; you see what's targeted at you.

## Open questions
Is "acknowledge required" needed for policy announcements? Are attachments needed?
