# Blog Admin Magic-Link Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single-owner SES magic-link sign-in flow to the blog admin while preserving the existing static bearer-token authorization for post APIs.

**Architecture:** Two public FastAPI endpoints issue and consume 15-minute one-time tokens stored in DynamoDB, then exchange a valid token for the existing SSM-backed admin token. Terraform provisions the token table, least-privilege Lambda access, and API Gateway routes. The client exchanges `?magic=` on mount, persists the returned bearer token, and otherwise offers an email request form.

**Tech Stack:** Python 3.12, FastAPI, boto3 (DynamoDB/SES/SSM), pytest, Terraform AWS provider, Next.js 16, React 19, TypeScript

---

## File Structure

- Modify `backend/tests/test_blog.py`: add request/verify endpoint behavior tests using mocked DynamoDB and SES clients.
- Modify `backend/blog_server.py`: add magic-link constants, AWS clients, request model, email issuance, and one-time verification endpoints.
- Modify `terraform/main.tf`: add the DynamoDB table, IAM policies, Lambda environment variable, and API Gateway routes.
- Modify `frontend/app/blog/page.tsx`: replace manual token entry with magic-link request/verification and add sign out.
- No dependency manifests change because boto3 and React are already present.

### Task 1: Backend magic-link request endpoint

**Files:**
- Modify: `backend/tests/test_blog.py`
- Modify: `backend/blog_server.py`

- [ ] **Step 1: Write failing request-endpoint tests**

Add tests that submit a non-owner address and assert a generic success response without AWS calls, then submit `ahadagal@iu.edu` with frozen time/token values and assert the exact DynamoDB item and SES sender, recipient, subject, text link, and HTML link:

```python
def test_magic_link_request_hides_non_owner_email():
    with patch.object(blog_module, "magic_tokens_table") as table, \
         patch.object(blog_module, "ses") as mock_ses:
        response = client.post("/api/auth/request", json={"email": "other@example.com"})
    assert response.status_code == 200
    assert response.json() == {"sent": True}
    table.put_item.assert_not_called()
    mock_ses.send_email.assert_not_called()


def test_magic_link_request_stores_token_and_sends_email():
    with patch.object(blog_module, "magic_tokens_table") as table, \
         patch.object(blog_module, "ses") as mock_ses, \
         patch.object(blog_module.secrets, "token_hex", return_value="a" * 64), \
         patch.object(blog_module.time, "time", return_value=1_000):
        response = client.post("/api/auth/request", json={"email": blog_module.OWNER_EMAIL})
    assert response.status_code == 200
    table.put_item.assert_called_once_with(
        Item={"token": "a" * 64, "expires_at": 1_900}
    )
    message = mock_ses.send_email.call_args.kwargs
    assert message["Source"] == "akash.hp@icloud.com"
    assert message["Destination"] == {"ToAddresses": ["ahadagal@iu.edu"]}
    link = f"https://akashpersetti.com/blog?magic={'a' * 64}"
    assert link in message["Message"]["Body"]["Text"]["Data"]
    assert link in message["Message"]["Body"]["Html"]["Data"]
```

- [ ] **Step 2: Run request tests and verify RED**

Run: `cd backend && uv run pytest tests/test_blog.py -k magic_link_request -v`

Expected: FAIL because `/api/auth/request` does not exist and module AWS clients/constants are undefined.

- [ ] **Step 3: Implement the minimal request endpoint**

In `backend/blog_server.py`, import `secrets` and `time`; change the local fallback in `AWS_REGION` from `us-east-1` to `us-east-2`; define the fixed owner, sender, URL, TTL, and table constants; create region-bound DynamoDB/SES clients; add the request model; and implement:

