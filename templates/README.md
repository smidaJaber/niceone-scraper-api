# Salla & n8n Price Drop Webhook Integration Template

Automate competitor price monitoring across **NiceOne KSA**, **GoldenScent**, and **Boutiqaat**, and deliver instant price-drop alerts or auto-reprice products on your **Salla (سلة)** store.

---

## Architecture Overview

```text
┌───────────────────────────────┐
│  Apify GCC Perfumes Scraper   │
│  (Delta Mode / Daily Cron)    │
└───────────────┬───────────────┘
                │ Webhook Event: ACTOR.RUN.SUCCEEDED
                ▼
┌───────────────────────────────┐
│     n8n Workflow / Server     │
│ 1. Filter: PRICE_DROP / Flash │
│ 2. Calculate Margins & Deltas │
└───────┬───────────────┬───────┘
        │               │
        ▼               ▼
┌───────────────┐ ┌──────────────────────────┐
│ Telegram / WA │ │ Salla Merchant API v2    │
│ Instant Alert │ │ Search SKU & Auto-Update │
└───────────────┘ └──────────────────────────┘
```

---

## Option 1: Deploy with n8n (Recommended)

### 1. Import Workflow Template
1. Open your n8n workspace (Cloud or Self-Hosted).
2. Go to **Workflows > Import from File**.
3. Select [`n8n-salla-price-alert-workflow.json`](./n8n-salla-price-alert-workflow.json).

### 2. Configure Credentials & Environment Variables
In your n8n environment or Workflow Settings:
- `APIFY_TOKEN`: Your Apify personal API token from [Apify Console](https://console.apify.com/account/integrations).
- `SALLA_ACCESS_TOKEN`: Merchant access token generated from your Salla Partners App (`api.salla.dev`).
- `TELEGRAM_BOT_TOKEN`: Bot token from `@BotFather`.
- `TELEGRAM_CHAT_ID`: Your Telegram channel or user ID (e.g. `@my_store_alerts` or `123456789`).

### 3. Connect Apify Webhook
1. Copy the **Production Webhook URL** from the `Apify Webhook Trigger` node in n8n.
2. In Apify Console, go to your Actor **gcc-perfumes-beauty-scraper > Integrations > Webhooks**.
3. Click **Add Webhook**:
   - **Event**: `Run succeeded`
   - **URL**: Paste your n8n Webhook URL.
4. Save the webhook.

---

## Option 2: Deploy Standalone Node.js Webhook Server

If you prefer running a lightweight server without n8n:

### 1. Configure Environment
```bash
cp .env.example .env
```
Set the following variables:
```env
PORT=3000
APIFY_TOKEN=apify_api_xxxxxxxxx
SALLA_ACCESS_TOKEN=ory_at_xxxxxxxxx
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=-1001234567890
WEBHOOK_SECRET=my_custom_secret_key
```

### 2. Run Locally or Deploy
```bash
npm run webhook
```
Endpoint available at:
`http://localhost:3000/webhook/apify`

---

## Salla Developer Permissions

Ensure your Salla App has the following scopes enabled in the Salla Partner Portal:
- `products.read`: Required to search store catalog by SKU/Brand.
- `products.write`: Required if auto-repricing undercuts are enabled.
