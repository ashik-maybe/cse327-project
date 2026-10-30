# Local demo

Start PostgreSQL, run the migrations and seed, then start the backend and
frontend as described in the root [`README.md`](../README.md).

## Walkthrough

1. Open <http://localhost:3000/login>.
2. Select **Volunteer** (`volunteer@campbridge.local` / `demo1234`).
3. Show the dashboard summary and case list.
4. Create a case, then open it to show details and notes.
5. Open **Safety** to submit a safety report.
6. Open **Map** to show available service points.
7. Sign out and repeat with **Team lead**
   (`lead@campbridge.local` / `lead1234`) to show the role-aware view.

The login screen has buttons that fill the seeded demo credentials.

## Scope note

The current demo covers the repaired Milestones 1–5 core flows. AI intake and
triage, full interactive map management, offline sync, and final polish remain
deferred.
