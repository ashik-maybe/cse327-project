# Local demo

Start PostgreSQL, run the migrations and seed, then start the backend and
frontend as described in the root [`README.md`](../README.md).

## Walkthrough

1. Open <http://localhost:3000/login>.
2. Select **Volunteer** (`volunteer@campbridge.local` / `demo1234`).
3. Show the dashboard summary and case list.
4. Create a case: use a Bangla sample or pasted text, run AI intake, apply the
   English summary and triage, then save. Open it to show details and notes.
5. Open **Safety** to submit a report; anonymize the original note to fill the
   description.
6. Open **Map** to show the interactive Leaflet map: filter service points
   by category, open a marker's details, and follow the external directions
   link.
7. Sign out and sign in as **Team lead**
   (`lead@campbridge.local` / `lead1234`) to show the role-aware view: the real
   dashboard team queue, case assignment from the case detail page, and
   service-point management at `/map/manage`.

The login screen has buttons that fill the seeded demo credentials.

## Scope note

The current demo covers the repaired Milestones 1–5 core flows plus Milestone
7: the interactive Leaflet map with category filters, marker details, and
external directions, lead service-point management at `/map/manage`, case
assignment from the case detail page, and the real dashboard team queue.
Milestone 8 adds an offline case queue: when you are offline (or the create
request fails with a network error), a new case is stored locally in the
browser instead of being sent, and the form shows "Queued — will sync when
online" before returning to the case list. Queued cases replay automatically
on reconnect (on mount and on the browser `online` event) through the normal
`POST /api/cases` path, which dedupes on `(created_by, client_id)`, so a
replayed case is never duplicated; the header shows an offline badge and a
pending-count while the queue has items. Milestone 6 adds AI intake, triage,
and anonymization with a deterministic fallback when no API key is set; as a
team lead, update a safety report status from the Safety page.
