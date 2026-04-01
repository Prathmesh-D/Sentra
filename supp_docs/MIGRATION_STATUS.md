# Migration Status Ledger

Last updated: 2026-01-20

## Backend Module Status

| Module Name | Migration Status | Risk Level | Notes |
|---|---|---|---|
| App Bootstrap & Runtime | MIGRATED | HIGH | Final module; Java startup wiring matches legacy init order, logging, CORS, JWT, routes |
| Database Access & Schema | NOT STARTED | MEDIUM | Must tolerate loose/dirty MongoDB data |
| Auth & Identity | MIGRATED | MEDIUM-HIGH | Java module added; JWT claims/identity preserved; bcrypt rounds and RSA key PEM preserved |
| Recipients & Contacts | MIGRATED | MEDIUM-LOW | Java class added; behavior preserved; no corrections |
| User Stats & Dashboard | MIGRATED | MEDIUM | Java module added; aggregation parity preserved; strict error behavior on malformed data |
| File Inbox/Outbox & Lifecycle | MIGRATED | MEDIUM | Java module added; filesystem path semantics preserved; cleanup and lifecycle transitions preserved |
| Crypto Core Engine | NOT STARTED | HIGH | Contract-defining file formats |
| Crypto Service Adapter | NOT STARTED | HIGH | Contract-defining metadata/keys |
| Encryption API Workflow | NOT STARTED | HIGH | Contract-defining API behavior |
| Auto Mode Tagging | IN PROGRESS | LOW | Deterministic file-type tagging rules |
| Health Endpoint | NOT STARTED | LOW | Basic health response |
