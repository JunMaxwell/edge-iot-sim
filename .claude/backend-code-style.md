# Backend NestJS (TypeScript) Code Style Guidelines

> Sibling document to [frontend-code-style.md](./frontend-code-style.md). Same philosophy — strong typing, single source of truth, explicit structure, testability — expressed in this backend's stack: **NestJS**, **TypeScript**, **TypeORM/Prisma**, **Jest**, **ESLint**, **Prettier**.

## General Principles

- **Type Hints**: Annotate every function signature, class attribute, and variable. **Never use bare `any`** — use a concrete type, `unknown`, or generic type parameters `<T>`. Run TypeScript compiler in `strict` mode.
- **Safe Access**: Prefer optional chaining (`?.`) and nullish coalescing (`??`) for optional lookups, model optional fields explicitly as `T | null` or `T | undefined`, and guard against `null`/`undefined`.
- **Imports**: Grouped external (node_modules) → internal aliases (`@/`) → relative imports, alphabetized within each group. Let **ESLint** and **Prettier** enforce and auto-fix this.
- **Endpoints**: `async` controller methods with explicit DTO (Data Transfer Object) request/response models. Never return a raw `any` object from a public endpoint — type it explicitly with Swagger decorators and TypeScript return types.
- **Naming**: `camelCase` for functions/variables/class instances, `PascalCase` for classes (Models, Enums, DTOs, Services, Controllers), `UPPER_SNAKE_CASE` for module-level constants.
- **Error Handling**: Throw `HttpException` (or a custom exception mapped by a global exception filter) for client-facing failures. Wrap external I/O in `try/catch` with specific exception types or handle cleanly.
- **Dependency Management**: Use NestJS Dependency Injection (`@Injectable()`, constructor injection) for shared resources (Services, Repositories, Config). This kills "parameter drilling".
- **File Structure**: Feature-based modules (`src/<feature>/`), not layer-only dumping grounds.
- **Formatting**: **Prettier** enforced, 2-space indentation. Do not hand-format.
- **Composition**: Compose behavior with Interceptors, Guards, Pipes, and small Injectable services rather than deep inheritance.

## Development Best Practices

### Use Enums

**Never declare a field as a literal-string union inline** (e.g. `status: "active" | "canceled"`). Define an `enum` in a shared `constants.ts` and reference it on the field. Applies to status fields, type-tag/discriminator fields, billing-cycle/interval fields.

```typescript
// ❌ Avoid — literal-string union inline on the field
class SubscriptionDto {
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
import { BillingCycle, SubscriptionStatus } from '../constants';
import { IsEnum } from 'class-validator';

export class SubscriptionDto {
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;
}
```

**Why this matters**:

- **Single source of truth** — valid values are defined once.
- **Refactor safety** — renaming a value updates every consumer.
- **Call-site clarity** — `SubscriptionStatus.ACTIVE` reads as a named concept.
- **Free OpenAPI schema** — NestJS Swagger renders the enum correctly if decorated.

### Concurrent I/O Instead of Sequential Awaits

Don't `await` independent promises one at a time in a loop. Gather them so I/O overlaps using `Promise.all()`.

```typescript
// ❌ Avoid — serial; total latency is the sum of every call
const results = [];
for (const subId of subscriptionIds) {
  results.push(await fetchSubscription(subId));
}

// ✅ Prefer — concurrent; total latency is the slowest single call
const results = await Promise.all(
  subscriptionIds.map(subId => fetchSubscription(subId))
);
```

For large fan-outs, use a concurrency-limiting library like `p-map` so you don't exhaust the DB connection pool or hit external rate limits.

### HTTP Client

Use the built-in `@nestjs/axios` `HttpService` for outbound calls instead of raw `fetch` or `axios` instances spread around, and leverage RxJS `firstValueFrom` if you prefer Promises over Observables. Register the module correctly so connection pooling and timeouts are configured centrally.

```typescript
// ❌ Avoid — raw client instantiation per file
import axios from 'axios';
const resp = await axios.get(url);

// ✅ Prefer — injected HttpService
@Injectable()
export class SubscriptionsService {
  constructor(private readonly httpService: HttpService) {}
}
```

### Don't Block the Event Loop

In an `async` route/service, never call blocking sync code directly (heavy CPU work like large JSON parsing, sync crypto hashing). Use worker threads, `crypto.pbkdf2` instead of `crypto.pbkdf2Sync`, or offload expensive processing to a background job queue (e.g. BullMQ). A single blocking call stalls every concurrent request on the Node.js event loop.

### Function Parameters

When a function takes more than ~3 related parameters, group them into an interface or DTO object instead of a long positional signature.

```typescript
// ❌ Avoid — positional soup; easy to transpose arguments
function createSubscription(name: string, price: number, currency: string, cycle: BillingCycle, trialDays: number, userId: number) { ... }

// ✅ Prefer — an interface/DTO object
export interface CreateSubscriptionInput {
  name: string;
  price: number;
  currency: string;
  cycle: BillingCycle;
  trialDays?: number;
}

function createSubscription(userId: number, data: CreateSubscriptionInput) { ... }
```

### Avoid Re-export `index.ts` Barrels Obscuring Logic

While barrel files (`index.ts`) are common in TypeScript, avoid funneling everything through a catch-all root barrel. Import symbols directly from their specific module/service files where it improves clarity or prevents circular dependencies.

### Feature-Based Package Structure (Strictly Enforced)

