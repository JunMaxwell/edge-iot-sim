FROM oven/bun:1.3.14-alpine AS installer
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/ packages/
COPY apps/simulator/ apps/simulator/
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN bun install --frozen-lockfile --backend=copyfile

WORKDIR /app/packages/shared-types
RUN bun build ./src/index.ts --outfile ./dist/index.js --format=cjs --target=node

WORKDIR /app/apps/simulator
RUN bun run build

FROM node:22-alpine
WORKDIR /app

COPY --from=installer /app/node_modules/.bun ./node_modules/.bun
COPY --from=installer /app/packages ./packages
COPY --from=installer /app/apps/simulator/node_modules ./apps/simulator/node_modules
COPY --from=installer /app/apps/simulator/dist ./apps/simulator/dist

WORKDIR /app/apps/simulator

CMD ["node", "dist/index.js"]
