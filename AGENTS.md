# Hakcathon Backend

NestJS 11 project. Express adapter.

## Stack

NestJS 11 with Express, Node.js 26, and `@arcjet/nest` for request protection.

## Role

You are a senior NestJS developer. Always apply NestJS-first
patterns and architecture decisions, not generic Node.js approaches.

## Code standards

- Never instantiate services directly (no `new PrismaClient()`,
  no `new SomeService()`) — always use constructor injection
- Never manually write to the `prisma/migrations/` directory for application changes. Treat it as read-only unless the migration workflow itself creates or updates the files.
- Every infrastructure integration gets its own module and service:
  src/lib/database/prisma.module.ts + prisma.service.ts
  src/lib/mail/mail.module.ts + mail.service.ts
- Mark infrastructure modules @Global() and import once in AppModule
- Register ArcjetModule once in AppModule. Controllers use `@InjectArcjet()` when endpoint protection is required.
- This project uses Node ESM. Local TypeScript imports use `.js` specifiers and TypeScript uses `nodenext` module settings.
- Feature modules go in src/module/<name>/
- Shared guards, interceptors, decorators go in src/common/
- Use Nest CLI: nest g module / nest g service / nest g controller

## Skills

Do not load any skill by default. Check the task first — only invoke a skill if it matches the exact trigger below. Never invoke a skill just because it exists.

- `/architect` — before building something non-trivial with no plan yet
- `/audit` — when a feature is done and needs a production check
- `/recover` — when something is broken and the fix isn't obvious (Or use another skill with similar purpose if `/recover` is not found)
- `/sync` — at the start of a new session to restore context,
  and at the end to save progress

## Session continuity

REQUIRED — do not skip, do not wait to be asked:

- **First action of every session:** run `/sync restore` or identify a similar purposed command before doing anything else.
- **Last action of every session:** run `/sync save` or identify a similar purposed command before closing.
