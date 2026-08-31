# `upload/`

`POST /api/upload` — image or PDF upload with type checks, size limits, and JPEG EXIF removal. Chat attachments must use the returned `/uploads/...` path; remote URLs are rejected. Opening that path (`GET /uploads/:filename`) is handled by `src/app/uploads/`.
