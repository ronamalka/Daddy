FROM node:22-alpine AS builder

WORKDIR /app/services/gigs

COPY services/gigs/package.json services/gigs/package-lock.json* ./
RUN npm install

COPY services/shared/package.json services/shared/package-lock.json* /app/services/shared/
RUN cd /app/services/shared && npm install
COPY services/shared/ /app/services/shared/
COPY services/tsconfig.base.json /app/services/tsconfig.base.json
COPY services/gigs/ ./

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
RUN npx tsc

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/services/gigs/package.json ./package.json
COPY --from=builder /app/services/shared/node_modules ./node_modules
COPY --from=builder /app/services/gigs/node_modules ./node_modules
COPY --from=builder /app/services/gigs/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 && \
    chgrp -R 0 /app && chmod -R g=u /app

USER 1001

EXPOSE 4002
CMD ["node", "dist/gigs/src/index.js"]
