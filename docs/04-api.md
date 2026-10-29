# API Endpoints

Base: /api. Auth: cookie session. Error format: { error: { message, code } }. List: { items, total, page, limit }.

Auth: POST /register, /login, /logout, GET /me.
Dashboard: GET /dashboard/summary (role-based counts).
Cases: GET /cases (scope=mine|team, filter/search), POST /cases (clientId for idempotency), GET /cases/:id, PATCH /cases/:id (team lead assigns), GET /cases/:id/notes, POST /cases/:id/notes.
Users: GET /users/volunteers (lead only).
Safety: GET /safety-reports, POST /safety-reports (clientId idempotent), GET /safety-reports/:id, PATCH /safety-reports/:id (status update by lead).
Service points: GET /service-points (category filter), POST /service-points (lead only), PATCH /service-points/:id, DELETE /service-points/:id.
AI: POST /ai/case-intake (bangla text/sample/audio + includeTriage), POST /ai/triage, POST /ai/anonymize, POST /ai/follow-up.
Health: GET /api/health.
