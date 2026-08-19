FROM node:22-alpine AS builder

WORKDIR /app/services/users

COPY services/users/package.json services/users/package-lock.json* ./
RUN npm install

COPY services/shared/ /app/services/shared/
RUN cd /app/services/shared && npm install
COPY services/tsconfig.base.json /app/services/tsconfig.base.json
COPY services/users/ ./

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
RUN npx tsc

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/services/users/package.json ./package.json
COPY --from=builder /app/services/users/node_modules ./node_modules
COPY --from=builder /app/services/users/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 && \
    chgrp -R 0 /app && chmod -R g=u /app

USER 1001

EXPOSE 4001
CMD ["node", "dist/users/src/index.js"]
