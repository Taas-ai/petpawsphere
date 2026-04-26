# Contributing to PetPawSphere

Thank you for your interest in contributing! This document outlines the process.

## Code of Conduct

Be respectful. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

## How to Contribute

### Reporting Bugs

Open an issue with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, browser)

**Security vulnerabilities**: see [SECURITY.md](SECURITY.md) — do not use public issues.

### Proposing Features

Open an issue tagged `enhancement` before writing code. This ensures alignment with the roadmap and avoids wasted effort.

### Pull Requests

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Write tests for new API endpoints (vitest)
3. Ensure all tests pass: `npx vitest run`
4. Follow the existing TypeScript strict-mode conventions
5. Keep PRs focused — one feature or fix per PR
6. Update relevant documentation

### Commit Format

```
type(scope): description

Examples:
feat(pets): add photo upload endpoint
fix(auth): handle token expiry race condition
docs(readme): update deployment instructions
test(matches): add edge case for same-owner match
```

## Development Setup

```bash
npm install
cp .env.example .env
# Fill in credentials (see README)
npx vitest run  # All tests should pass before you start
```

## Standards

- **TypeScript strict mode** — no `any` except documented workarounds
- **OWASP Top 10** — all endpoints must pass security review
- **UAE PDPL** — new data collection requires justification and is subject to data minimization
- **Tests required** — new routes need at minimum a happy-path and a 401 test

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).

For commercial licensing inquiries: **admin@taurusai.io**
