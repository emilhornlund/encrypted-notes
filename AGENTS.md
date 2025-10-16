# AGENTS.md

## Commands
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Test all**: `npm test`
- **Test single**: `npm test -- <test-file-path>` or `npm test -- --testNamePattern="<test-name>"`
- **Type check**: `npm run type-check` (if available) or `npx tsc --noEmit`

## Code Style
- **Language**: TypeScript/JavaScript
- **Imports**: Use ES6 imports, group by external libraries first, then internal modules
- **Formatting**: Use Prettier with 2-space indentation
- **Types**: Strict TypeScript with no `any` types except for external APIs
- **Naming**: camelCase for variables/functions, PascalCase for classes/components
- **Error handling**: Use try/catch for async operations, throw descriptive errors
- **Security**: Never log sensitive data, use crypto APIs properly for encryption
- **Comments**: Add JSDoc for public APIs, avoid inline comments for obvious code

## Architecture
- **Encryption**: Use Web Crypto API or Node.js crypto for all encryption operations
- **State**: Immutable state updates, avoid direct mutation
- **Components**: Functional components with hooks, avoid class components
- **Testing**: Unit tests for utilities, integration tests for components