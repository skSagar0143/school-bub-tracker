# School Bus Tracker — Backend Architecture

## Architectural style

This application is a **modular monolith** built with Java 21 and Spring Boot. It is deployed as one application and one database initially, while business capabilities remain isolated in modules. Do not split modules into microservices without a demonstrated scaling or ownership need.

The code follows a pragmatic Clean Architecture / Hexagonal Architecture inside each business module:

- **api** — HTTP controllers, request/response DTOs and API mapping. No business rules or repository access.
- **application** — use cases, orchestration, transaction boundaries and application ports.
- **domain** — entities, value objects, domain policies and domain events. Must not depend on Spring MVC or persistence implementation.
- **infrastructure** — JPA repositories, external provider adapters, Kafka adapters and implementations of application ports.

Dependencies point inward: api and infrastructure may depend on application; application may depend on domain; domain depends on no outer layer. Infrastructure implements ports declared by application/domain.

## Package layout

```text
com.bus
├── BusTrackerApplication.java
├── common
│   ├── api                 # shared API envelope and pagination contracts
│   ├── audit               # audit infrastructure
│   ├── config              # application-wide configuration
│   ├── exception           # exception mapping
│   └── util                # small, genuinely shared utilities
├── security
│   ├── config              # Spring Security and CORS
│   └── jwt                 # JWT creation, parsing and request authentication
└── modules
    ├── identity            # users, credentials, roles, login and refresh sessions
    ├── school              # school/tenant profile and settings
    ├── student             # student profiles and school enrolment
    ├── parent              # parent profiles and parent-child relationships
    ├── driver              # driver profiles and driver assignment
    ├── bus                 # vehicle registry and operational status
    ├── route               # routes, stops and student-route assignments
    ├── trip                # trip lifecycle and boarding/drop-off confirmation
    ├── tracking            # GPS ingestion, latest position and geofence evaluation
    ├── notification        # notification preferences, delivery and history
    └── reporting           # operational dashboards and reports
```

Each module owns its own `api`, `application`, `domain` and `infrastructure` packages. Add implementation classes only when that module's use cases are introduced; do not create empty generic service/repository layers.

## Core roles and access boundaries

- **SCHOOL_ADMIN** manages only the school(s) explicitly assigned to that account.
- **DRIVER** can access only assigned buses and active trips; can submit location and confirm boarding/drop-off.
- **PARENT** can view only children linked to that parent and the bus/trip assigned to those children.
- **SUPER_ADMIN** is an optional platform operator role, separate from school-level administration.

Never authorize access merely because a client supplies a school, student, bus or trip ID. Resolve the authenticated principal and verify the relationship/assignment in the application use case.

## Important workflows

### Trip and child safety

1. Admin configures buses, drivers, routes, stops and student assignments.
2. Driver starts an assigned trip.
3. Driver app sends GPS updates. Tracking validates the active trip and records the latest position.
4. Tracking evaluates configured route/geofence rules and emits domain events.
5. Driver explicitly confirms a child's boarding or drop-off (QR/manual confirmation can be added). GPS proximity alone must never mark a child boarded or dropped off.
6. Notification consumes events and sends parent alerts; delivery attempts and outcomes are persisted.

### Event processing

Use normal application use cases and MySQL transactions for commands and authoritative state changes. Use Kafka for asynchronous events such as location updates, trip lifecycle, boarding/drop-off, geofence proximity, notifications and audit. Design consumers to be idempotent using event IDs; configure bounded retries and a dead-letter topic. Do not use Kafka as a replacement for relational transactions.

### Live tracking

Persist the latest bus position and timestamp, reject or flag stale/out-of-order updates, and publish authorized live updates over WebSocket. Parent subscriptions must be checked against parent-child and trip assignments. Do not broadcast every bus location to every connected client.

## Persistence and infrastructure

- MySQL is the source of truth for users, school relationships, students, buses, routes, trips, confirmations and notification history.
- Redis is an optimization for short-lived/latest tracking state, rate limits or caching; it is not the source of truth.
- Kafka is for asynchronous domain integration.
- WebSocket is for authorized live updates.
- External push/SMS/WhatsApp providers are adapters behind notification ports; do not promise a free WhatsApp channel.

Keep schema changes deliberate. Hibernate `ddl-auto=update` is acceptable only during the initial local bootstrap; move to versioned migrations before shared/staging/production data is introduced.

## Security

- Stateless access-token authentication; never store passwords in plain text. Store BCrypt password hashes.
- Keep signing secrets outside Git, supplied through environment variables or a secret manager.
- Use short-lived access tokens. Implement refresh-token rotation and revocation as persisted, hashed sessions in the identity module before production.
- Enforce authorization at the use-case/service boundary as well as HTTP route boundaries.
- Restrict CORS to known frontend origins; never use wildcard origins with credentials.
- Avoid logging tokens, passwords, child personal data or precise location payloads.

## Development sequence

1. Architecture, configuration, common error/API contracts and security foundation.
2. Identity, login/refresh and role/permission model.
3. School, parent, student, driver and bus master data.
4. Routes, stops and assignments.
5. Trip lifecycle and explicit boarding/drop-off.
6. GPS ingestion, geofencing, Kafka and WebSocket.
7. Notification delivery, retries, history and operational dashboards.
8. Automated tests, Docker, CI/CD and deployment hardening.
