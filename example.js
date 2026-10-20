import { ApifyClient } from 'apify-client';

const apiToken = process.env.APIFY_TOKEN;
if (!apiToken) {
    console.error('Error: APIFY_TOKEN environment variable is not set.');
    console.error('Get your token from: https://console.apify.com/account/integrations');
    process.exit(1);
}

const client = new ApifyClient({ token: apiToken });

// Define search parameters across NiceOne, GoldenScent, or Boutiqaat
const input = {
    platform: 'niceonesa.com', // 'niceonesa.com' | 'goldenscent.com' | 'boutiqaat.com'
    countryStorefront: 'sa-SAR', // 'sa-SAR' | 'ae-AED' | 'kw-KWD'
    language: 'en', // 'en' | 'ar'
    searchQueries: ['Versace', 'Oud', 'Dior Sauvage'],
    startUrls: [
        { url: 'https://niceonesa.com/en/perfume' },
    ],
    maxItemsPerSource: 10,
    scrapeFullNotesAndSpecs: false, // Set to true to extract Olfactory Pyramid notes
    onlyNewOrPriceChanged: false, // Set to true for delta price drop monitoring
};

console.log('Starting NiceOne, GoldenScent & Boutiqaat Scraper Actor...');

// Replace with your Apify Actor ID or username/actor-name:
// e.g. client.actor('your-username/gcc-perfumes-beauty-scraper').call(input);
const actorId = process.env.APIFY_ACTOR_ID || 'gcc-perfumes-beauty-scraper';
const run = await client.actor(actorId).call(input);

console.log(`Actor run finished with status: ${run.status}`);

const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(`\nSuccessfully extracted ${items.length} fragrance products:\n`);

items.forEach((item) => {
    console.log(`[${item.platform}] ${item.brand || 'Perfume'} - ${item.title}`);
    console.log(`       Price: ${item.salePrice} ${item.currency}${item.originalPrice ? ` (Was ${item.originalPrice} ${item.currency}, ${item.discountPct}% off)` : ''}`);
    console.log(`       Size: ${item.sizeVolume || 'N/A'} | Price/100ml: ${item.pricePer100Ml ? `${item.pricePer100Ml} ${item.currency}` : 'N/A'}`);
    console.log(`       Delta Status: ${item.priceChangeStatus} | In Stock: ${item.inStock}`);
    console.log(`       URL: ${item.url}\n`);
});
