# Architecture Overview

## System Design

Encrypted Notes is a secure note-taking application that implements end-to-end encryption with searchable capabilities. The system is designed as a monorepo with three main packages: common utilities, API server, and web client.

## Core Principles

1. **End-to-End Encryption**: All note content is encrypted client-side
2. **Zero-Knowledge Architecture**: Server cannot access plaintext data
3. **Searchable Encryption**: Blind indexing enables secure search functionality
4. **Multi-device Sync**: Secure synchronization across user devices

## Package Structure

### packages/common
Shared TypeScript utilities and cryptographic functions:

- **Crypto Utilities**: AES-GCM, HKDF, Argon2id implementations
- **DTOs**: Type-safe data transfer objects for API communication
- **Validation**: Zod schemas for input validation
- **Types**: Shared TypeScript interfaces and types

### packages/api
NestJS REST API server with PostgreSQL:

- **Authentication**: JWT-based auth with refresh tokens
- **Entities**: TypeORM entities for database schema
- **Modules**: Organized by feature (auth, notes, tags, search)
- **Guards**: Owner-based access control
- **Migrations**: Database schema management

### packages/web
React frontend with Vite:

- **Components**: Material-UI based UI components
- **Hooks**: React Query for data fetching
- **Crypto Worker**: Web Worker for cryptographic operations
- **State Management**: React Context for authentication
- **Routing**: React Router for navigation

## Cryptographic Architecture

### Key Hierarchy

```
Master Password
    ↓ (Argon2id)
User Master Key (UMK)
    ↓ (HKDF)
├── Content Key → AES-GCM → Note Content
└── Search Key → HMAC-SHA256 → Blind Index
```

### Encryption Flow

1. **Registration/Login**:
   - User provides password
   - Argon2id derives Key Encryption Key (KEK)
   - KEK wraps User Master Key (UMK) for storage

2. **Note Creation**:
   - HKDF derives content key from UMK
   - AES-GCM encrypts note content
   - HMAC-SHA256 creates blind index terms
   - Encrypted data + blind index stored server-side

3. **Search**:
   - Client tokenizes query
   - HMAC-SHA256 generates search terms
   - Server searches blind index (no decryption)
   - Returns note IDs for client-side decryption

### Database Schema

```sql
-- Users with encrypted master keys
users (
  id uuid PK,
  email text UNIQUE,
  password_hash text,
  wrapped_umk bytea,
  salt bytea,
  argon2_params jsonb
)

-- Encrypted notes
notes (
  id uuid PK,
  owner_id uuid FK→users(id),
  title_ct bytea,  -- encrypted title
  body_ct bytea,   -- encrypted body
  iv_title bytea,  -- initialization vector
  iv_body bytea
)

-- Blind index for search
note_terms (
  note_id uuid FK→notes(id),
  term_hash bytea,  -- HMAC(search_key, token)
  PRIMARY KEY (note_id, term_hash)
)

-- Encrypted tags
tags (
  id uuid PK,
  owner_id uuid FK→users(id),
  tag_ct bytea,
  iv_tag bytea
)

-- Note-tag relationships
note_tags (
  note_id uuid FK→notes(id),
  tag_id uuid FK→tags(id)
)

-- Tag search index
tag_terms (
  tag_id uuid FK→tags(id),
  term_hash bytea
)
```

## Security Considerations

### Threat Model

- **Server Compromise**: Cannot access plaintext due to E2EE
- **Network Interception**: TLS protects transport, encryption protects content
- **Client Compromise**: Local encryption keys protect against keyloggers
- **Database Breach**: Only encrypted data and blind indexes exposed

### Key Management

- **Password-based**: Argon2id with configurable parameters
- **Key Derivation**: HKDF for domain separation
- **Storage**: Wrapped keys stored server-side
- **Memory**: Sensitive data zeroized when possible

### Search Security

- **Blind Indexing**: Server searches encrypted terms
- **Tokenization**: Client-side text processing
- **N-grams**: Prefix search support
- **Rate Limiting**: Prevents brute force attacks

## Performance Considerations

### Client-Side Operations

- **Web Workers**: Crypto operations off main thread
- **IndexedDB**: Ciphertext caching
- **Debounced Saves**: Reduce API calls during editing

### Server-Side Operations

- **Database Indexes**: Optimized for blind index searches
- **Pagination**: Limit result sets
- **Connection Pooling**: Efficient database connections

### Search Optimization

- **Edge N-grams**: Support for partial matches
- **Term Deduplication**: Reduce index size
- **Batch Operations**: Efficient bulk updates

## Development Workflow

### Local Development

1. **Database**: Docker Compose for PostgreSQL
2. **API**: Hot reload with NestJS CLI
3. **Web**: Vite dev server with HMR
4. **Testing**: Vitest for unit tests, Playwright for E2E

### CI/CD Pipeline

- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Testing**: Unit and integration tests
- **Build**: Multi-stage Docker builds
- **Security**: Dependency scanning and SAST

## Deployment Architecture

### Production Setup

- **API**: Node.js with PM2 clustering
- **Database**: PostgreSQL with connection pooling
- **Web**: Static hosting (Vercel, Netlify)
- **CDN**: CloudFlare for global distribution
- **Monitoring**: Application and infrastructure metrics

### Scaling Considerations

- **Horizontal Scaling**: Stateless API servers
- **Database Sharding**: By user ID for large deployments
- **CDN**: Static assets and API responses
- **Caching**: Redis for session and rate limit data

## Future Enhancements

### Planned Features

- **Collaborative Editing**: Secure sharing with key exchange
- **Offline Support**: Service Worker with local encryption
- **Advanced Search**: Fuzzy matching and filters
- **File Attachments**: Encrypted file storage
- **Mobile Apps**: React Native implementation

### Technical Debt

- **WebAssembly**: Faster crypto with WASM implementations
- **Streaming**: Real-time sync with WebSockets
- **Compression**: Reduce storage and bandwidth usage
- **Audit Logging**: Security event monitoring