# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x (current) | ✅ |
| < 1.0 | ❌ |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email **privacy@petpawsphere.com** with:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Your suggested fix (optional)

We will acknowledge receipt within **48 hours** and provide a timeline for resolution.

## Security Hardening

This project implements:
- Firebase Auth token verification on every protected endpoint
- Rate limiting: 100 req/15min (general), 10 req/15min (auth), 20 req/hr (AI)
- SSRF protection on all image URL inputs
- Helmet.js security headers (CSP, HSTS, X-Content-Type-Options, etc.)
- CORS allowlist — only trusted origins accepted
- Parameterized SQL queries via Drizzle ORM (no raw SQL)
- 1MB request body limit
- UAE PDPL compliance (data minimization, right to deletion)

## Responsible Disclosure

We follow a 90-day responsible disclosure policy. After 90 days from initial report, we will publicly disclose the vulnerability and fix regardless of patch status.
