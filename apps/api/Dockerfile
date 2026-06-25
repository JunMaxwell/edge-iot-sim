FROM oven/bun:1.3.14-alpine
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/ packages/
COPY apps/api/ apps/api/
COPY apps/simulator/package.json apps/simulator/package.json
RUN mkdir -p apps/web && echo '{"name":"@repo/web","version":"0.0.0","private":true}' > apps/web/package.json

RUN bun install --frozen-lockfile

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["bun", "src/main.ts"]
