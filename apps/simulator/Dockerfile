FROM oven/bun:1.3.14-alpine
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/ packages/
COPY apps/simulator/ apps/simulator/
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN bun install --frozen-lockfile

WORKDIR /app/apps/simulator

CMD ["bun", "src/index.ts"]
