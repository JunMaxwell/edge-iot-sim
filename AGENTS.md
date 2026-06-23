<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Package manager: use Bun

This project uses **Bun** as its package manager and script runner (`bun.lock` is the source of truth — there is no `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`). Always use Bun, never npm/yarn/pnpm:

- **Install deps**: `bun install` (never `npm install` — it would create a competing `package-lock.json`)
- **Add / remove a package**: `bun add <pkg>` / `bun add -d <pkg>` (dev) / `bun remove <pkg>`
- **Run scripts**: `bun run <script>` or the shorthand `bun dev`, `bun build`, `bun start`, `bun lint`, `bun test`
- **Run a one-off binary**: `bunx <pkg>` instead of `npx <pkg>`

Commit the updated `bun.lock` whenever dependencies change. Do not introduce another package manager's lockfile.

## Please refers to @.claude/frontend-code-style.md for frontend code style

## Please refers to @.claude/backend-code-style.md for backend code style

## DO NOT RELY ON useEffect

Discourage the usage of useEffect anywhere in the application

## Backend

API Backend (`apps/api`): uses **Bun**, **Socket.IO**, and **amqplib**

Simulator (`apps/simulator`): uses **Bun** and **amqplib**

Shared types (`packages/shared-types`): uses **Bun**

<!-- END:nextjs-agent-rules -->

## Production access: VPS behind a VPN

Production (databases, services) is **not reachable from a developer's local machine**. The prod network sits behind a VPS that is only accessible over the VPN, and the VPN can only be joined from a specific authorized machine. This means:

- **Do not attempt to run scripts, schema applies, or seeds against prod from this machine** — connections will fail. Hand the commands to the operator to run from the authorized machine instead.

---

Codex will review your output once you are done
