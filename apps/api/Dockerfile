FROM oven/bun:1.3.14-alpine
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/ packages/
COPY apps/api/ apps/api/

RUN bun install --frozen-lockfile

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["bun", "src/main.ts"]