```python
OWNER_EMAIL = "ahadagal@iu.edu"
SES_SENDER_EMAIL = "akash.hp@icloud.com"
MAGIC_LINK_BASE_URL = "https://akashpersetti.com/blog"
MAGIC_TOKEN_TTL_SECONDS = 15 * 60
MAGIC_TOKEN_TABLE = os.getenv("MAGIC_TOKEN_TABLE", "twin-dev-magic-tokens")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
magic_tokens_table = dynamodb.Table(MAGIC_TOKEN_TABLE)
ses = boto3.client("ses", region_name=AWS_REGION)


class MagicLinkRequest(BaseModel):
    email: str


@app.post("/api/auth/request")
def request_magic_link(req: MagicLinkRequest):
    if req.email != OWNER_EMAIL:
        return {"sent": True}

    token = secrets.token_hex(32)
    expires_at = int(time.time()) + MAGIC_TOKEN_TTL_SECONDS
    magic_tokens_table.put_item(Item={"token": token, "expires_at": expires_at})
    link = f"{MAGIC_LINK_BASE_URL}?magic={token}"
    ses.send_email(
        Source=SES_SENDER_EMAIL,
        Destination={"ToAddresses": [OWNER_EMAIL]},
        Message={
            "Subject": {"Data": "Your blog admin sign-in link", "Charset": "UTF-8"},
            "Body": {
                "Text": {"Data": f"Sign in to the blog admin:\n\n{link}\n\nThis link expires in 15 minutes.", "Charset": "UTF-8"},
                "Html": {"Data": f'<p><a href="{link}">Sign in to the blog admin</a></p><p>This link expires in 15 minutes.</p>', "Charset": "UTF-8"},
            },
        },
    )
    return {"sent": True}
```

- [ ] **Step 4: Run request tests and full backend suite**

Run: `cd backend && uv run pytest tests/test_blog.py -k magic_link_request -v`

Expected: 2 passed.

Run: `cd backend && uv run pytest tests/test_blog.py -v`

Expected: all tests pass.

### Task 2: Backend one-time verification endpoint

**Files:**
- Modify: `backend/tests/test_blog.py`
- Modify: `backend/blog_server.py`

- [ ] **Step 1: Write failing verification tests**

Add focused tests for valid, missing, unknown, and expired tokens. The valid test asserts a consistent read, conditional one-time delete, and returned SSM-backed token. The expired test asserts immediate cleanup:

```python
def test_magic_link_verify_consumes_valid_token():
    with patch.object(blog_module, "magic_tokens_table") as table, \
         patch.object(blog_module.time, "time", return_value=1_000):
        table.get_item.return_value = {
            "Item": {"token": "valid", "expires_at": 1_001}
        }
        response = client.get("/api/auth/verify?token=valid")
    assert response.status_code == 200
    assert response.json() == {"admin_token": VALID_TOKEN}
    table.get_item.assert_called_once_with(
        Key={"token": "valid"}, ConsistentRead=True
    )
    table.delete_item.assert_called_once()


@pytest.mark.parametrize("url", [
    "/api/auth/verify",
    "/api/auth/verify?token=",
    "/api/auth/verify?token=unknown",
])
def test_magic_link_verify_rejects_missing_or_unknown_token(url):
    with patch.object(blog_module, "magic_tokens_table") as table:
        table.get_item.return_value = {}
        response = client.get(url)
    assert response.status_code == 401


def test_magic_link_verify_rejects_and_deletes_expired_token():
    with patch.object(blog_module, "magic_tokens_table") as table, \
         patch.object(blog_module.time, "time", return_value=1_000):
        table.get_item.return_value = {
            "Item": {"token": "expired", "expires_at": 1_000}
        }
        response = client.get("/api/auth/verify?token=expired")
    assert response.status_code == 401
    table.delete_item.assert_called_once_with(Key={"token": "expired"})
```

- [ ] **Step 2: Run verification tests and verify RED**

Run: `cd backend && uv run pytest tests/test_blog.py -k magic_link_verify -v`

Expected: FAIL because `/api/auth/verify` does not exist.

- [ ] **Step 3: Implement one-time token verification**

Add a shared 401 helper and implement the endpoint with application-level expiry checking. Use a conditional delete for valid tokens so concurrent verification requests cannot both succeed; map DynamoDB's conditional failure to 401:

```python
def invalid_magic_token():
    raise HTTPException(status_code=401, detail="Invalid or expired magic link")


@app.get("/api/auth/verify")
def verify_magic_link(token: Optional[str] = None):
    if not token:
        invalid_magic_token()
    item = magic_tokens_table.get_item(
        Key={"token": token}, ConsistentRead=True
    ).get("Item")
    if not item:
        invalid_magic_token()
    try:
        expires_at = int(item["expires_at"])
    except (KeyError, TypeError, ValueError):
        magic_tokens_table.delete_item(Key={"token": token})
        invalid_magic_token()
    if expires_at <= int(time.time()):
        magic_tokens_table.delete_item(Key={"token": token})
        invalid_magic_token()
    try:
        magic_tokens_table.delete_item(
            Key={"token": token},
            ConditionExpression="attribute_exists(#token)",
            ExpressionAttributeNames={"#token": "token"},
        )
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
            invalid_magic_token()
        raise
    return {"admin_token": get_admin_token()}
```

