# Security Overview

## Threat Model

### Assets
- User notes and personal data
- User authentication credentials
- Search functionality and metadata
- System availability

### Attackers
- **Network attackers**: Intercepting traffic, man-in-the-middle
- **Server compromise**: Database breach, application compromise
- **Client compromise**: Malware, keyloggers, browser exploits
- **Insider threats**: Malicious administrators
- **Supply chain attacks**: Compromised dependencies

### Security Goals
- **Confidentiality**: Notes remain private even from service operators
- **Integrity**: Notes cannot be tampered with undetected
- **Availability**: Service remains accessible to legitimate users
- **Authenticity**: Only authenticated users can access their data

## Cryptographic Design

### Key Hierarchy

```
Password (user-provided)
    ↓ Argon2id(m=131072, t=3, p=1)
Key Encryption Key (KEK)
    ↓ Wrap
User Master Key (UMK) [stored encrypted]
    ↓ HKDF-SHA256
├── Content Key → AES-GCM → Note content
└── Search Key → HMAC-SHA256 → Blind index
```

### Algorithm Choices

- **Password Hashing**: Argon2id (memory-hard, resistant to GPU attacks)
- **Key Wrapping**: AES-KW (NIST standard for key protection)
- **Content Encryption**: AES-GCM (authenticated encryption)
- **Key Derivation**: HKDF-SHA256 (NIST standard)
- **Blind Indexing**: HMAC-SHA256 (secure MAC)

### Security Parameters

```typescript
// Argon2id parameters (configurable)
const ARGON2_PARAMS = {
  m: 131072,    // 128 MiB memory
  t: 3,         // 3 iterations
  p: 1,         // 1 thread
};

// AES-GCM
const AES_KEY_LENGTH = 256;  // bits
const AES_IV_LENGTH = 96;    // bits (12 bytes)

// HMAC
const HMAC_KEY_LENGTH = 256; // bits
const HMAC_OUTPUT_LENGTH = 32; // bytes
```

## Security Features

### End-to-End Encryption

- **Client-side encryption**: All note content encrypted before transmission
- **Server blindness**: Server never sees plaintext or encryption keys
- **Key management**: Keys derived from user password, never stored server-side

### Authentication & Authorization

- **JWT tokens**: Short-lived access tokens (15 minutes)
- **Refresh tokens**: HttpOnly cookies for session management
- **Password hashing**: Argon2id with per-user salts
- **Owner scoping**: Database queries filtered by authenticated user ID

### Search Security

- **Blind indexing**: Server searches HMAC outputs, not plaintext
- **Client tokenization**: Search terms processed client-side
- **Rate limiting**: Prevents brute force attacks on search
- **Result pagination**: Limits information leakage

### Transport Security

- **TLS 1.3**: End-to-end encrypted connections
- **HSTS**: Prevents protocol downgrade attacks
- **Secure cookies**: HttpOnly, Secure, SameSite flags
- **CORS policy**: Restricts cross-origin requests

## Attack Mitigations

### Network Attacks

- **TLS encryption**: Protects data in transit
- **Certificate pinning**: Prevents fake certificate attacks
- **Request signing**: API requests include authentication tokens

### Server-Side Attacks

- **Input validation**: All inputs validated with strict schemas
- **SQL injection prevention**: Parameterized queries with TypeORM
- **XSS prevention**: Content Security Policy headers
- **CSRF protection**: SameSite cookie attributes

### Client-Side Attacks

- **Content Security Policy**: Restricts script execution
- **Subresource Integrity**: Validates CDN resources
- **Web Crypto API**: Hardware-accelerated cryptography
- **Memory zeroization**: Sensitive data cleared from memory

### Database Security

- **Encryption at rest**: Database files encrypted
- **Access controls**: Principle of least privilege
- **Audit logging**: Database access monitoring
- **Backup encryption**: Encrypted backup storage

## Security Monitoring

### Logging Strategy

- **No sensitive data**: Never log passwords, keys, or plaintext
- **Metadata only**: Log operation types, timestamps, user IDs
- **Rate limiting**: Monitor and block suspicious activity
- **Anomaly detection**: Automated threat detection

### Incident Response

- **Data classification**: Identify sensitive vs. non-sensitive data
- **Breach notification**: Automated alerts for security events
- **Key rotation**: Procedures for rotating encryption keys
- **Recovery procedures**: Secure data recovery processes

## Compliance Considerations

### Data Protection

- **GDPR compliance**: User data control and portability
- **Data minimization**: Only collect necessary user data
- **Retention policies**: Automatic data deletion
- **User consent**: Clear privacy policies and terms

### Security Standards

- **NIST guidelines**: Follow cryptographic standards
- **OWASP recommendations**: Web application security best practices
- **ISO 27001**: Information security management
- **Zero-trust architecture**: Never trust, always verify

## Known Limitations

### Current Scope

- **Browser dependency**: Relies on Web Crypto API support
- **Password-based**: Security depends on strong user passwords
- **Single device**: No cross-device key synchronization yet
- **No forward secrecy**: Old data remains accessible with current keys

### Future Enhancements

- **Hardware security**: Integration with hardware security modules
- **Multi-factor authentication**: Additional authentication factors
- **Key rotation**: Automatic key rotation for enhanced security
- **Secure sharing**: End-to-end encrypted note sharing

## Security Testing

### Automated Testing

- **Unit tests**: Cryptographic function validation
- **Integration tests**: API security validation
- **E2E tests**: Full user workflow security testing
- **Dependency scanning**: Automated vulnerability detection

### Manual Testing

- **Penetration testing**: External security assessments
- **Code review**: Security-focused code reviews
- **Threat modeling**: Regular threat model updates
- **Red team exercises**: Simulated attack scenarios

## Contact & Reporting

### Security Issues

- **Responsible disclosure**: Please report security issues privately
- **Bug bounty**: Security researchers welcome
- **Contact**: security@encrypted-notes.example.com
- **PGP key**: Available for encrypted communications

### Security Updates

- **Regular updates**: Security patches released promptly
- **Dependency monitoring**: Automated dependency updates
- **Security advisories**: Public security notifications
- **Upgrade guides**: Clear migration instructions