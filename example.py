import os
import sys
from apify_client import ApifyClient

api_token = os.getenv("APIFY_TOKEN")
if not api_token:
    print("Error: APIFY_TOKEN environment variable is not set.", file=sys.stderr)
    print("Get your token from: https://console.apify.com/account/integrations", file=sys.stderr)
    sys.exit(1)

client = ApifyClient(api_token)

# Input configuration for GCC Perfume Scraper
run_input = {
    "platform": "niceonesa.com", # "niceonesa.com", "goldenscent.com", "boutiqaat.com"
    "countryStorefront": "sa-SAR", # "sa-SAR", "ae-AED", "kw-KWD"
    "language": "en", # "en" or "ar"
    "searchQueries": ["Versace", "Oud", "Narciso Rodriguez"],
    "startUrls": [
        {"url": "https://niceonesa.com/en/perfume"},
    ],
    "maxItemsPerSource": 10,
    "scrapeFullNotesAndSpecs": False,
    "onlyNewOrPriceChanged": False,
}

print("Starting GCC Perfumes & Beauty Price Intelligence Scraper...")

actor_id = os.getenv("APIFY_ACTOR_ID", "gcc-perfumes-beauty-scraper")
run = client.actor(actor_id).call(run_input=run_input)

print(f"Actor run finished with status: {run['status']}")

dataset_client = client.dataset(run["defaultDatasetId"])
items = dataset_client.list_items().items

print(f"\nSuccessfully extracted {len(items)} products:\n")

for p in items:
    brand = p.get("brand") or "Perfume"
    title = p.get("title", "")
    platform = p.get("platform", "")
    sale_price = p.get("salePrice")
    curr = p.get("currency", "SAR")
    orig_price = p.get("originalPrice")
    disc = p.get("discountPct")
    size = p.get("sizeVolume") or "N/A"
    price_100ml = p.get("pricePer100Ml")
    status = p.get("priceChangeStatus", "NEW")
    url = p.get("url", "")

    disc_str = f" (Was {orig_price} {curr}, {disc}% off)" if orig_price else ""
    unit_str = f" | Price/100ml: {price_100ml} {curr}" if price_100ml else ""

    print(f"[{platform}] {brand} - {title}")
    print(f"       Price: {sale_price} {curr}{disc_str}")
    print(f"       Size: {size}{unit_str} | Status: {status}")
    print(f"       URL: {url}\n")
