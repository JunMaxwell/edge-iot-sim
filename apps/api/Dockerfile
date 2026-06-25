FROM oven/bun:1.3.14-alpine AS installer
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/ packages/
COPY apps/api/ apps/api/
COPY apps/simulator/package.json apps/simulator/package.json
COPY apps/web/package.json apps/web/package.json

RUN bun install --frozen-lockfile

WORKDIR /app/apps/api
RUN bun run build

FROM node:22-alpine
WORKDIR /app

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/api/dist ./dist

EXPOSE 4000

CMD ["node", "dist/main.js"]
