# `src/` — chat service source

`index.ts` wires Prisma into `createMessagesRouter`. Business rules live in `chat.ts` so tests can use `createInMemoryRepo()`.
