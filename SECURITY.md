# Security Policy

## Supported version

The current `main` branch is the supported version of FitFlow. Older snapshots, experimental branches, and historical releases may not receive security fixes.

## Reporting a vulnerability

Please do **not** publish exploit details, credentials, personal data, or sensitive reproduction material in a public GitHub issue.

If you discover a security issue:

1. Contact the repository owner through the GitHub profile and request a private channel for the report.
2. Include the affected feature, impact, reproduction steps, and the minimum evidence required to understand the issue.
3. Redact real credentials, personal data, and third-party secrets.
4. Allow time for triage and remediation before public disclosure.

A public issue is appropriate only for non-sensitive hardening suggestions that do not expose an exploitable vulnerability.

## Scope

Useful reports include script injection, unsafe DOM handling, service-worker or cache behavior that exposes sensitive content, dependency vulnerabilities with practical impact, unsafe external-link behavior, and production configuration that creates a concrete security risk.

FitFlow intentionally stores training progress locally on the user's device and does not implement an account or payment backend. Findings that assume nonexistent server-side identity, payment, or multi-user data are outside the current product scope.

## Security baseline

FitFlow uses a static-first application architecture with repeatable lint/build checks in CI. Security fixes should include a regression test or explicit verification step whenever practical.
