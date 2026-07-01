# Blog Admin Magic-Link Authentication Design

## Goal

Replace the blog admin UI's manual static-token entry with a one-click email magic-link flow for the sole owner, while preserving the existing bearer-token authentication on every `/api/posts/*` endpoint.

## Scope

The feature adds two unauthenticated blog API endpoints, one DynamoDB table, the minimum Lambda IAM permissions for DynamoDB and SES, two API Gateway routes, and the corresponding client-side sign-in flow. It does not change `verify_token()`, post CRUD behavior, or the static admin token stored in SSM.

No new Python or JavaScript dependencies are required.

## Constants

- Owner email: `ahadagal@iu.edu`
- SES sender: `akash.hp@icloud.com`
- Magic-link destination: `https://akashpersetti.com/blog?magic=<token>`
- DynamoDB table: `twin-dev-magic-tokens`
- DynamoDB hash key: `token` (string)
- DynamoDB TTL attribute: `expires_at` (Unix epoch seconds)
- Token lifetime: 15 minutes
- AWS region: `us-east-2`
- Static admin token source: SSM parameter `/twin/dev/blog-admin-token`

## Backend API

### `POST /api/auth/request`

The request body is `{ "email": "..." }`. The endpoint always returns HTTP 200 with `{ "sent": true }`, regardless of whether the email matches the owner address. This prevents the API response from revealing which email is authorized.

If the submitted email does not exactly match `ahadagal@iu.edu`, the endpoint performs no DynamoDB write and sends no email.

For the owner email, the endpoint:

1. Generates a cryptographically secure 32-byte token represented as 64 hexadecimal characters.
2. Computes `expires_at` as the current Unix epoch time plus 900 seconds.
3. Stores `{ token, expires_at }` in `twin-dev-magic-tokens`.
4. Sends an SES email from `akash.hp@icloud.com` to `ahadagal@iu.edu` using `ses:SendEmail`. Both the plain-text and HTML bodies contain a direct link to `https://akashpersetti.com/blog?magic=<token>`.
5. Returns `{ "sent": true }`.

Operational AWS errors are not disguised as a successful send: they propagate as server errors so failed delivery is observable. Only owner-email matching is deliberately opaque.

### `GET /api/auth/verify?token=<token>`

The endpoint reads the token from `twin-dev-magic-tokens` using a consistent DynamoDB read. A token is accepted only if the item exists and its numeric `expires_at` value is strictly later than the current Unix epoch time.

For a valid token, the endpoint deletes the DynamoDB item before returning `{ "admin_token": "<value from SSM>" }`. The delete makes the link one-time-use. The static token is obtained through the existing cached `get_admin_token()` function.

A missing, unknown, expired, malformed, or previously used token returns HTTP 401. An expired item is also deleted immediately; DynamoDB TTL remains eventual cleanup rather than correctness enforcement.

The existing `verify_token()` dependency remains unchanged and is not attached to either auth endpoint.

## Infrastructure

Terraform adds `aws_dynamodb_table.magic_tokens` with the exact name `twin-dev-magic-tokens`, `PAY_PER_REQUEST` billing, a string `token` hash key, and TTL enabled on `expires_at`.

The blog Lambda role receives:

- `dynamodb:PutItem`, `dynamodb:GetItem`, and `dynamodb:DeleteItem` on the magic-token table.
- `ses:SendEmail` for the already-verified `akash.hp@icloud.com` identity. Terraform does not create or manage an SES identity.

The Lambda's existing deployment region remains `us-east-2`. Backend SDK clients explicitly use that region for SSM, DynamoDB, and SES. The Lambda environment receives the table name so the runtime value and Terraform resource cannot drift, while the code's default remains `twin-dev-magic-tokens` for tests and local execution.

API Gateway adds these routes, both targeting the existing blog Lambda integration:

- `POST /api/auth/request`
- `GET /api/auth/verify`

No Terraform apply is part of this work.

## Frontend Flow

The client maintains three initial authentication paths:

1. If the URL contains `?magic=<token>`, verification takes precedence. The page shows a verification loading state, calls `GET /api/auth/verify?token=<encoded token>`, stores the returned `admin_token` in `localStorage.blog_token`, removes only the `magic` query parameter with `history.replaceState`, and loads the post list.
2. Otherwise, if `localStorage.blog_token` exists, the existing returning-visitor auto-login behavior loads the post list.
3. Otherwise, the page shows an email field pre-filled with `ahadagal@iu.edu` and a **Send magic link** button.

Submitting the form calls `POST /api/auth/request` with the email as JSON. A successful response replaces the form status with **Check your email**. Because the backend response is deliberately opaque, the UI uses the same confirmation for every syntactically submitted address.

If magic-link verification fails, the UI removes the unusable query parameter, shows a concise expired/invalid-link error, and returns to the email request form. Request failures show an actionable error and allow retry.

A **Sign out** control appears in the authenticated post-list header. It removes `localStorage.blog_token`, clears the in-memory token and post state, and returns to the request form.

All existing post API calls continue sending `Authorization: Bearer <admin_token>` exactly as they do now.

## Security Properties and Limitations

- Tokens use `secrets.token_hex(32)`, providing 256 bits of randomness.
- The API does not disclose whether an email is authorized.
- Magic tokens expire after 15 minutes and cannot be reused after successful verification.
- Expiry is checked in application code because DynamoDB TTL deletion is asynchronous.
- The returned static admin token remains stored in browser local storage, matching current behavior and preserving returning-visitor auto-login.
- The one-user hardcoded allowlist is intentional for this personal admin panel.

## Testing and Verification

Backend tests cover:

- Non-owner request returns `{ "sent": true }` without DynamoDB or SES calls.
- Owner request stores a 64-character token with a 15-minute TTL and sends the correct one-click link from the required sender.
- Valid verification returns the static admin token and deletes the magic token.
- Missing and expired tokens return 401; expired tokens are deleted.
- Existing `/api/posts/*` bearer authentication continues to pass unchanged.

Frontend verification consists of lint/type/build checks covering the client component, plus manual flow review of initial loading, request confirmation, failed verification, successful local-storage login, URL cleanup, returning login, and sign out.

Infrastructure verification uses `terraform fmt -check` and `terraform validate`. Terraform is not applied.
