# Twin Onboarding Flow — Design Spec

**Date:** 2026-06-12  
**Status:** Approved

---

## Overview

When a first-time visitor opens the Twin chat panel, a short optional onboarding flow captures their name and contact details. The experience is conversational — the twin "speaks" the prompts as chat messages. A prominent Skip option is always visible so visitors never feel coerced. Returning visitors skip the flow entirely.

---

## UX Flow

### Entry point
On panel open, check `localStorage` for key `twin_visitor`.

- **Key exists** → skip onboarding entirely (see Return Visits below)
- **Key absent** → begin onboarding

### Step 1 — Name
The twin renders an assistant message:

> *"Hey! I'm Akash's digital twin. What's your name?"*

Above the chat input bar, a "Don't want to share?" banner displays a large, clearly visible **Skip** button (equal prominence to the submit action).

| User action | Next state |
|---|---|
| Types name + Enter | Proceed to Step 2 |
| Clicks Skip | Write seen-flag to localStorage → normal empty chat (no greeting) |

### Step 2 — Contact (only shown if name was given)
The twin renders a follow-up assistant message:

> *"Nice to meet you, [name]! Got an email or phone number I can reach you at?"*

Same skip banner above the input.

| User action | Next state |
|---|---|
| Types contact + Enter | Write full record to localStorage → POST /visitor → POST /chat (greeting) |
| Clicks Skip | Write name-only record to localStorage → POST /visitor (name only) → POST /chat (greeting) |

### Greeting
After onboarding completes with a name, the frontend calls `POST /chat` with `user_name` injected. The AI generates a personalised opening message; it plays back via the existing typewriter animation. This is the first message the user sees in the chat.

If the user skipped at Step 1, no greeting is generated — the standard empty chat state appears and the user types first.

---

## Return Visits

On every open, `localStorage.twin_visitor` is checked:

| Stored record | Behaviour |
|---|---|
| `{ name: "Sarah", contact: "...", seenAt: "..." }` | Skip onboarding. Call `POST /chat` with `message: "__greet__"` and `user_name: "Sarah"`. AI greets by name. |
| `{ name: null, contact: null, seenAt: "..." }` | Skip onboarding. Normal empty chat — no `/chat` call on open, user types first. |

The seen-flag is written on **any** terminal onboarding action (submit or skip), so a visitor who skips everything is never asked again.

---

## localStorage Schema

Key: `twin_visitor`

```json
{
  "name": "Sarah",
  "contact": "sarah@email.com",
  "seenAt": "2026-06-12T18:30:00.000Z"
}
```

`name` and `contact` may be `null` (full skip). `seenAt` is always an ISO timestamp.

---

## Backend Changes

### 1. New endpoint: `POST /visitor`

**Request:**
```json
{ "name": "Sarah", "contact": "sarah@email.com" }
```
`contact` is optional. Called only when the visitor provided at least their name.

**Behaviour:**
- Sends an SES email to Akash:  
  Subject: `Digital twin interaction`  
  Body: `Sarah (sarah@email.com) interacted with your digital twin`
- Returns `200 OK`. Frontend does not await this — fire and forget.
- No SQS. Direct `boto3` SES `send_email` call.

**Not called** when the visitor skipped at Step 1 (no name → nothing to notify about).

### 2. Extend `ChatRequest`

Add an optional field:
```python
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_name: Optional[str] = None   # new
```

When `user_name` is present on the first message of a session, the backend prepends a line to the system context:

> *"The visitor's name is [name]. Greet them warmly by name."*

This context persists for the life of the session so subsequent messages also benefit.

The greeting trigger message sent by the frontend is the sentinel string `"__greet__"`. The backend detects this value and replaces it with an internal instruction to open the conversation naturally, rather than echoing it back.

---

## Frontend Changes

### `twin.tsx`

Add an `onboardingStep` state: `'name' | 'contact' | 'done'`.

- On mount: read `localStorage.twin_visitor`. If found, set `onboardingStep = 'done'` and (if name exists) trigger greeting.
- Render onboarding state above the input bar when step is `'name'` or `'contact'`:
  - Assistant-style prompt message in the messages list
  - "Don't want to share?" banner with prominent **Skip** button above the input
- On submit/skip: advance state, write localStorage, fire backend calls as described above.

No new component files. Onboarding logic lives entirely within `twin.tsx` since it directly modifies messages and input state.

### `TwinFloatingButton.tsx`

No changes needed. Onboarding is entirely self-contained in `twin.tsx`.

---

## AWS / Infrastructure

- SES sender: use the existing verified sender address in the AWS account.
- SES recipient: Akash's email (configured via env var `NOTIFICATION_EMAIL`).
- No new IAM policies needed if the Lambda/server role already has SES permissions; otherwise add `ses:SendEmail` on `*`.

---

## Constraints / Non-goals

- No server-side storage of visitor records (S3, DB). SES email is the only persistence beyond the visitor's own browser.
- No analytics dashboard or export.
- Onboarding is shown once per browser. Clearing localStorage resets it.
- The flow does not support editing a previously entered name.
