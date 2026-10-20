# 🛍️ NiceOne Scraper API — Saudi Perfumes, Cosmetics & Beauty Price Intelligence

<p align="center">
  <a href="https://console.apify.com/actors?search=niceone-scraper"><img src="https://img.shields.io/badge/Run%20on-Apify%20Store-orange?logo=apify&style=for-the-badge" alt="Run on Apify" /></a>
  <a href="#-python-quickstart"><img src="https://img.shields.io/badge/Python-3.8+-blue?logo=python&style=for-the-badge" alt="Python" /></a>
  <a href="#-nodejs-quickstart"><img src="https://img.shields.io/badge/Node.js-18+-green?logo=node.js&style=for-the-badge" alt="Node.js" /></a>
  <a href="#-pricing"><img src="https://img.shields.io/badge/Pricing-Pay--Per--Event%20($2.50%2F1k)-brightgreen?style=for-the-badge" alt="Pay Per Event" /></a>
</p>

> 🌐 **Tracking the broader GCC fragrance & beauty market?** Check out our sibling APIs:
> | Marketplace | Official Scraper Client | Market Focus |
> |---|---|---|
> | **NiceOne Saudi Arabia** | **This API Client (`niceone-scraper`)** | KSA beauty unicorn (`niceonesa.com`) |
> | **GoldenScent** | [GoldenScent Scraper API](https://github.com/smidaJaber/goldenscent-scraper-api) | Gulf designer & Arabian oud (`goldenscent.com`) |
> | **Boutiqaat** | [Boutiqaat Scraper API](https://github.com/smidaJaber/boutiqaat-scraper-api) | Kuwait & celebrity beauty exclusives (`boutiqaat.com`) |

---

The unofficial Node.js & Python client, SDK wrapper, and automation templates for the **NiceOne Scraper Apify Actor** (`niceonesa.com`).

Extract live perfume, oud, skincare, and cosmetics prices in **Saudi Riyals (SAR)**, discount percentages, flash sale countdowns, stock availability, and deep **Olfactory Pyramid fragrance notes (Top, Middle, Base)**.

---

## ⚡ Quickstart

### 🐍 Python Quickstart
```python
import os
from apify_client import ApifyClient

client = ApifyClient(os.getenv("APIFY_TOKEN", "YOUR_APIFY_TOKEN"))

run_input = {
    "platform": "niceonesa.com",
    "countryStorefront": "sa-SAR",
    "searchQueries": ["Versace", "Dior Sauvage", "Oud"],
    "maxItemsPerSource": 25,
    "onlyNewOrPriceChanged": True, # Delta monitor mode
}

run = client.actor("niceone-scraper").call(run_input=run_input)
items = client.dataset(run["defaultDatasetId"]).list_items().items

for p in items:
    print(f"[NiceOne] {p['title']} - {p['salePrice']} {p['currency']}")
```

### 📦 Node.js Quickstart
```javascript
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

const run = await client.actor('niceone-scraper').call({
    platform: 'niceonesa.com',
    countryStorefront: 'sa-SAR',
    searchQueries: ['Versace', 'Oud'],
    maxItemsPerSource: 25,
    onlyNewOrPriceChanged: true,
});

const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(`Extracted ${items.length} products from NiceOne`);
```

---

## 🔄 Salla (سلة) & n8n Price Alert Webhook Template

Looking to trigger automatic price-drop alerts or synchronize prices with your **Salla (سلة)** or **Zid (زد)** store?

Check out our production-ready n8n template:
- 📁 [`templates/n8n-salla-price-alert-workflow.json`](./templates/n8n-salla-price-alert-workflow.json): Import directly into n8n.
- 📁 [`templates/salla-price-alert-webhook.js`](./templates/salla-price-alert-webhook.js): Standalone Node.js Express webhook server.
- 📖 [`templates/README.md`](./templates/README.md): Setup instructions for Telegram alerts and Salla Merchant API.

---

## 🇸🇦 أداة سحب ومراقبة أسعار نايس ون (NiceOne KSA API)
واجهة برمجية مخصصة لأصحاب المتاجر الإلكترونية على **سلة (Salla)** و **زد (Zid)** لمراقبة عروض وأسعار منتجات **نايس ون** بشكل لحظي:
- سحب الأسعار بالريال السعودي (SAR) ونسب الخصم الحقيقية.
- تنبيهات هبوط الأسعار والعروض الخاطفة (Flash Deals) في موسم الرياض واليوم الوطني والجمعة البيضاء.
- استخراج الهرم العطري ومكونات العطور (مقدمة، قلب، وقاعدة العطر).
- قالب n8n جاهز للربط مع متجر سلة عبر Webhook.

---

## 📄 License
MIT © 2026
