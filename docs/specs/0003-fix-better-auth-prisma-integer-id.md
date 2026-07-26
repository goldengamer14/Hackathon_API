# 0003. Fix Better Auth / Prisma integer-ID incompatibility and production build path

**Date**: 2026-07-26
**Status**: Implemented

## Summary

This record documents the changes made after `0002`'s "DB migration follow-up pending" status. Two unrelated problems were found and resolved during live testing of the sign-up/sign-in flow: a hard, permanent incompatibility between Better Auth's Prisma adapter and integer-typed `user.id` columns, and a production build path mismatch caused by the project's multi-root TypeScript source layout (`src/`, `lib/`, `prisma/`, `scripts/` compiled as siblings). A third, earlier issue — response envelope interception colliding with Better Auth's own HTTP responses — was also identified and fixed, but ruled out as the root cause of the ID bug once investigated further.

## Context

Following `0002`, the app had one already-diagnosed migration drift (reconciled via `prisma migrate reset`, see prior session), but attempting a real sign-up (`POST /api/auth/sign-up/email`) still failed. Two consecutive Prisma validation errors surfaced in sequence as underlying causes were peeled back:

1. `Invalid prisma.account.create() invocation ... Argument 'id' is missing` — `session`/`account`/`verification` had `id TEXT` columns with no application- or DB-side default.
2. After fixing (1) via a `generateId` callback: `Argument 'userId': Invalid value provided. Expected Int, provided String` — Better Auth's Prisma adapter passes all foreign-key values as strings regardless of the referenced column's actual SQL type.

Problem (2) was root-caused to a **permanent, intentional design decision** in Better Auth, not a bug awaiting a patch. Maintainer confirmation (GitHub issue `better-auth/better-auth#2349`, closed): *"This is intentional. All existing code for BA has been built around the idea that `id` is a string ... This will remain a string."* No adapter version, past or future, resolves this — Better Auth requires every table's `id`, including all foreign keys referencing `user.id`, to be `String`.

Separately, `npm run start:prod` failed with `Cannot find module '/dist/main'`. Root cause: the project's `tsconfig` compiles `src/`, `lib/`, `scripts/`, and `prisma/` as sibling root folders (no single `rootDir`), so TypeScript's emitted output mirrors the full repo structure under `dist/` — landing `main.js` at `dist/src/main.js`, not `dist/main.js`. This was a pure path assumption left over from the original Nest starter template, not a compile error.

## Changes made

### 1. Prisma schema — `user.id` converted from `Int`/`SERIAL` to `String`/`uuid`

`prisma/schema.prisma`:
- `User.id`: `Int @id @default(autoincrement())` → `String @id @default(uuid())`
- `Post.authorId`: `Int` → `String` (FK follows `User.id`'s new type)
- `Session.userId`, `Account.userId`: `Int` → `String`
- `Session.id`, `Account.id`, `Verification.id`: kept `String @id`, `@default(uuid())` added explicitly (cosmetic/defensive — Better Auth always supplies an explicit id at insert time via its own generation, so this default is a fallback, not the active path)

This required a destructive migration; the dev database had no data worth preserving, so `prisma migrate reset` followed by `prisma migrate dev` was used to reconcile schema and migration history cleanly.

### 2. `lib/auth.ts` — removed the `generateId` override

The `advanced.database.generateId` callback (added as an interim fix for problem (1) above) was removed entirely once all ID columns became `String`. Better Auth's default ID generation now handles every model without customization — the override was a workaround for a type mismatch that no longer exists.

### 3. `ResponseInterceptor` scoped from global to per-controller

`main.ts`: `app.useGlobalInterceptors(new ResponseInterceptor())` removed.
`app.controller.ts`, `user.controller.ts`: `@UseInterceptors(ResponseInterceptor)` applied at the controller level instead.

Reasoning: the global interceptor was suspected (correctly, as a general risk — though not the actual cause of the ID bug above) of colliding with Better Auth's own response-writing on `/api/auth/*` routes, since Better Auth's handler manages its own HTTP response lifecycle independently of Nest's `next.handle()` pipeline. Scoping the interceptor to only the app's own controllers avoids that collision entirely regardless of whether it was actively causing failures.

### 4. `user.controller.ts` / `user.service.ts` — updated for string IDs, roles added

- `findOne(@Param('id', ParseIntPipe) id: number)` → `findOne(@Param('id') id: string)` — `ParseIntPipe` removed since IDs are no longer numeric.
- `@Get()` route renamed to `@Get('all')`, now guarded with `@Roles(["ADMIN"])` from `@thallesp/nestjs-better-auth` — enforced via Better Auth's built-in admin plugin (already configured in `auth.ts` with `defaultRole: 'PARTICIPANT'`, `adminRoles: ['ADMIN']`); no custom guard code was written.
- `:id` route left open to any authenticated caller (no explicit role restriction).

### 5. Production build path fixed

`package.json`: `"start:prod": "node dist/main"` → `"node dist/src/main"`, matching where `tsc` actually emits `main.js` given the project's multi-root source layout.

### 6. Dead code confirmed, left in place

`src/module/user/dto/create-user.dto.ts` still exists (email/name/optional-strong-password DTO). It is **not wired into any route** — signup goes exclusively through Better Auth's own `/api/auth/sign-up/email` endpoint, which owns validation, hashing, and persistence independently of this DTO. Left in place as unused scaffolding; not currently a dependency of any controller.

## Known permanent constraint (not a bug to revisit)

Any future model with a foreign key into `user.id` must use `String`, not `Int`. This is fixed, upstream Better Auth behavior and will not change with library updates.

## Operational notes learned during this work

- Node's built-in `fetch` does not send an `Origin` header (unlike browsers) — Better Auth's CSRF check rejects unauthenticated-origin requests with `MISSING_OR_NULL_ORIGIN`. Manual test scripts (`test/index.js`) must set `"Origin": "http://localhost:3000"` explicitly, matching `trustedOrigins` in `auth.ts`.
- `scripts/verify-prisma.ts` required no changes despite the ID type migration — it has no explicit `id` type annotation and infers types from the regenerated Prisma Client automatically.

## Current file map (changed since `0002`)

- [prisma/schema.prisma](prisma/schema.prisma)
- [lib/auth.ts](lib/auth.ts)
- [src/main.ts](src/main.ts)
- [src/app.controller.ts](src/app.controller.ts)
- [src/module/user/user.controller.ts](src/module/user/user.controller.ts)
- [src/module/user/user.service.ts](src/module/user/user.service.ts)
- [package.json](package.json)

## Follow-up

- [ ] `create-user.dto.ts` is unused — decide whether to delete it or wire it into a future custom-signup path (e.g. admin-invites-a-user flow), per earlier discussion that was deferred in favor of pure Better Auth signup.

## References

- Better Auth issue confirming string-ID design is permanent: https://github.com/better-auth/better-auth/issues/2349
- Related adapter bug report (same root cause, different repro): https://github.com/better-auth/better-auth/issues/3450