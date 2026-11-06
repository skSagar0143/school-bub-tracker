# Phase 1 — Authentication

## Local prerequisites

- Java 21
- MySQL 8 with a database named `bus_tracker`
- RSA PEM files under `backend/bus-tracker/secrets/`:
  - `private_key.pem` — unencrypted PKCS#8 private key
  - `public_key.pem` — X.509 SubjectPublicKeyInfo public key
- Node.js 22 or newer

The PEM files are local secrets and must never be committed. The backend defaults to the paths above; use `JWT_PRIVATE_KEY_PATH` and `JWT_PUBLIC_KEY_PATH` to override them.

## Start the backend

Open `backend/bus-tracker` in STS and run `com.bus.BusTrackerApplication`.

Or from a terminal:

```powershell
cd backend/bus-tracker
.\mvnw.cmd spring-boot:run
```

Default API base URL: `http://localhost:8081/api/v1`.

The backend uses the configured `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` environment variables. For local development, the defaults in `application.properties` are retained.

## Start the frontend

Open another terminal:

```powershell
cd frontend/web-app
npm ci
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). Set `VITE_API_BASE_URL` if the API is hosted somewhere other than `http://localhost:8081/api/v1`.

## Authentication endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create a Parent account and sign in |
| POST | `/auth/login` | Public | Validate credentials and issue tokens |
| POST | `/auth/refresh` | Public, refresh token required | Rotate refresh token and issue a new access token |
| POST | `/auth/logout` | Public, refresh token required | Revoke the supplied refresh session |
| GET | `/auth/me` | Access token required | Return the authenticated account |

### Registration request

```json
{
  "fullName": "Demo Parent",
  "email": "parent@example.com",
  "password": "StrongPass123"
}
```

Public registration always assigns `PARENT`. Driver, school-admin and super-admin accounts must be provisioned through a trusted administrative workflow; the public form cannot choose a privileged role.

### Login request

```json
{
  "email": "parent@example.com",
  "password": "StrongPass123"
}
```

Successful authentication returns `accessToken`, `refreshToken`, `expiresInSeconds`, and the user profile.

## Token/session behavior

- Access tokens are signed with RSA RS256 and expire after 15 minutes by default.
- Refresh tokens expire after 7 days by default.
- Only a SHA-256 hash of each refresh token is stored in MySQL.
- Refresh rotates the token: the previous refresh session is revoked and a new one is stored.
- The browser keeps tokens in `sessionStorage` for the current tab session and automatically attempts refresh after a protected API request returns 401.
- Logout revokes the refresh session. Because access tokens are stateless, an already-issued access token can remain valid until its short expiry; it is not immediately blacklisted.

For production, prefer an HttpOnly, Secure, SameSite refresh-token cookie or a backend-for-frontend design instead of exposing refresh tokens to JavaScript storage. Enforce HTTPS and rotate/backup RSA keys with a planned key-id strategy before production.

## Verification checklist

1. Start MySQL and confirm the `bus_tracker` database is reachable.
2. Start the backend; confirm `http://localhost:8081/actuator/health` reports UP.
3. Start the frontend at `http://localhost:5173`.
4. Create a parent account from the Create account tab.
5. Confirm the success panel displays the account with role `PARENT`.
6. Sign out, then sign in with the same credentials.
7. Use browser DevTools Network to verify the `/auth/me` request includes a Bearer access token.
8. Wait for access-token expiry or temporarily use a short local expiry, then call a protected endpoint to exercise refresh rotation.
9. Sign out and verify the old refresh token can no longer refresh a session.

CI runs backend Maven verification against a MySQL 8 service and checks the frontend with `npm run build` and `npm run lint`.
