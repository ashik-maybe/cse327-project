# Offline Sync

Frontend: detect navigator.onLine. Queue case create/update mutations in Dexie (IndexedDB) with clientId UUID generated locally. Show pending badge.
Backend: POST /api/cases accepts clientId. If (created_by, client_id) exists → return existing, created:false. Else create new, 201.
Replay: when online, retry queued mutations one-by-one, remove synced.
Conflict: MVP = single-user edits, last-write-wins.
