# Telegram Notifications

## Create The Bot

1. Open a private chat with `@BotFather` in Telegram.
2. Send `/newbot`, choose a display name, and choose a username ending in `bot`.
3. Store the returned token in a local shell variable. Do not add it to a repository file:

   ```bash
   read -rs TELEGRAM_BOT_TOKEN
   export TELEGRAM_BOT_TOKEN
   ```

4. Open the new bot's private chat and send `start`. A bot cannot initiate this first conversation.

## Discover The Private Chat ID

```bash
export TELEGRAM_CHAT_ID="$(
  curl --fail --silent --show-error \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates" |
    jq -r '[.result[].message.chat.id] | last'
)"
test -n "$TELEGRAM_CHAT_ID" && test "$TELEGRAM_CHAT_ID" != null
```

## Smoke-Test Telegram

```bash
curl --fail --silent --show-error \
  --request POST \
  --header 'Content-Type: application/json' \
  --data "$(jq -n \
    --arg chat_id "$TELEGRAM_CHAT_ID" \
    --arg text 'Twin Telegram notification test' \
    '{chat_id: $chat_id, text: $text}')" \
  "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"
```

Confirm that Telegram returns `"ok": true` and the message appears in the private chat.

## Store The Token In SSM

Select the same AWS account and region used by the target Terraform workspace. Set the environment to the workspace that serves the site; the current site uses `dev`:

```bash
export ENVIRONMENT=dev
aws ssm put-parameter \
  --name "/twin/${ENVIRONMENT}/telegram-bot-token" \
  --type SecureString \
  --value "$TELEGRAM_BOT_TOKEN" \
  --overwrite
```

The token value must not be passed to Terraform. Standard `SecureString` uses the account's AWS-managed SSM key unless `--key-id` is supplied.

## Deploy

Export only non-secret Terraform inputs:

```bash
export TF_VAR_telegram_chat_id="$TELEGRAM_CHAT_ID"
export TF_VAR_telegram_bot_token_parameter_name="/twin/${ENVIRONMENT}/telegram-bot-token"
./scripts/deploy.sh "$ENVIRONMENT" twin
```

The existing deployment builds `backend/lambda-deployment.zip`, and Terraform creates the notifier because both Telegram variables are non-empty.

## Verify End To End

1. Trigger `/visitor` and confirm both email and Telegram arrive.
2. Trigger and confirm a human escalation and confirm both email and Telegram arrive.
3. Use the Telegram `Open admin panel` button and confirm it opens the admin page.
4. Inspect `/aws/lambda/twin-${ENVIRONMENT}-telegram-notifier` in CloudWatch if Telegram does not arrive.

## Rotate Or Disable

Rotate the bot token with `@BotFather`, rerun `aws ssm put-parameter` with the new value, and recycle the notifier execution environment so its in-memory token cache refreshes:

```bash
aws lambda update-function-configuration \
  --function-name "twin-${ENVIRONMENT}-telegram-notifier" \
  --description "Telegram token rotated $(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

To disable Telegram without deleting the bot or SSM parameter, deploy with both Terraform variables empty. The email subscription remains active.