We strictly enforce a **Feature-Based (Domain-Driven) module structure**. You must **never** use a layer-based structure (e.g., grouping all models in a global `models/` folder, all controllers in a global `controllers/` folder).

Wrap each feature in a self-contained NestJS Module so its controller, DTOs, service logic, and constants live together.

```text
src/
  app.module.ts               # Root module, imports feature modules
  core/                       # App-wide shared logic (Guards, Interceptors, Filters)
    config/                   # Configuration management
    database/                 # Global database setup
  customers/                  # 📦 FEATURE: Customers
    customers.module.ts       # Module definition
    customers.controller.ts   # Controller — thin HTTP layer
    customers.service.ts      # Business logic
    entities/                 # DB Entities
    dto/                      # Data Transfer Objects
    constants.ts              # Enums, default values
  leads/                      # 📦 FEATURE: Leads
    leads.module.ts
    ...
```

**Why this matters**:

- **Encapsulation**: All context for a domain is isolated.
- **Scalability**: Adding new domains just means adding new modules.
- **Maintainability**: Keeps dependencies explicit, prevents tangled monoliths.

### Keep Controllers Thin, Logic in Services

Controller methods should extract input, pass it to a service function, and return the response — nothing more. Business logic, DB queries, and external calls live in `*.service.ts`.

```typescript
// customers.controller.ts — thin
@Post()
async create(
  @Body() createCustomerDto: CreateCustomerDto,
  @CurrentUser() user: User,
) {
  return this.customersService.create(user.id, createCustomerDto);
}

// customers.service.ts — logic, DB injection
@Injectable()
export class CustomersService {
  constructor(private repo: CustomersRepository) {}
  
  async create(userId: number, dto: CreateCustomerDto) {
    // business logic here
  }
}
```

### Extract Constants for Testing

**Proactively extract magic numbers, default values, and config objects** into `constants.ts` so implementation and tests reference the same source of truth.

```typescript
// src/subscriptions/constants.ts
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

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
```

### Async/Await

Prefer `async/await` throughout the codebase. Use `.then().catch()` only when absolutely necessary (e.g. inside specific RxJS observable pipelines or event emitters that do not support async correctly).

## NestJS Patterns

### Dependency Injection Over Parameter Drilling

**Proactively use constructor injection (`@Injectable()`)** so shared resources are provided where they're needed.
Use custom providers (`useFactory`, `useValue`) for complex setup (like injecting connection pools).

**When to use a provider**:

- Resources needed by many modules (DB session, API clients)
- Cross-cutting concerns scoped correctly (Request-scoped vs Singleton)

### Cache Expensive Singletons

NestJS providers are singletons by default. Use this to your advantage to initialize heavy resources (connections, parsed configs) once during application bootstrap (`OnModuleInit`).

### Schema Validation via DTOs and class-validator

Use `class-validator` and `class-transformer` for **all** request bodies, query params, and route params. Push validation into the DTO class (`@IsString()`, `@Max()`) and enable the global `ValidationPipe` so invalid input is rejected with a 400 before reaching your controller.

### Pagination, Not Unbounded Queries

Any endpoint returning a collection whose size is bounded by user data **must** paginate with `limit`/`offset` and a `MAX_PAGE_SIZE` cap. Never do `repository.find()` without limits.

### Partial Updates (PATCH)

For update endpoints, accept a `PartialType` DTO (via `@nestjs/swagger` or `@nestjs/mapped-types`) and apply **only the fields the client actually sent**.

### Consistent Error Responses

Throw NestJS built-in `HttpException` subclasses (`NotFoundException`, `BadRequestException`). Use Global Exception Filters for unexpected application errors to maintain a stable JSON error format.

### Atomic Writes and Transactions

A request that performs multiple related writes must commit them in one database transaction so a mid-way failure leaves no partial state. Use your ORM's transaction APIs (e.g., Prisma `$transaction`, TypeORM `QueryRunner`).

## Data Handling

### Date/Time

Use timezone-aware patterns (e.g., standardizing on ISO 8601 UTC strings or using `date-fns` / `dayjs` over raw `Date` manipulation where timezone is important). The Node `Date` object parses to the local system time if not careful.

### Time Storage in UTC

**Always store timestamps in UTC** in the database. Convert to the user's timezone only at the frontend presentation boundary.

### Money as Decimal, Never Float

Use decimal libraries like `decimal.js` or `bignumber.js` (and `DECIMAL` DB columns) for monetary values. Never use standard Javascript `number` (which is a float) for currency arithmetic.

```typescript
import Decimal from 'decimal.js';

// ✅ Correct — exact
const total = new Decimal('10.50').times(3); // 31.50

// ❌ Incorrect — binary float rounding error
const total = 10.50 * 3; // 31.499999999999996
```

## Testing

- Use **Jest** (or Vitest) for testing. NestJS comes with `@nestjs/testing` which makes setting up isolated modules easy.
- **Override dependencies** with `.overrideProvider()` in your `Test.createTestingModule(...)` block to inject fake clients, mock repositories, and stub auth.
- Test services directly for business logic (Unit tests).
- Test controllers using Supertest for the HTTP contract (E2E tests).

## Linting & Formatting

- **ESLint** and **Prettier** are the tools for linting and formatting.
- 2-space indentation. Don't hand-format or disable rules inline without a `// eslint-disable-next-line rule-name -- reason` comment explaining why.
