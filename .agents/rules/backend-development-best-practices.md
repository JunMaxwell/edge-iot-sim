---
trigger: always_on
---

# Backend Development Best Practices

## Use Enums

**Never declare a field as a literal-string union inline** (e.g. `status: 'active' | 'canceled'`). Define an `enum` in a shared `constants.ts` and reference it on the field. Applies to status fields, type-tag/discriminator fields, billing-cycle/interval fields — anything where the set of valid values is closed and finite.

```typescript
// ❌ Avoid — literal-string union inline on the field
export class SubscriptionDto {
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  billingCycle: 'monthly' | 'yearly';
}

// ✅ Prefer — Enum referenced from a shared constants module
// src/subscriptions/constants.ts
export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

// src/subscriptions/dto/subscription.dto.ts
import { IsEnum } from 'class-validator';
import { BillingCycle, SubscriptionStatus } from '../constants';

export class SubscriptionDto {
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;
}
```

**Why this matters**:

- **Single source of truth** — the valid values are defined once. Adding `SubscriptionStatus.PAUSED` is one edit, not a grep-and-replace across every union site.
- **Refactor safety** — renaming a value updates every consumer; literal-string unions don't.
- **Call-site clarity** — `SubscriptionStatus.ACTIVE` reads as a named concept; `'active'` is a magic string.
- **Exhaustiveness** — `switch` statements and TypeScript's exhaustiveness checks can verify all enum members are handled.
- **Free OpenAPI schema** — NestJS Swagger renders the enum as a proper `enum` in `/api`, and DB columns can reference the same type.

**Placement**: shared enums live in the most-upstream module that owns the concept — typically `src/<feature>/constants.ts`. TypeORM/Prisma entities, DTOs, and service code all import from there.

## Concurrent I/O Instead of Sequential Awaits

Don't `await` independent promises one at a time in a loop. Gather them so I/O overlaps:

```typescript
// Avoid — serial; total latency is the sum of every call
const results = [];
for (const subId of subscriptionIds) {
  results.push(await fetchSubscription(subId));
}

// Prefer — concurrent; total latency is the slowest single call
const results = await Promise.all(
  subscriptionIds.map(subId => fetchSubscription(subId))
);
```

For large fan-outs, bound concurrency with a library like `p-map` or a custom semaphore so you don't exhaust the DB connection pool or hit external rate limits.

## HTTP Client

Use the built-in `@nestjs/axios` `HttpService` for outbound calls — **never** the blocking global `fetch` without proper timeout configurations inside a loop, and never create a new `axios` client per request manually without connection pooling. Inject `HttpService` as a dependency, so connection pooling, timeouts, and tracing are configured centrally in the module.

## Don't Block the Event Loop

In an `async` route, never call blocking code directly (sync file reads, `crypto.pbkdf2Sync`, heavy JSON parsing, or heavy CPU work). A single blocking call stalls every concurrent request on the Node.js event loop worker.

## Function Parameters

When a function takes more than ~3 related parameters, group them into an interface or DTO instead of a long positional signature.

```typescript
// Avoid — positional soup; easy to transpose arguments
function createSubscription(name: string, price: number, currency: string, cycle: string, trialDays: number, userId: number) {}

// Prefer — a validated input model
export interface CreateSubscriptionInput {
  name: string;
  price: number;
  currency: string;
  cycle: BillingCycle;
  trialDays?: number;
}

function createSubscription(userId: number, data: CreateSubscriptionInput) {}
```

## Avoid Re-export `index.ts` Barrels

While barrel files (`index.ts`) are common, avoid funneling everything through a massive root `index.ts`. Import symbols directly from the file that defines them (`import { createSubscription } from './subscriptions.service'`) where possible to prevent circular dependencies, obscure source locations, and slow startup times.

## Feature Package Structure

Wrap each feature in a module so its controller, DTOs, entities, service logic, and constants live together. Use kebab-case for module and folder names, and consistent suffixes for files:

```text
src/
  app.module.ts               # Root module, imports features
  core/
    config.service.ts         # Settings
    database.module.ts        # connection providers
  subscriptions/
    subscriptions.module.ts   # Module definition
    subscriptions.controller.ts # Controller — thin HTTP layer
    subscriptions.service.ts  # business logic, DB injected
    entities/                 # DB models
    dto/                      # Request/response DTOs
    constants.ts              # enums, default values, magic numbers
```

**Why this matters**: This makes dependencies explicit and keeps the HTTP layer thin. Controllers parse/validate and delegate; Services hold logic and are unit-testable without spinning up the app. A flat `src/` of `controllers/`, `models/`, `utils/` makes every feature appear tangled with every other.

**Keep controllers thin**: route handlers should extract input, call a service function, and shape the response — nothing more. Business logic, DB queries, and external calls live in `*.service.ts`.

**Apply this pattern to all new work going forward.**

## Utility Module Structure

Give each non-trivial utility its own module with a colocated test, rather than a grab-bag `utils.ts`. Use kebab-case:

```text
src/core/utils/
  format-currency/
    format-currency.ts
    format-currency.spec.ts
  proration/
    proration.ts
    proration.spec.ts
```

**Why this matters**: isolated modules make it obvious what each test covers and keep unit tests focused.

**Apply this pattern to all new work going forward.**

## Extract Constants for Testing

**Proactively extract magic numbers, default values, and config objects** into `constants.ts` so implementation and tests reference the same source of truth.

```typescript
// src/subscriptions/constants.ts
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_TRIAL_DAYS = 14;

// src/subscriptions/dto/pagination.dto.ts
import { Type } from 'class-transformer';
import { IsOptional, Max, Min } from 'class-validator';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = DEFAULT_PAGE_SIZE;
}

// src/subscriptions/subscriptions.controller.spec.ts
import { DEFAULT_PAGE_SIZE } from './constants';
// tests assert against the same constants the implementation uses
```

**Why this matters**:

- Single source of truth - constants defined once
- Tests automatically stay in sync with implementation changes
- Refactoring is safer - change constant in one place
- Reduces test brittleness and maintenance burden

**When to extract constants**:

- Default query params (page size, sort)
- Configuration objects (pagination, filters, sort options)
- Magic numbers or strings used in logic
- Any value that tests need to reference

**File structure**:

```text
subscriptions/
  subscriptions.controller.ts # Implementation
  subscriptions.service.ts    # Logic
  constants.ts                # Shared constants
```

## Async/Await

Prefer `async`/`await` methods and drivers throughout the request path. Use `await` directly; don't wrap a single awaitable in `Promise.all` unless you genuinely have multiple to run concurrently.
