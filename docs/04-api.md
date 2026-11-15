# API Endpoints

Base: /api. Auth: cookie session. Error format: { error: { message, code } }. List: { items, total, page, limit }.

Auth: POST /register, /login, /logout, GET /me.
Dashboard: GET /dashboard/summary (role-based counts).
Cases: GET /cases (scope=mine|team, filter/search), POST /cases (clientId for idempotency), GET /cases/:id, PATCH /cases/:id (team lead assigns; 404 NOT_FOUND when the case does not exist), GET /cases/:id/notes, POST /cases/:id/notes.
Users: GET /users/volunteers (lead only).
Safety: GET /safety, POST /safety (clientId idempotent), GET /safety/:id, PATCH /safety/:id (status update by lead).
Service points: GET /service-points (category filter, `includeInactive=true` for leads), POST /service-points (lead only), PATCH /service-points/:id, DELETE /service-points/:id.
AI: POST /ai/case-intake (banglaText, sampleId or audioBase64/audioMimeType), POST /ai/triage, POST /ai/anonymize, POST /ai/follow-up.
Health: GET /api/health.
