# Encrypted Notes

A secure, end-to-end encrypted note-taking application with searchable blind indexing.

## Features

- **End-to-End Encryption**: Notes are encrypted client-side, server never sees plaintext
- **Searchable Encryption**: Blind indexing allows searching without decrypting all notes
- **Multi-device Sync**: Secure synchronization across devices
- **Modern UI**: Built with React, Material-UI, and TypeScript
- **REST API**: NestJS backend with PostgreSQL

## Architecture

This monorepo contains three packages:

- `packages/common`: Shared TypeScript utilities, crypto functions, and DTOs
- `packages/api`: NestJS REST API server with PostgreSQL
- `packages/web`: React frontend with Vite

## Quick Start

### Prerequisites

- Node.js 20+
- Yarn
- Docker (for PostgreSQL)

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd encrypted-notes
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start PostgreSQL:
   ```bash
   docker compose up -d postgres
   ```

4. Start the API server:
   ```bash
   yarn dev:api
   ```

5. Start the web client:
   ```bash
   yarn dev:web
   ```

6. Open http://localhost:3000 in your browser

## Development

### Available Scripts

- `yarn build` - Build all packages
- `yarn dev` - Start all development servers
- `yarn dev:api` - Start API server only
- `yarn dev:web` - Start web client only
- `yarn lint` - Lint all packages
- `yarn test` - Run all tests

### Project Structure

```
encrypted-notes/
├── packages/
│   ├── common/          # Shared utilities and crypto
│   ├── api/            # NestJS backend
│   └── web/            # React frontend
├── docker-compose.yml  # Development database
└── docs/              # Documentation
```

## Security

This application implements end-to-end encryption using:

- **AES-GCM** for content encryption
- **HKDF** for key derivation
- **Argon2id** for password hashing
- **HMAC-SHA256** for blind indexing

See [SECURITY.md](SECURITY.md) for detailed security information.

## API Documentation

When running in development, API docs are available at:
http://localhost:3001/api/docs

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Ensure all checks pass before submitting PRs

## License

MIT