- [ ] **Step 4: Run verification tests and full backend suite**

Run: `cd backend && uv run pytest tests/test_blog.py -k magic_link_verify -v`

Expected: all verification tests pass.

Run: `cd backend && uv run pytest tests/test_blog.py -v`

Expected: all blog tests pass, including unchanged post bearer-auth tests.

### Task 3: Terraform resources, permissions, environment, and routes

**Files:**
- Modify: `terraform/main.tf`

- [ ] **Step 1: Add the fixed-name DynamoDB table**

Add `aws_dynamodb_table.magic_tokens` near the blog storage resources with `provider = aws.us_east_2`, name `twin-dev-magic-tokens`, `PAY_PER_REQUEST`, string hash key `token`, and TTL enabled on `expires_at`.

- [ ] **Step 2: Add least-privilege Lambda IAM policies**

Add one inline policy allowing `dynamodb:PutItem`, `dynamodb:GetItem`, and `dynamodb:DeleteItem` only on `aws_dynamodb_table.magic_tokens.arn`. Add another allowing only `ses:SendEmail` on `arn:aws:ses:us-east-2:${data.aws_caller_identity.current.account_id}:identity/akash.hp@icloud.com`.

- [ ] **Step 3: Connect the table and API routes**

Add `MAGIC_TOKEN_TABLE = aws_dynamodb_table.magic_tokens.name` to the blog Lambda environment. Add `POST /api/auth/request` and `GET /api/auth/verify` API Gateway v2 routes targeting `aws_apigatewayv2_integration.blog_lambda`.

- [ ] **Step 4: Format and validate Terraform**

Run: `terraform -chdir=terraform fmt main.tf`

Run: `terraform -chdir=terraform validate`

Expected: `Success! The configuration is valid.` No apply is run.

### Task 4: Frontend magic-link flow and sign out

**Files:**
- Modify: `frontend/app/blog/page.tsx`

- [ ] **Step 1: Replace token-entry state with auth-flow state**

Use `email` initialized to `ahadagal@iu.edu`, `authLoading` initialized true, `authError`, `linkSent`, and `sendingLink`. Add a `useRef` initialization guard so React Strict Mode cannot consume a one-time token twice during development.

- [ ] **Step 2: Implement mount-time verification and returning login**

On the first effect, prioritize `window.location.search`'s `magic` value. Exchange it with `/api/auth/verify?token=${encodeURIComponent(magic)}`, persist `admin_token`, set in-memory token, and remove only `magic` from the URL via `history.replaceState`. On failure, show `This magic link is invalid or has expired.` and return to the request form. If no magic token exists, load `localStorage.blog_token` as before.

- [ ] **Step 3: Implement request form and confirmation**

Submit `{ email }` as JSON to `POST /api/auth/request`. Disable the button while sending, render `Check your email` after a successful response, and render a retryable error for a non-2xx response or network failure.

- [ ] **Step 4: Add authenticated sign out**

Add a small `Sign out` button beside `+ New Post`. Its handler removes `localStorage.blog_token`, clears token/posts/messages, resets the view to `list`, and returns to the magic-link form.

- [ ] **Step 5: Run frontend static verification**

Run: `cd frontend && npm run lint -- app/blog/page.tsx`

Expected: no ESLint errors.

Run: `cd frontend && npm run build`

Expected: Next.js production build exits 0 and includes `/blog`.

### Task 5: Final regression and requirements verification

**Files:**
- Verify: `backend/blog_server.py`
- Verify: `backend/tests/test_blog.py`
- Verify: `terraform/main.tf`
- Verify: `frontend/app/blog/page.tsx`

- [ ] **Step 1: Run all backend tests**

Run: `cd backend && uv run pytest -v`

Expected: 0 failures.

- [ ] **Step 2: Run frontend lint and build**

Run: `cd frontend && npm run lint`

Expected: 0 errors.

Run: `cd frontend && npm run build`

Expected: exit 0.

- [ ] **Step 3: Run Terraform checks without applying**

Run: `terraform -chdir=terraform fmt -check`

Expected: exit 0.

Run: `terraform -chdir=terraform validate`

Expected: `Success! The configuration is valid.`

- [ ] **Step 4: Inspect the final diff against the approved design**

Run: `git diff --check && git status --short && git diff -- backend/blog_server.py backend/tests/test_blog.py terraform/main.tf frontend/app/blog/page.tsx`

Confirm every requirement is represented, no dependency manifests changed, no Terraform apply occurred, and unrelated user files remain untouched.
