# Security Policy

## Supported Versions

Only the current major version is supported for security updates. 

| Version | Supported          |
| ------- | ------------------ |
| v1.0.x  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within AgriFlux, please send an e-mail to security@agriflux.ai. All security vulnerabilities will be promptly addressed.

## Security Best Practices Implemented
- **Rate Limiting**: API routes are protected against brute-force attacks via `express-rate-limit`.
- **HTTP Headers**: Secure HTTP headers are enforced using `helmet`.
- **Authentication**: JWT-based authentication with bcrypt password hashing.
- **Payload Compression**: Responses are compressed via `compression` middleware to optimize bandwidth.
- **Environment Secrets**: All secrets (JWT, Ports) are strictly managed via environment variables.
