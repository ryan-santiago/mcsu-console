# 0007 · SharePoint for document storage

**Status:** Accepted · 2026-10-22

## Context
One-Lot documents, deployment contracts (SOW/PO) and frozen MAR PDFs need durable storage. The department already uses Microsoft 365, and mcsu-app already has a Graph client and a SharePoint integration.

## Decision
- Store files in a **SharePoint document library** through Microsoft Graph (app-only auth: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, plus `SHAREPOINT_SITE_ID` / `SHAREPOINT_DRIVE_NAME`).
- All access goes through a `DocumentStorage` interface (`put`, `get`, `move`, `rename`, `delete`, `stat`). There are two drivers: `local` (dev/test) and `sharepoint` (preview/prod).
- The database stores metadata (`storageKey` = Graph drive item id, name, mime, size). **Downloads are proxied** through an authorized route handler, so the console's scope rules apply. Users never get direct SharePoint links.
- Folder layout: `/<Module>/<Entity key>/…` (e.g. `/One-Lot/BDO/Design/…`, `/MAR/2026/10/<employee code>.pdf`).
- Upload size limit 50 MB. Files over 4 MB use Graph upload sessions.

## Consequences
- ➕ Files live in the company tenant, under existing retention and compliance rules.
- ➖ Graph rate limits and latency. Mitigated with retries plus backoff and by streaming downloads.
- ➖ The app registration needs `Sites.Selected` permission scoped to the one site (least privilege), granted by the M365 admin.
