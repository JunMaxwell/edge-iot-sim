FROM oven/bun:1.3.14-alpine AS installer
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/ packages/
COPY apps/web/ apps/web/
COPY apps/api/package.json apps/api/package.json
COPY apps/simulator/package.json apps/simulator/package.json

RUN bun install --frozen-lockfile --backend=copyfile

WORKDIR /app/packages/shared-types
RUN bun build ./src/index.ts --outfile ./dist/index.js --format=cjs --target=node

WORKDIR /app/apps/web

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time.
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

RUN bun run build

FROM node:22-alpine
WORKDIR /app

# outputFileTracingRoot points to the monorepo root (/app inside Docker), so
# standalone output mirrors that layout: apps/web/server.js relative to /app.
COPY --from=installer /app/apps/web/.next/standalone /app
COPY --from=installer /app/apps/web/.next/static /app/apps/web/.next/static

WORKDIR /app/apps/web

ENV PORT=3003
ENV HOSTNAME=0.0.0.0

EXPOSE 3003

CMD ["node", "server.js"]
