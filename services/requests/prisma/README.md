# `prisma/` — requests database

Schema for `daddy_requests` (posts and quotes). `ServiceRequest.unlisted` excludes a post from the public teaser; sellers still see it when signed in. Optional `street` / `floor` / `preferredWindow` / `photos` sit on the request; the service blanks `street` for sellers until their quote is accepted.
