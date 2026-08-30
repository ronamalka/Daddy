# `chat/` — messages service (port 4005)

Direct messages and order threads.

- `src/chat.ts` — send, list, conversations, mark read (no HTTP)
- `src/repo.ts` — Prisma implementation of `MessageRepo`
- `src/routes/messages.ts` — Express wrapper around `chat.ts`
