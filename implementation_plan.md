# BLMS phased implementation plan

This project is intentionally delivered in working increments. Each phase ends with verification before the next phase begins.

## Phase 1 — foundation

- [NEW] npm-workspaces monorepo for `apps/web`, `apps/api`, `apps/identity-gateway`, `blockchain`, `packages/shared`, `data`, `scripts`, and `storage`.
- [NEW] local environment defaults, shared TypeScript types/schemas, repository scripts, and project documentation.
- [NEW] development-only seed data for four users, synthetic land records, audit events, and demo credentials.
- Verification: install dependencies, TypeScript checks, and workspace smoke tests.

## Phase 2 — local demo journey

- [NEW] Express API under `/api/v1` with HTTP-only JWT authentication, role checks, validation, health endpoints, audit events, and a `LedgerService` adapter contract.
- [NEW] deterministic in-memory `MockLedgerService` for registration, search, listing, cancellation, transfer, history, and revenue summary.
- [NEW] React/Vite dashboard with role-aware navigation, mock-mode badge, parcel search, marketplace, registration, listing, purchase, and parcel history flows.
- Verification: API unit/integration tests, web typecheck/build, and a smoke request against the running API.

## Phase 3 — identity and document vault

- Synthetic NIN gateway with 200+ records and masked logging.
- Local IPFS service, safe uploads, CID persistence, and document MATCH/MISMATCH verification.
- API contract tests for identity and document failures.

## Phase 4 — optional Fabric research track

- Optional Fabric 2.5 two-organisation network with three Raft orderers, CouchDB, TLS, CAs, peers, channel scripts, and health/reset commands.
- Go land chaincode, endorsement policy, transaction context identity checks, history, events, and unit tests.
- This phase is not required for local testing, static hosting, or the offline demo acceptance path.

### Phase 4 progress

- Go land chaincode contract added with the required land lifecycle and certificate-attribute checks.
- Fabric network topology and Node Gateway adapter are still pending.

## Phase 5 — Fabric adapter

- Implement `FabricLedgerService` against the same contract as the mock adapter.
- Make `LEDGER_MODE=fabric` explicit and fail honestly when Fabric is unavailable.
- Run API contract tests in both modes where services are available.

## Phase 6 — hardening and demonstration

- End-to-end tests, Caliper workloads/configuration, repeatable seed/demo scripts, OpenAPI reference, architecture diagram, troubleshooting, and final documentation.
- Run the complete verification matrix and record only real benchmark results.

### Docker-free progress

- Government levy management, system health, profile, dedicated document verification, local reset, offline walkthrough, and OpenAPI reference are implemented.
- Browser-level E2E automation and Caliper execution remain pending; the current workflow is manually browser-verified and covered by API/identity tests.

## Phase 7 — static deployment and offline parity

- Browser-local adapter for authentication, land lifecycle, synthetic identity, document CID checks, audit, and simulated revenue.
- Netlify SPA configuration with no required environment variables.
- Keep the API/Fabric paths available as optional integration modes.

## Current slice

Phases 1–3, the offline/static deployment slice, and the main Docker-free government/demo workflows are implemented. The default web build uses the browser-local adapter and requires no API, Docker, IPFS, Fabric, or environment variables. API, Kubo, and Fabric remain optional integration tracks.
