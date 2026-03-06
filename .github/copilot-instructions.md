# Copilot Instructions

<!-- ForgeCraft managed | 2026-03-05 | target: copilot -->
> **This project is managed by [ForgeCraft](https://github.com/jghiringhelli/forgecraft-mcp).** Generated for GitHub Copilot.
> Tags: `UNIVERSAL`, `WEB-STATIC`, `WEB-REACT`, `GAME`, `STATE-MACHINE`
>
> Available commands:
> - `setup_project` — re-run full setup (detects tags, generates instruction files)
> - `refresh_project` — detect drift, update tags/tier after project scope changes
> - `audit_project` — score compliance, find gaps
> - `review_project` — structured code review checklist
> - `scaffold_project` — generate folders, hooks, docs skeletons
>
> Config: `forgecraft.yaml` | Tier system: core → recommended → optional

## Project Identity
- **Repo**: {{repo_url}}
- **Primary Language**: typescript
- **Framework**: {{framework}}
- **Domain**: {{domain}}
- **Sensitive Data**: {{sensitive_data}}
- **Project Tags**: `[UNIVERSAL]` `[WEB-STATIC]` `[WEB-REACT]` `[GAME]` `[STATE-MACHINE]`

## Code Standards
- Maximum function/method length: 50 lines. If longer, decompose.
- Maximum file length: 300 lines. If longer, split by responsibility.
- Maximum function parameters: 5. If more, use a parameter object.
- Every public function/method must have a docstring/JSDoc with typed params and returns.
- Delete orphaned code. Do not comment it out. Git has history.
- Before creating a new utility, search the entire codebase for existing ones.
- Reuse existing patterns — check shared modules before writing new.
- No abbreviations in names except universally understood ones (id, url, http, db, api).
- All names must be intention-revealing. If you need a comment to explain what a variable
  holds, the name is wrong.

## Production Code Standards — NON-NEGOTIABLE

These apply to ALL code including prototypes. "It's just a prototype" is never a valid
exception. Prototypes become production code within days at CC development speed.

### SOLID Principles
- **Single Responsibility**: One module = one reason to change. Use "and" to describe it? Split it.
- **Open/Closed**: Extend via interfaces and composition. Never modify working code for new behavior.
- **Liskov Substitution**: Any interface implementation must be fully swappable. No isinstance checks.
- **Interface Segregation**: Small focused interfaces. No god-interfaces.
- **Dependency Inversion**: Depend on abstractions. Concrete classes are injected, never instantiated
  inside business logic.

### Zero Hardcoded Values
- ALL configuration through environment variables or config files. No exceptions.
- ALL external URLs, ports, credentials, thresholds, feature flags must be configurable.
- ALL magic numbers must be named constants with documentation.
- Config is validated at startup — fail fast if required values are missing.

### Zero Mocks in Application Code
- No mock objects, fake data, or stub responses in source code. Ever.
- Mocks belong ONLY in test files.
- For local dev: create proper interface implementations selected via config.
- No `if DEBUG: return fake_data` patterns. Use dependency injection to swap implementations.
- No TODO/FIXME stubs returning hardcoded values. Use NotImplementedError with a description.

### Interfaces First
Before writing any implementation:
1. Define the interface/protocol/abstract class
2. Define the data contracts (input/output DTOs)
3. Write the consuming code against the interface
4. Write tests against the interface
5. THEN implement the concrete class

### Dependency Injection
- Every service receives dependencies through its constructor.
- A composition root (main.py / app.ts / container) wires everything.
- No service locator pattern. No global singletons. No module-level instances.

### Error Handling
- Custom exception hierarchy per module. No bare Exception raises.
- Errors carry context: IDs, timestamps, operation names.
- Fail fast, fail loud. No silent swallowing of exceptions.
- Domain code never returns HTTP status codes — that's the API layer's job.

### Modular from Day One
- Feature-based modules over layer-based. Each feature owns its models, service, repository, routes.
- Module dependency graph must be acyclic.
- Every module has a clear public API via __init__.py / index.ts exports.

## Layered Architecture (Ports & Adapters / Hexagonal)

```
┌─────────────────────────────┐
│  API / CLI / Event Handlers │  ← Thin. Validation + delegation only. No logic.
├─────────────────────────────┤     These are DRIVING ADAPTERS (primary).
│  Services (Business Logic)  │  ← Orchestration. Depends on PORT INTERFACES only.
├─────────────────────────────┤
│  Domain Models              │  ← Pure data + behavior. No I/O. No framework imports.
│  (Entities, Value Objects)  │     The inner hexagon. Zero external dependencies.
├─────────────────────────────┤
│  Port Interfaces            │  ← Abstract contracts (Repository, Gateway, Notifier).
│                             │     Defined by the domain, implemented by adapters.
├─────────────────────────────┤
│  Repositories / Adapters    │  ← DRIVEN ADAPTERS (secondary). All external I/O
│                             │     (DB, APIs, files, queues, email, caches).
├─────────────────────────────┤
│  Infrastructure / Config    │  ← DI container, env config, connection factories
└─────────────────────────────┘
```

### Ports (Interfaces owned by the domain)
- **Repository ports**: `UserRepository`, `OrderRepository` — data persistence contracts.
- **Gateway ports**: `PaymentGateway`, `EmailSender` — external service contracts.
- Ports are defined in the domain/service layer, never in the adapter layer.
- Port interfaces specify WHAT, never HOW.

### Adapters (Implementations of ports)
- **Driving adapters** (primary): HTTP controllers, CLI handlers, message consumers
  — they CALL the application through port interfaces.
- **Driven adapters** (secondary): PostgresUserRepository, StripePaymentGateway,
  SESEmailSender — they ARE CALLED BY the application through port interfaces.
- Adapters are interchangeable. Swap `PostgresUserRepository` for `InMemoryUserRepository`
  in tests without changing a single line of business logic.

### Data Transfer Objects (DTOs)
- Use DTOs at layer boundaries — never pass domain entities to/from the API layer.
- **Request DTOs**: validated at the API boundary (Zod schema → typed object).
- **Response DTOs**: shaped for the consumer, not mirroring the domain model.
- **Domain ↔ Persistence mapping**: repositories map between domain entities and DB rows/documents.
- DTOs are plain data objects — no methods, no behavior, no framework decorators.

### Layer Rules
- Never skip layers. API handlers do not call repositories directly.
- Dependencies point INWARD only. Inner layers never import from outer layers.
- Domain models have ZERO external dependencies.
- The domain layer does not know HTTP, SQL, or any framework exists.

## Clean Code Principles

### Command-Query Separation (CQS)
- **Commands** change state but return nothing (void).
- **Queries** return data but change nothing (no side effects).
- A function should do one or the other, never both.
- Exception: stack.pop() style operations where separation is impractical — document why.

### Guard Clauses & Early Return
- Eliminate deep nesting. Handle invalid cases first, return early.
- The happy path runs at the shallowest indentation level.
- Before:
  ```
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        // actual logic buried 3 levels deep
  ```
- After:
  ```
  if (!user) throw new NotFoundError(...);
  if (!user.isActive) throw new InactiveError(...);
  if (!user.hasPermission) throw new ForbiddenError(...);
  // actual logic at top level
  ```

### Composition over Inheritance
- Prefer composing objects via interfaces and delegation over class inheritance.
- Inheritance creates tight coupling and fragile hierarchies.
- Use inheritance ONLY for genuine "is-a" relationships (rare).
- When in doubt, compose: inject a collaborator, don't extend a base class.

### Law of Demeter (Principle of Least Knowledge)
- A method should only call methods on: its own object, its parameters, objects it creates,
  its direct dependencies.
- Do NOT chain through objects: `order.getCustomer().getAddress().getCity()` — BAD.
- Instead: `order.getShippingCity()` or pass the needed data directly.

### Immutability by Default
- Use `const` over `let`. Use `readonly` on properties and parameters.
- Prefer `ReadonlyArray<T>`, `Readonly<T>`, `ReadonlyMap`, `ReadonlySet`.
- When you need to "modify" data, create a new copy with the change.
- Mutable state is the #1 source of bugs. Restrict it to the smallest possible scope.

### Pure Functions
- A pure function: same inputs → same outputs, no side effects.
- Domain logic, validation, transformation, and calculation should be pure.
- Side effects (I/O, logging, database) are pushed to the edges (adapters).
- Pure functions are trivially testable — no mocks needed.

### Factory Pattern
- Use factories to encapsulate complex object construction.
- Factory methods on the class itself for simple cases: `User.create(dto)`.
- Factory classes/functions when construction involves dependencies or conditional logic.
- Factories are the natural companion to dependency injection — the DI container
  IS the top-level factory.

## CI/CD & Deployment

### Pipeline
- Every push triggers: lint → type-check → unit tests → build → integration tests.
- Merges to main additionally run: security scan → deploy to staging → smoke tests → promote.
- Pipeline must complete in under 10 minutes. Parallelize test suites, cache dependencies.
- Failed pipelines block merge. No exceptions.

### Environments
- Minimum three environments: **development** (local), **staging** (mirrors prod), **production**.
- Environment config is injected — same artifact runs everywhere with different env vars.
- Staging is a faithful replica of production (same provider, same DB engine, same services).

### Deployment Strategy
- Default: **rolling deployment** with health checks (zero downtime).
- For critical services: **blue-green** or **canary** with automated rollback on error rate spike.
- Every deploy is tagged with git SHA. Rollback = redeploy a previous SHA.
- Deployment must be one command or one button. No multi-step manual runbooks.

### Preview Environments
- Pull requests get ephemeral preview deployments where feasible (Vercel, Netlify, Railway).
- Preview URLs in PR comments for stakeholder review before merge.

## Testing Pyramid

```
         /  E2E  \          ← 5-10% of tests. Core journeys only.
        / Integration \      ← 20-30%. Real dependencies at boundaries.
       /    Unit Tests   \   ← 60-75%. Fast, isolated, every public function.
```

### Coverage Targets
- Overall minimum: 80% line coverage (blocks commit)
- New/changed code: 90% minimum (measured on diff)
- Critical paths: 95%+ (data pipelines, auth, PHI handling, financial calculations)

### Test Rules
- Every test name is a specification: `test_rejects_duplicate_member_ids` not `test_validation`
- No empty catch blocks. No `assert True`. No tests that can't fail.
- Test files colocated: `[module].test.[ext]` or in `tests/` mirroring src structure.
- Flaky tests are bugs — fix or quarantine, never ignore.

### Test Doubles Taxonomy
Use the correct double for the job:
- **Stub**: Returns canned data. No assertions on calls. Use when you need to control input.
- **Spy**: Records calls. Assert after the fact. Use to verify side effects.
- **Fake**: Working implementation with shortcuts (in-memory DB). Use for integration-speed tests.
- **Mock**: Pre-programmed expectations. Assert call patterns. Use sparingly — they couple to implementation.
Prefer stubs and fakes over mocks. Tests that mock everything test nothing.

### Test Data Builders
- Use Builder or Factory pattern for test data: `UserBuilder.anAdmin().withName('Alice').build()`.
- One builder per domain entity. Builders provide sensible defaults so tests only specify what matters.
- No raw object literals scattered across tests. Centralize in `tests/fixtures/` or `tests/builders/`.

### Property-Based Testing
- For pure functions with wide input ranges, add property tests (fast-check, Hypothesis, QuickCheck).
- Define invariants, not examples: "sorting is idempotent", "encode then decode = identity".
- Property tests complement, not replace, example-based tests.

## Data Guardrails ⚠️
- NEVER sample, truncate, or subset data unless explicitly instructed.
- NEVER make simplifying assumptions about distributions, scales, or schemas.
- State exact row counts, column sets, and filters for every data operation.
- If data is too large for in-memory, say so — don't silently downsample.

## Commit Protocol
- Conventional commits: feat|fix|refactor|docs|test|chore(scope): description
- Commits must pass: compilation, lint, tests, coverage gate, anti-pattern scan.
- Keep commits atomic — one logical change per commit.
- Commit BEFORE any risky refactor. Tag stable states.
- Update Status.md at the end of every session.

## MCP-Powered Tooling
### CodeSeeker — Graph-Powered Code Intelligence
CodeSeeker builds a knowledge graph of the codebase with hybrid search
(vector + text + path, fused with RRF). Use it for:
- **Semantic search**: "find code that handles errors like this" — not just grep.
- **Graph traversal**: imports, calls, extends — follow dependency chains.
- **Coding standards**: auto-detected validation, error handling, and state patterns.
- **Contextual reads**: `get_file_context` returns a file with its related code.
Indexing is automatic on first search (~30s–5min depending on codebase size).
Most valuable on mid-to-large projects (10K+ files) with established patterns.
Install: `npx codeseeker install --vscode` or see https://github.com/jghiringhelli/codeseeker

## Engineering Preferences
These calibrate the AI assistant's judgment on subjective trade-offs.
- **DRY is important** — flag repetition aggressively.
- **Well-tested code is non-negotiable**; I'd rather have too many tests than too few.
- **"Engineered enough"** — not under-engineered (fragile, hacky) and not over-engineered
  (premature abstraction, unnecessary complexity).
- **Handle more edge cases**, not fewer; thoughtfulness > speed.
- **Bias toward explicit over clever** — readability wins over brevity.
- When in doubt, ask rather than assume.

## Corrections Log
When I correct your output, record the correction pattern here so you don't repeat it.
### Learned Corrections
- [AI assistant appends corrections here with date and description]

## Static Site & Jamstack Patterns

- Use Static Site Generation (SSG) as the default rendering strategy; reserve SSR or ISR only for pages requiring dynamic data at request time.
- Pre-render all content pages at build time. Ensure the build pipeline fails fast on broken links, missing assets, or template errors.
- Separate content from presentation: store structured content in Markdown, MDX, or a headless CMS, and consume it via build-time data fetching.
- Implement incremental builds where supported to keep build times under 60 seconds for content-heavy sites.
- Use content hashing for all emitted assets (JS, CSS, images) to enable aggressive, immutable caching (`Cache-Control: public, max-age=31536000, immutable`).
- Serve the site behind a CDN. Configure cache invalidation on deploy so users never see stale HTML entry points.
- Generate a `sitemap.xml` and `robots.txt` at build time. Include canonical URLs and Open Graph meta tags on every page.
- Keep JavaScript payload minimal. Audit bundle size on every PR; set a performance budget (e.g., < 100 KB compressed JS for the critical path).

## Asset Optimization & Performance

- Serve images in modern formats (WebP/AVIF) with `<picture>` fallbacks. Use responsive `srcset` and `sizes` attributes to deliver appropriately sized images.
- Inline critical CSS for above-the-fold content and defer non-critical stylesheets. Avoid render-blocking resources.
- Enable Brotli or gzip compression on the CDN/server for all text-based assets (HTML, CSS, JS, SVG, JSON).
- Lazy-load below-the-fold images and iframes using `loading="lazy"` or Intersection Observer.
- Preload key resources (`<link rel="preload">`) such as fonts and hero images. Use `font-display: swap` to prevent FOIT.
- Minimize third-party scripts. Load analytics and tracking asynchronously and after the main content is interactive.
- Run Lighthouse CI in the build pipeline; fail the build if performance score drops below the agreed threshold (e.g., 90).

## HTML & CSS Quality Standards

- Write semantic HTML5 markup. Use `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, and `<footer>` to convey document structure.
- Ensure all pages pass WCAG 2.1 AA. Provide alt text for images, proper heading hierarchy, sufficient color contrast, and keyboard navigability.
- Use CSS custom properties (variables) for theming. Maintain a design-token file as the single source of truth for colors, spacing, and typography.
- Prefer utility-first or modular CSS methodologies (e.g., Tailwind, CSS Modules) to avoid specificity conflicts and dead CSS accumulation.
- Validate HTML output with the W3C validator in CI. Fix all errors; treat warnings as errors in new code.
- Support dark mode via `prefers-color-scheme` media query or a user-togglable theme that persists in `localStorage`.

## Static Site Deployment

### Platforms
- **Netlify**: Git-push deploy, instant rollbacks, form handling, edge functions, split testing.
  Free tier generous for static sites. Build plugins for Lighthouse, broken link detection.
- **Vercel**: Zero-config for Next.js/Astro/SvelteKit. Preview deployments per PR.
- **Cloudflare Pages**: Unlimited bandwidth, global edge network, Pages Functions for dynamic routes.
- **GitHub Pages**: Free for open-source. Limited (no server functions, no redirects file natively).
  Suitable for docs sites and project landing pages only.
- **AWS S3 + CloudFront**: Maximum control, lowest cost at scale. Use `aws-cdk` or Terraform
  to define the stack: S3 bucket (private) → CloudFront distribution → Route53 DNS → ACM cert.

### Build Pipeline
- Build locally mirrors CI exactly (same Node version, same env vars). Use `.nvmrc` or `.node-version`.
- Build output is a static directory (`dist/`, `out/`, `public/`). No server process.
- Atomic deploys: new version fully uploaded before traffic switches. No partial states.
- Rollback = redeploy previous build artifact. Must complete in < 30 seconds.

### Cache Strategy
- HTML: `Cache-Control: public, max-age=300, stale-while-revalidate=86400`.
  Short-lived so deploys take effect quickly.
- Hashed assets (JS, CSS, images): `Cache-Control: public, max-age=31536000, immutable`.
  Filename changes on content change — cache forever.
- Invalidate CDN cache on deploy (automatic on Netlify/Vercel/CF Pages; manual on CloudFront).

## React & Frontend Standards

### Component Architecture
- Atomic Design: atoms → molecules → organisms → templates → pages.
- Components are pure UI. No API calls, no business logic, no direct state management.
- Container/Presenter split: containers fetch data, presenters render UI.
- All components must have TypeScript props interfaces. No `any` types.
- No inline styles. Use CSS modules, Tailwind, or styled-components consistently.

### State Management
- Local state (useState) for UI-only state (open/closed, hover, form inputs).
- Shared state via context or state library ONLY when 3+ components need the same data.
- Server state via React Query / TanStack Query / SWR — NEVER manually cache API responses.
- No prop drilling beyond 2 levels. Use composition (children) or context.

### Internationalization — From Day One
- EVERY user-facing string goes through the i18n system. No hardcoded display text.
- Use react-i18next or next-intl.
- Translation keys namespaced by feature: `members.table.header.name`.
- Date, number, currency formatting via Intl API — never manual formatting.

### Forms
- Use a form library (React Hook Form or Formik). No manual onChange handlers per field.
- Validation schema defined separately (Zod, Yup) and shared with backend if possible.
- All forms must handle: loading state, validation errors, submission errors, success feedback.

### API Integration
- All API calls go through a centralized API client module.
- API client handles: auth headers, base URL from config, error transformation, retry logic.
- Use React Query for all server state.

### Accessibility (a11y) — Non-Negotiable
- Semantic HTML elements (nav, main, section, article, button — not div for everything).
- All interactive elements keyboard-accessible. All images have alt text.
- ARIA labels on non-obvious interactive elements.
- Color contrast minimum AA (4.5:1 for text).

### Error Boundaries
- Wrap feature areas in Error Boundaries — a crash in one widget must not take down the page.
- Error boundaries display user-friendly fallback UI with retry action.
- Log caught errors to monitoring service (Sentry, DataDog, etc.).
- Never catch errors silently — always report and show feedback.

### Suspense & Loading States
- Use React Suspense for code-split components and async data.
- Every async operation has three states: loading, success, error. No blank screens.
- Skeleton loaders preferred over spinners for layout stability (reduces CLS).
- Optimistic updates for user-driven mutations (like/unlike, form submit).

## Frontend Deployment

### Platform Selection
- **Vercel**: First choice for Next.js. Zero-config deploys, edge functions, image optimization built in.
  ISR / on-demand revalidation works natively. Preview deployments on every PR.
- **Netlify**: Great for static + serverless. Form handling, edge functions, split testing built in.
  Works well with Gatsby, Astro, plain React (via adapter).
- **Cloudflare Pages**: Unlimited bandwidth, global edge. Best for static or Pages Functions.
- **AWS Amplify / S3+CloudFront**: Full control, lower cost at scale. More ops overhead.
- Self-hosted Docker: only when platform restrictions require it.

### Build & Deploy
- CI builds produce a static bundle (`dist/` or `.next/`). Same bundle deploys to staging then prod.
- Preview deployments for every PR — URL posted in PR comments for stakeholder review.
- Environment variables injected at build time (`NEXT_PUBLIC_*`, `VITE_*`). No secrets in client bundles.
- Build cache enabled (Turborepo, Nx, or platform-native). Target < 2 min builds.

### Performance Budgets
- JavaScript budget: < 200 KB compressed for initial load.
- Lighthouse CI in pipeline. Fail build if performance score drops below 90.
- Monitor Core Web Vitals in production (Vercel Analytics, web-vitals library, or RUM).

### Edge & CDN
- Static assets served from CDN with immutable cache headers (content-hashed filenames).
- HTML entry point: short cache (5 min) or stale-while-revalidate.
- Use edge middleware for: redirects, A/B testing, geo-routing, auth checks (avoid full round-trip).

## Game Loop & Frame Timing

- Use a fixed timestep for game logic updates (e.g., 60 Hz / 16.67ms) decoupled from the render frame rate. This ensures deterministic simulation regardless of display refresh rate.
- Accumulate elapsed time and consume it in fixed-size steps. Interpolate visual state between the previous and current simulation state for smooth rendering on variable-rate displays.
- Never tie game logic to `requestAnimationFrame` or vsync directly. Use `deltaTime` from a fixed update loop for physics, AI, and gameplay—use `requestAnimationFrame` only for rendering.
- Profile frame budgets rigorously. At 60 FPS, the total frame budget is ~16ms. Allocate budgets per system (e.g., physics 3ms, AI 2ms, rendering 8ms, overhead 3ms) and alert on overruns.
- Implement a frame rate limiter and graceful degradation: reduce visual quality (particle counts, draw distance, shadow resolution) before dropping simulation fidelity.
- Use a time scale factor to support pause, slow motion, and fast-forward without modifying core loop logic.

## Entity-Component-System (ECS) Architecture

- Separate identity (Entity), data (Component), and behavior (System). Entities are lightweight IDs; components are plain data structs; systems operate on sets of components.
- Organize components for data locality: store components of the same type in contiguous arrays (Struct of Arrays) to maximize CPU cache efficiency during system iteration.
- Systems should have no state of their own. They query the world for entities matching a component archetype and process them in a tight loop.
- Use component composition over inheritance. A `PlayerCharacter` is an entity with `Position`, `Velocity`, `Sprite`, `Health`, and `Input` components—not a deep class hierarchy.
- Implement an event bus or command buffer for deferred entity creation/destruction. Never modify the entity list while iterating over it.
- Tag components (zero-size marker components) are useful for filtering: `IsPlayer`, `IsEnemy`, `IsProjectile` let systems query efficiently without data overhead.

## Asset Management & Input Handling

- Preload and cache assets (textures, audio, meshes, fonts) during loading screens. Use an asset manifest to declare all required assets and track loading progress.
- Implement reference counting or handle-based asset management. Share loaded assets across entities and unload them only when no references remain.
- Use asset atlases (sprite sheets, texture atlases) to reduce draw calls. Batch rendering by texture to minimize GPU state changes.
- Abstract input handling behind an action mapping layer. Map physical inputs (keyboard keys, gamepad buttons, touch gestures) to logical actions (`Jump`, `Attack`, `MoveLeft`) defined in a rebindable configuration.
- Support input buffering: queue player inputs for a short window (2-5 frames) so that slightly early inputs still register. This dramatically improves perceived responsiveness.
- Handle input device hotplugging gracefully. Detect controller connect/disconnect events and update the UI prompts (keyboard glyphs vs. gamepad glyphs) accordingly.
- Implement an input replay/recording system for debugging and automated testing. Serialize input streams with frame timestamps for deterministic playback.

## State Transition Patterns

- Define all valid states and transitions as an explicit, declarative configuration (object map, table, or DSL)—never as scattered if/else chains across the codebase.
- Make the state machine the single source of truth for "what can happen next." UI elements, API validations, and business logic should all derive their behavior from the machine definition.
- Every transition should be triggered by a named event. Use past-tense names for events that report something happened (`PAYMENT_RECEIVED`) and imperative names for commands (`SUBMIT_ORDER`).
- Model transitions as pure functions: `(currentState, event) → nextState + effects`. Keep the transition logic free of side effects; execute effects (API calls, notifications) separately.
- Validate transitions before executing them. If an event is not valid in the current state, reject it with a clear error rather than silently ignoring it.
- Persist the current state and a history of transitions (event, from-state, to-state, timestamp, actor) for auditability and debugging.
- Visualize the state machine from its definition (e.g., generate a Mermaid or Graphviz diagram). Review the diagram in PRs that modify state logic.

## Guards, Actions & Side Effects

- Use guard conditions to make transitions conditional: a transition fires only if the guard predicate evaluates to true given the current context.
- Keep guards as pure, synchronous predicates. If a guard needs async data, fetch the data before sending the event to the machine—don't make the machine wait on I/O.
- Separate actions into three categories: entry actions (run when entering a state), exit actions (run when leaving a state), and transition actions (run during a specific transition).
- Actions should be fire-and-forget from the machine's perspective. If an action can fail and the failure matters, model the failure as a new event that the machine handles.
- Use the context (extended state) to carry data that influences guards and actions. Update context immutably during transitions to maintain a clear audit trail.
- Implement an effect/service layer that the machine invokes but does not depend on directly. This makes the machine testable in isolation without mocking external systems.

## Hierarchical & Parallel State Patterns

- Use hierarchical (nested) states to avoid transition explosion. Common behaviors shared by sibling states should be defined on the parent state.
- Model independent concurrent behaviors as parallel (orthogonal) state regions. For example, a form component might have parallel regions for validation state and submission state.
- Define clear entry and exit points for compound states. Use initial states for child regions and final states to signal region completion.
- Avoid deeply nested hierarchies (> 3 levels). If nesting grows complex, consider decomposing into separate communicating machines via the actor model.
- Use `done` events to coordinate between parallel regions or between parent and child machines. A parent can transition when all child regions reach their final states.
- Test state machines exhaustively: cover every state, every transition, every guard branch, and every unreachable-state assertion. Use model-based testing to auto-generate transition paths.
