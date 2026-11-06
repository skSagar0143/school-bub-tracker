# School Bus Tracker — Backend Architecture

## Architectural style

The backend is a **modular monolith** built with Java 21 and Spring Boot. It runs as one application with one MySQL database. Each business feature owns its entity, repository, service and controller packages. Keep the structure straightforward; do not introduce microservices or unnecessary abstraction layers.

## Package structure

```text
com.bus
├── BusTrackerApplication.java
├── common
│   ├── api
│   ├── exception
│   ├── audit
│   └── util
├── config
│   └── OpenApiConfig.java
├── security
│   ├── config
│   └── jwt
└── modules
    ├── school
    │   ├── controller
    │   ├── dto
    │   ├── entity
    │   ├── repository
    │   └── service
    ├── user
    │   ├── controller
    │   ├── entity
    │   ├── repository
    │   └── service
    ├── student
    ├── parent
    ├── driver
    ├── bus
    ├── route
    ├── trip
    ├── tracking
    ├── notification
    └── reporting
```

For each feature, use the same simple package convention:

- **entity** — JPA entity and feature enums.
- **repository** — Spring Data repository interfaces.
- **service** — business logic and transaction boundaries.
- **controller** — REST endpoints.
- **dto** — request and response records where needed.

Do not create empty layers, generic base repositories, or extra adapters unless a concrete use case requires them. Keep feature-specific logic inside its module. Shared concerns belong in `common`, `config`, or `security`.

## Current School module

The School module is the first completed feature and supports the single-school installation:

- Create one school profile.
- Read the configured school.
- Update school details.
- Activate or deactivate the school.
- Enforce unique school code and prevent creating a second school in this single-school phase.

## API conventions

The application context path is `/sm`, so feature controllers use short paths without `/api/v1`:

- `/school`
- `/user`
- `/student`
- `/parent`
- `/driver`
- `/bus`
- `/route`
- `/trip`

Example: `http://localhost:8080/sm/school`.

Swagger UI: `http://localhost:8080/sm/swagger-ui.html`.

## Core roles and access boundaries

- **SCHOOL_ADMIN** manages the configured school and its users.
- **DRIVER** can access only assigned buses and active trips.
- **PARENT** can view only linked children and their assigned bus/trip.
- **STUDENT** can access only their permitted student features.
- Super Admin and multi-tenant administration are deferred.

Never authorize access merely because a client supplies a school, student, bus or trip ID. Resolve the authenticated principal and verify the relationship/assignment.

## Important workflows

1. Admin configures school, buses, drivers, routes, stops and student assignments.
2. Driver starts an assigned trip.
3. Driver app sends GPS updates. Tracking validates the active trip and records the latest position.
4. Tracking evaluates configured route/geofence rules and emits events.
5. Driver explicitly confirms boarding or drop-off. GPS proximity alone must never mark a child boarded or dropped off.
6. Notification consumes events and sends parent alerts; delivery attempts and outcomes are persisted.

Use MySQL as the source of truth. Redis is an optimization for latest tracking state and caching. Kafka is for asynchronous events, with idempotent consumers, bounded retries and dead-letter handling. WebSocket updates must be authorized per parent-child and trip assignment.

## Security

- Never store passwords in plain text; use BCrypt hashes.
- Keep JWT signing keys outside Git.
- Use short-lived access tokens and persisted, hashed refresh sessions.
- Enforce role and relationship checks on backend endpoints and service operations.
- Restrict CORS to known frontend origins.
- Never log passwords, tokens, child personal data or precise location payloads.

Hibernate `ddl-auto=update` is for local development only. Add versioned migrations before shared or production data is introduced.
