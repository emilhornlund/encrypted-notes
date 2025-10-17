# AGENTS.md

## Commands

- **Build all**: `yarn build`
- **Build API**: `yarn workspace @encrypted-notes/api run build`
- **Build web**: `yarn workspace @encrypted-notes/web run build`
- **Dev all**: `yarn dev` (runs API + web concurrently)
- **Dev API**: `yarn workspace @encrypted-notes/api run start:dev`
- **Dev web**: `yarn workspace @encrypted-notes/web run dev`
- **Lint**: `yarn lint` or `yarn lint:fix`
- **Test**: `yarn test` (all), `yarn workspace @encrypted-notes/<package> run test` (single package)
- **Test single file**: `yarn workspace @encrypted-notes/<package> run test -- <test-file>` (Jest) or `yarn workspace @encrypted-notes/<package> run test <test-file>` (Vitest)
- **Test with pattern**: `yarn workspace @encrypted-notes/api run test -- --testNamePattern="<pattern>"` (Jest) or `yarn workspace @encrypted-notes/<package> run test --run --reporter=verbose <pattern>` (Vitest)
- **Test coverage**: `yarn workspace @encrypted-notes/<package> run test:ci`
- **Test e2e**: `yarn workspace @encrypted-notes/web run test:e2e` (Playwright)
- **Clean**: `yarn clean`
- **Database migrations**: `yarn workspace @encrypted-notes/api run migration:generate/run/revert`
- **Seed database**: `yarn workspace @encrypted-notes/api run seed`

## Code Style

- **Language**: TypeScript (strict: noImplicitAny, strictNullChecks, strictBindCallApply)
- **Imports**: ES6, external libs first, then internal (absolute paths preferred), sorted with eslint-plugin-simple-import-sort
- **Formatting**: Prettier (semi: true, singleQuote: true, tabWidth: 2, printWidth: 80, trailingComma: es5)
- **Editor**: 2-space indent, UTF-8, LF endings, final newlines, trim whitespace
- **Types**: Strict TS, no `any` except external APIs, explicit return types
- **Naming**: camelCase vars/functions, PascalCase classes/components, UPPER_SNAKE_CASE constants
- **Error handling**: try/catch async ops, descriptive Error objects, Zod validation
- **Security**: Never log secrets/plaintext, use Web Crypto API/Node crypto, zeroize sensitive data
- **Comments**: JSDoc public APIs only, document complex crypto ops
- **Linting**: ESLint + TS rules, import/export sorting, no unused vars (\_ prefix ok), console.log warnings (20 max)

## Architecture

- **Monorepo**: Yarn workspaces (common/api/web packages)
- **Backend**: NestJS with TypeORM, PostgreSQL, JWT auth, REST API
- **Frontend**: React with Vite, Material-UI, React Query, functional components with hooks
- **Encryption**: End-to-end AES-GCM + HKDF + Argon2id + HMAC-SHA256, client-side crypto, server never sees plaintext
- **State**: Immutable updates, React Query for server state, avoid direct mutation
- **Testing**: Vitest (common/web), Jest (api), Playwright (e2e), coverage reporting
- **Validation**: Zod schemas for runtime validation, class-validator for API DTOs

## Quality Gate

Before completing tasks, ensure: `yarn lint && yarn build && yarn test`
