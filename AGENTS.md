# AGENTS.md

## Commands

- **Build all**: `yarn build`
- **Build single package**: `yarn workspace @encrypted-notes/<package> run build`
- **Dev all**: `yarn dev` (runs API + web concurrently)
- **Dev API**: `yarn workspace @encrypted-notes/api run start:dev`
- **Dev web**: `yarn workspace @encrypted-notes/web run dev`
- **Lint all**: `yarn lint`
- **Lint single**: `yarn workspace @encrypted-notes/<package> run lint`
- **Lint fix**: `yarn lint:fix`
- **Format**: `yarn format`
- **Test all**: `yarn test`
- **Test single package**: `yarn workspace @encrypted-notes/<package> run test`
- **Test single file**: `yarn workspace @encrypted-notes/<package> run test -- <test-file>` (Jest) or `yarn workspace @encrypted-notes/<package> run test <test-file>` (Vitest)
- **Test with pattern**: `yarn workspace @encrypted-notes/api run test -- --testNamePattern="<pattern>"` (Jest) or `yarn workspace @encrypted-notes/<package> run test --run --reporter=verbose <pattern>` (Vitest)
- **Test coverage**: `yarn workspace @encrypted-notes/<package> run test:ci`
- **Test e2e**: `yarn workspace @encrypted-notes/web run test:e2e` (Playwright)
- **Type check**: `yarn typecheck`
- **Clean**: `yarn clean`
- **Database migrations**: `yarn workspace @encrypted-notes/api run migration:generate/run/revert`
- **Seed database**: `yarn workspace @encrypted-notes/api run seed`

## Code Style

- **Language**: TypeScript (strict mode: noImplicitAny, strictNullChecks, strictBindCallApply)
- **Imports**: ES6 imports, group external libraries first, then internal modules (absolute paths preferred)
- **Formatting**: Prettier (semi: true, singleQuote: true, tabWidth: 2, printWidth: 80, trailingComma: es5)
- **Editor**: 2-space indentation, UTF-8, LF line endings, final newlines, trim trailing whitespace
- **Types**: Strict TypeScript, no `any` types except for external APIs, explicit return types
- **Naming**: camelCase for variables/functions/methods, PascalCase for classes/components/interfaces, UPPER_SNAKE_CASE for constants
- **Error handling**: try/catch for async operations, throw descriptive Error objects, validate inputs with Zod schemas
- **Security**: Never log passwords/keys/plaintext, use Web Crypto API or Node.js crypto, zeroize sensitive data, validate all inputs
- **Comments**: JSDoc for public APIs only, avoid inline comments for obvious code, document complex crypto operations
- **Linting**: ESLint with TypeScript rules, no unused vars (except prefixed with \_), warn on console.log

## Architecture

- **Monorepo**: Yarn workspaces (common/api/web packages)
- **Backend**: NestJS with TypeORM, PostgreSQL, JWT auth, REST API
- **Frontend**: React with Vite, Material-UI, React Query, functional components with hooks
- **Encryption**: End-to-end AES-GCM + HKDF + Argon2id + HMAC-SHA256, client-side crypto, server never sees plaintext
- **State**: Immutable updates, React Query for server state, avoid direct mutation
- **Testing**: Vitest (common/web), Jest (api), Playwright (e2e), coverage reporting
- **Validation**: Zod schemas for runtime validation, class-validator for API DTOs
