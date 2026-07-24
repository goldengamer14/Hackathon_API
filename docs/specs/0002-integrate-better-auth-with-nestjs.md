# 0002. Integrate Better Auth with NestJS for the API

**Date**: 2026-07-24
**Status**: Implemented (auth runtime complete, DB migration follow-up pending)

## Summary

This spec chooses the auth integration pattern for the NestJS API. The recommendation is to use Better Auth as the session and credential layer, wire it through the official NestJS integration package, and keep Prisma Postgres as the persistent adapter so the existing database and application structure stay aligned.

The decision keeps the repo on one auth path instead of mixing a custom Express wrapper with a separate session implementation. That gives the team a single source of truth for login, sessions, and route protection while fitting the current NestJS 11 plus Prisma Postgres setup.

Implementation note: the runtime auth config now lives in `lib/auth.ts`, `AppModule` registers the NestJS Better Auth integration once, and the default user role is `PARTICIPANT` instead of being user-supplied during sign-up. The auth account creation flow is routed through Better Auth's `/api/auth/sign-up/email` and `/api/auth/sign-in/email` endpoints; the app's local user read surface stays as read-only `GET /users` and `GET /users/:id`. The repository also avoids adding NestJS `.spec.ts` style unit tests for this path, and the remaining work is reconciliation of the Prisma Postgres migration history against the existing seed/user data drift in the development database.

## Context

The repository already has a NestJS 11 backend with Express, one global Arcjet module, and a Prisma Postgres connection from `lib/prisma.ts`. There is also a starter Better Auth instance in `lib/auth.ts`, but it is not yet wired into the NestJS bootstrap or application module. That means the auth layer is present as a partial sketch, not as a deployed runtime decision.

The important architectural force here is compatibility. The app already uses ESM, NestJS module injection, and a global infrastructure pattern for Prisma. A good auth decision should follow those patterns rather than bypass them with ad hoc Express logic. The repo also already depends on Prisma, so the auth adapter should reuse that data path instead of introducing another storage system.

The decision is now a load bearing one because the application needs a repeatable way to protect routes, manage sessions, and offer a real sign in flow. If the auth layer remains unaligned, the next implementation will likely mix framework conventions, duplicate session behavior, and create a brittle route guard story.

## Requirements

**User stories**:
- As an API consumer, I want one standard auth entry point so that I can sign in and receive a verified session.
- As a backend engineer, I want auth to be wired through NestJS module conventions so that I can secure routes with a clear, repeatable pattern.
- As a platform maintainer, I want the session and user data model to stay in the existing Prisma Postgres stack so that auth does not add a parallel persistence layer.

**Acceptance criteria** (the contract):
- **AC-1**: The API has one Better Auth instance configured for this project, with Prisma as its adapter and a clear config path for environment secrets.
- **AC-2**: The NestJS app registers auth once in the root module and exposes the auth middleware or guard path through the framework's module system.
- **AC-3**: The bootstrap path disables the built in Nest body parser so that Better Auth can read the raw request body for auth endpoints.
- **AC-4**: Auth protected routes are configured through route decorators or guards, not by ad hoc controller checks.
- **AC-5**: The chosen auth implementation keeps the repository's existing Prisma Postgres pattern and does not require a new user database or storage backend.

## Options considered

### Option 1: Use the community NestJS Better Auth integration package

This option keeps the auth flow in the framework by importing `@thallesp/nestjs-better-auth`, registering `AuthModule.forRoot({ auth })`, and applying Nest decorators such as `Session`, `AllowAnonymous`, and `OptionalAuth` on controllers.

**Pros**:
- Fits the repo's NestJS 11 pattern closely.
- Reuses the existing Better Auth instance and Prisma adapter.
- Gives a standard guard strategy for protected routes.

**Cons**:
- The NestJS integration is community maintained rather than first party.
- The bootstrap flow must be adjusted carefully to allow raw request body handling.

### Option 2: Keep a custom controller based auth wrapper

This option would wire Better Auth directly inside a custom controller, handler, or middleware path without the NestJS integration package.

**Pros**:
- Fewer external package concerns.
- Easier to keep the implementation narrowly scoped to one route surface.

**Cons**:
- It fights the repository's NestJS module structure.
- It makes route protection and session access less consistent across the API.
- It is more likely to produce framework drift and custom guard code over time.

### Option 3: Rebuild auth with a hand rolled session model

This option would create a custom user, session, and token model inside the API and skip Better Auth entirely.

**Pros**:
- Full control over the API shape.
- No external auth dependency.

**Cons**:
- It recreates the hardest parts of auth incorrectly by hand.
- It adds more long term maintenance and security risk than the repo needs.
- It would be a poor fit for a small team trying to ship quickly.

## Decision

**Chosen option**: Option 1: Use the community NestJS Better Auth integration package.

The project will use Better Auth as the primary auth engine and the `@thallesp/nestjs-better-auth` NestJS integration package as the framework layer. The auth instance will stay in one central `auth.ts` file, use Prisma as its adapter, and be registered once from `AppModule` so route protection follows Nest's standard module pattern.

**Implementation skills**: `better-auth-best-practices` (`Hackathon_API/.agents/skills/better-auth-best-practices/`) · `prisma-client-api` (`prisma/skills/prisma-client-api/`)

## Rationale

This is the simplest option that still matches the repo's existing runtime shape. The codebase already runs on NestJS 11 with constructor injected providers, a global Prisma module, and an ESM code path. Better Auth through the NestJS integration package respects those conventions and keeps auth in one reusable module rather than scattering logic across controllers and middleware.

