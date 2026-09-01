# `upload/`

`POST /api/upload` — image or PDF upload with type checks, size limits, and JPEG EXIF removal. Chat attachments, service-request photos, and job-completion photos must use the returned `/uploads/...` path; remote URLs are rejected. Request photos are images only (JPEG/PNG/WebP), up to four. Completion photos are the same types, 1–6, on mark-delivered. Opening that path (`GET /uploads/:filename`) is handled by `src/app/uploads/`.
