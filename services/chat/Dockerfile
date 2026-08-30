FROM node:22-alpine AS builder

WORKDIR /app/services/chat

COPY services/chat/package.json services/chat/package-lock.json* ./
RUN npm install

COPY services/shared/ /app/services/shared/
RUN cd /app/services/shared && npm install
COPY services/tsconfig.base.json /app/services/tsconfig.base.json
COPY services/chat/ ./

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
RUN npx tsc

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/services/chat/package.json ./package.json
COPY --from=builder /app/services/chat/node_modules ./node_modules
COPY --from=builder /app/services/chat/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 && \
    chgrp -R 0 /app && chmod -R g=u /app

USER 1001

EXPOSE 4005
CMD ["node", "dist/chat/src/index.js"]