The primary tradeoff is the community support status of the NestJS integration package. That is acceptable for this repo because the core Better Auth product is already the project's auth engine and the integration package is the shortest path to bringing it into the NestJS framework cleanly. The team should treat this as an integration concern to monitor, not as a reason to reimplement the auth layer from scratch.

The repo already has a partial Better Auth config in `lib/auth.ts`, so the decision is not to invent a new auth design. It is to complete and formalize the existing one so it runs through NestJS rather than remaining a disconnected starter file.

## Feature design

**Data model sketch**:
- `User` and `Session` remain the core identity entities managed by Better Auth through the Prisma adapter.
- The existing Prisma schema stays as the source of truth for the user identity records, with Better Auth model names mapped through the Prisma adapter path.
- The auth flow does not introduce a separate session database or a second user table.

**State transitions**:
- Auth state is driven by Better Auth's standard session lifecycle: unauthenticated → signed in → session active → revoked or expired.
- No new custom state machine is required in the API for the initial integration.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/auth/*` | all | auth request payload, headers, cookies | auth session response or redirect | public | 400, 401, 422 |
| `/users/me` or equivalent protected profile route | GET | none, session comes from the request context | user profile or session payload | bearer or session guard | 401, 403 |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Sign in request | user identity and session token | Better Auth request handler using Prisma backed adapter state |
| Protected route access | session user payload | request session context from the NestJS auth integration |
| Auth response | user session status and cookie data | Better Auth runtime, resolved through the configured adapter |

**Key invariants**:
- One auth instance is registered once at the application root.
- The request body parser for auth endpoints remains raw, matching Better Auth's expected request handling.
- Session handling stays in the configured Prisma backed auth store, not a sidecar storage system.

**Security model**:
- Public endpoints remain public by explicit allowance.
- Protected routes are guarded through the NestJS auth integration rather than manual controller checks.
- The team must keep auth secrets in environment variables and avoid storing tokens or credentials in the repository.

**Configuration required**:
- `BETTER_AUTH_SECRET`: secret used to sign and secure the Better Auth runtime.
- `BETTER_AUTH_URL`: public base URL for the API,
- `DATABASE_URL`: existing Prisma Postgres connection string.
- `PORT`: NestJS listen port, already expected by the app bootstrap path.

**Critical test scenarios**:
- Happy path: a new sign in flow reaches `/api/auth` and returns a valid session context, verifies **AC-1** and **AC-2**.
- Failure case: a missing or invalid session on a protected route returns a 401 or 403 response instead of falling through, verifies **AC-4**.
- Auth/permission: a public route stays open, while a protected route requires the auth context, verifies **AC-4** and **AC-5**.

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript | Already the repository default and fits both NestJS and Better Auth. |
| Framework | NestJS 11 with Express | Already the runtime the API is built on. |
| Primary DB | Prisma Postgres | Already linked into the repo and used by the server singleton. |
| Auth | Better Auth with the NestJS integration package | Best fit for a single, documented auth path that matches the repo's stack. |
| Hosting | existing Node process on the repo's current runtime | No new hosting pattern is needed for the auth decision itself. |
| Observability | existing app logs and request failure handling | Auth changes should ride the same operational patterns as the rest of the service. |

## Build plan

1. Create the auth module wiring in the NestJS root module, using the existing Better Auth instance and the NestJS integration entrypoint, satisfies **AC-1**, **AC-2**.
2. Adjust bootstrap so the Nest app can accept raw auth requests, satisfies **AC-3**.
3. Add one protected route example and one allow anonymous route example to prove the integration pattern, satisfies **AC-4**.
4. Verify that Prisma backed user and session records remain the persistent store for the implementation, satisfies **AC-5**.

## Consequences

**Positive**:
- The repo keeps one clear auth runtime and one guard model.
- The implementation reuses the existing Prisma Postgres setup and avoids a second persistence path.
- The team gets a standard route protection story for future features.

**Negative / tradeoffs**:
- The NestJS integration package is community maintained, so framework compatibility needs periodic verification.
- The bootstrap must disable the body parser, which is a framework specific behavior change that affects all request handling in the app.
- The project must keep the Better Auth config aligned with the Prisma schema as the schema evolves.

**Neutral**:
- The auth design will likely require small follow up changes in the repo's app wiring so the auth routes are reachable and protected correctly.

## Follow-up

- [ ] Add the real Better Auth environment variables to the runtime configuration before implementation begins.
- [ ] Confirm the authentication route shape and protected controller surface that should be created next.
- [ ] Decide whether the current `lib/auth.ts` file should become the canonical auth source for the API or be moved under the NestJS module structure.

## References

**Project sources** (verifiable, in this repo):
- `AGENTS.md` and the repository's NestJS first conventions.
- `lib/auth.ts` as the current Better Auth starter instance.
- `src/app.module.ts`, `src/main.ts`, and `lib/prisma.ts` as the current runtime wiring points.
- `package.json` as the project's current dependency and runtime shape.

**Practices & standards**:
- NestJS module first wiring for infrastructure.
- Prisma as the persistent adapter for auth identity and session state.
- Framework level auth protection instead of controller level, ad hoc checks.

**Links** (web verified only, `sources+links` level only):
- Better Auth docs: https://better-auth.com/docs
- Better Auth NestJS integration: https://better-auth.com/docs/integrations/nestjs
- NestJS Better Auth GitHub repository: https://github.com/thallesp/nestjs-better-auth
