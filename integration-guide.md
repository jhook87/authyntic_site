# Integration Guide: Authyntic Site & AuthynticDemo

This guide explains how to deliver a seamless, secure experience between the Authyntic marketing site and the AuthynticDemo application.

## 1. Authentication Flow

1. **User lands on authynticdefense.com** and requests access.
2. **Login page submits credentials** to `/api/auth/login` (see `server.js`).
3. **Server validates credentials** with Argon2id hashed passwords stored in a secure database (PostgreSQL or similar).
4. **JWT issued** containing the user ID, organization, roles, and session expiry. Use short lifetimes (≤ 15 minutes) with refresh tokens.
5. **JWT stored in HttpOnly cookies** scoped to the shared parent domain (`.authynticdefense.com`).
6. **Browser redirected to AuthynticDemo** with existing session; the demo validates the JWT signature before granting access.

## 2. Session Management

- Enforce rolling session expiration and rotate refresh tokens on each use.
- Include device identifiers or WebAuthn attestation for high-risk accounts.
- Maintain an audit log capturing authentication attempts, IP, user agent, and decisions.
- Implement background token revocation when demo access is rescinded.

## 3. Authorization Strategy

- Align JWT claims with demo roles (viewer, operator, admin).
- Use middleware in AuthynticDemo to validate claims and enforce least privilege.
- Apply authorization checks to every API route and websocket connection.

## 4. Security Controls

- **HTTPS only**: enforce HSTS with a minimum 6-month max-age.
- **CSRF protection**: pair HttpOnly cookies with CSRF tokens, double-submit strategy, or SameSite settings where compatible.
- **Rate limiting**: throttle login attempts, backing off exponentially on repeated failures.
- **Content Security Policy**: restrict script sources to self, lock down framing, and report violations.
- **Audit logging**: log every authentication attempt and demo launch for traceability.

## 5. Analytics & Telemetry

Capture mission-critical events to support sales and operations follow-up:

- Successful logins and failed attempts (without storing plaintext passwords).
- Navigation from marketing site to demo entry points.
- Feature usage within AuthynticDemo (e.g., signal review, attestation exports).
- Session duration and completion of targeted workflows.

Use a privacy-conscious analytics platform that supports secure event forwarding (e.g., self-hosted PostHog or Segment with regional routing).

## 6. Deployment Notes

- Serve the static site from a CDN-backed object store (S3/CloudFront, Cloudflare R2, etc.).
- Deploy the Node.js API close to the demo infrastructure to minimize latency.
- Automate infrastructure with IaC (Terraform, Pulumi) and enforce environment parity.
- Monitor uptime and integrity metrics via centralized observability (Grafana, Datadog).

Following these practices preserves user trust and ensures that only authorized operators gain access to the AuthynticDemo environment.
