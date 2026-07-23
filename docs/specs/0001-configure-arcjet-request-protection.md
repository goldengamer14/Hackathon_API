# 0001. Current Arcjet protection baseline

**Date**: 2026-07-23
**Status**: Current

## Summary

The API currently boots with a single global Arcjet configuration in `AppModule` and applies protection to the controller routes by injecting the shared Arcjet client and calling `protect(req)` inside the controller request guard path.

The live behavior now reflects the current codebase rather than the earlier dry-run design:

- `ArcjetModule.forRoot()` is registered once in `AppModule`.
- `shield({ mode: 'LIVE' })` is enabled.
- `fixedWindow({ mode: 'LIVE', window: '60s', max: 20 })` is enabled.
- `GET /` and `GET /matches` both call the Arcjet guard path before they return their string payloads.
- A global `ResponseInterceptor` wraps plain string returns into the envelope shape `{ statusCode, message, data }`.

## Current context

The starter NestJS app already uses `@nestjs/common`, `@nestjs/core`, and `@arcjet/nest` with Express as its adapter. The server is configured to listen on port 3000 by default in `main.ts` and the `start:dev` watch mode is the normal local development path.

### Important runtime note

A `EADDRINUSE` error on port 3000 is not a Nest configuration problem. It means a previous `nest start --watch` process is still holding the port. The fix is to terminate the stale watcher and restart the server.

## Current implementation snapshot

### App wiring

- `AppModule` registers one global Arcjet configuration.
- `AppController` injects the Arcjet client via `@Inject(ARCJET)`.
- `assertAllowed(req)` runs before existing controller handlers return data.

### Response contract

`ResponseInterceptor` turns any controller return value into:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": "Hello World!"
}
```

This is the current response shape used by both `GET /` and `GET /matches`.

## Acceptance criteria for the current state

- **AC-1**: `AppModule` registers one global Arcjet module using `process.env.ARCJET_KEY`.
- **AC-2**: The configured rules are `shield` and `fixedWindow`, both in `LIVE` mode.
- **AC-3**: Controller routes call `protect(req)` before returning their response payloads.
- **AC-4**: Global response normalization is handled by `ResponseInterceptor` so endpoint handlers can still return plain values.
- **AC-5**: If dev startup fails with `EADDRINUSE`, the immediate root cause is a stale listener on port 3000 and not the Nest application code.

## Current file map

- [src/app.module.ts](src/app.module.ts)
- [src/app.controller.ts](src/app.controller.ts)
- [src/main.ts](src/main.ts)
- [src/utils/response.interceptor.ts](src/utils/response.interceptor.ts)

## Prisma Postgres integration update

The project has been wired for Prisma Postgres end-to-end without changing the current Arcjet request-protection baseline:

- `prisma/postgres link` was run against the provided database ID and persisted `DATABASE_URL` into `.env`.
- Prisma configuration now lives in `prisma.config.ts` and the schema is defined in `prisma/schema.prisma`.
- A server-side singleton was added at `lib/prisma.ts` using `@prisma/adapter-pg` and `PrismaClient`.
- A starter schema with `User` and `Post` models, a relation, and seed data is now in place.
- `scripts/verify-prisma.ts` is the connectivity proof script that prints `✅ Connected.` when the database read succeeds.

## Follow-up

- [ ] Add explicit integration tests for the response envelope contract.
- [ ] Add a dedicated HTTP-level test verifying Arcjet denial behavior on protected endpoints.
- [ ] Replace the starter `User`/`Post` schema with an application-specific Prisma model set.
