/**
 * Standalone Webhook Handler for Apify GCC Perfume Scraper & Salla Merchants
 *
 * This server receives Apify webhook calls when the scraper completes,
 * detects competitor price drops on NiceOne / GoldenScent / Boutiqaat,
 * and sends instant alerts to the store owner or updates Salla prices.
 *
 * Usage:
 *   APIFY_TOKEN=... SALLA_ACCESS_TOKEN=... TELEGRAM_BOT_TOKEN=... node salla-price-alert-webhook.js
 */

import http from 'http';
import { ApifyClient } from 'apify-client';

const PORT = process.env.PORT || 3000;
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const SALLA_ACCESS_TOKEN = process.env.SALLA_ACCESS_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const apify = new ApifyClient({ token: APIFY_TOKEN });

/**
 * Sends formatted alert to Telegram channel or chat
 */
async function sendTelegramAlert(text) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log('[Telegram Alert Skipped] Bot token or chat ID not set.');
        return;
    }
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text,
                parse_mode: 'Markdown',
            }),
        });
        const data = await res.json();
        if (!data.ok) {
            console.error('[Telegram Error]', data);
        }
    } catch (err) {
        console.error('[Telegram Network Error]', err);
    }
}

/**
 * Checks Salla store for matching SKU and updates sale price
 */
async function syncPriceToSalla(product) {
    if (!SALLA_ACCESS_TOKEN) return;

    try {
        // 1. Search Salla store products by SKU or brand
        const searchUrl = `https://api.salla.dev/admin/v2/products?keyword=${encodeURIComponent(product.sku || product.brand || '')}`;
        const searchRes = await fetch(searchUrl, {
            headers: {
                Authorization: `Bearer ${SALLA_ACCESS_TOKEN}`,
                Accept: 'application/json',
            },
        });
        const searchData = await searchRes.json();

        if (searchData?.data?.length > 0) {
            const sallaProduct = searchData.data[0];
            console.log(`[Salla Match Found] Matched "${product.title}" with Salla Product ID ${sallaProduct.id}`);

            // Optional Auto-Reprice: undercut competitor by 1 SAR/AED/KWD
            const targetSalePrice = Math.max(10, Math.floor(product.salePrice - 1));
            const updateUrl = `https://api.salla.dev/admin/v2/products/${sallaProduct.id}`;

            const updateRes = await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${SALLA_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    sale_price: targetSalePrice,
                }),
            });
            const updateResult = await updateRes.json();
            console.log(`[Salla Reprice Status] Updated Salla product ${sallaProduct.id} to ${targetSalePrice}`);
            return updateResult;
        }
    } catch (err) {
        console.error('[Salla API Sync Error]', err);
    }
}

/**
 * Main Webhook Processing
 */
async function processWebhook(payload) {
    const datasetId =
        payload?.resource?.defaultDatasetId ||
        payload?.data?.defaultDatasetId ||
        payload?.defaultDatasetId;

    if (!datasetId) {
        console.warn('[Webhook Warning] No defaultDatasetId found in payload.');
        return;
    }

    console.log(`[Webhook Processing] Fetching dataset ${datasetId}...`);
    const { items } = await apify.dataset(datasetId).listItems({ clean: true });
    console.log(`[Dataset Retrieved] ${items.length} records found.`);

    let priceDropCount = 0;

    for (const item of items) {
        const isPriceDrop = item.priceChangeStatus === 'PRICE_DROP';
        const isFlash = Boolean(item.isFlashSale);
        const hasBigDiscount = (item.discountPct || 0) >= 20;

        if (isPriceDrop || isFlash || hasBigDiscount) {
            priceDropCount++;
            const prev = item.previousPrice || item.originalPrice || item.salePrice;
            const diff = prev > item.salePrice ? prev - item.salePrice : 0;
            const alertType = isPriceDrop ? '🚨 هبوط سعر منافس' : isFlash ? '⚡ فلاش سيل عاجل' : '🔥 خصم كبير';

            const alertMessage =
                `🚨 *تنبيه أسعار العطور والتجميل — متجر سلة (Salla)* 🚨\n\n` +
                `📌 *النوع:* ${alertType}\n` +
                `🏬 *المتجر:* ${item.platform}\n` +
                `🏷️ *الماركة:* ${item.brand || 'غير محدد'}\n` +
                `📦 *المنتج:* ${item.title}\n` +
                `💰 *السعر الحالي:* ${item.salePrice} ${item.currency}\n` +
                (diff > 0 ? `📉 *السعر السابق:* ${prev} ${item.currency} (انخفاض بمقدار ${diff} ${item.currency})\n` : '') +
                (item.sizeVolume ? `🧴 *الحجم / التركيز:* ${item.sizeVolume} (${item.concentration || 'عطر'})\n` : '') +
                (item.pricePer100Ml ? `📊 *سعر الـ 100 مل:* ${item.pricePer100Ml} ${item.currency}\n` : '') +
                `🔗 *رابط المنافس:* ${item.url}`;

            console.log(`[Price Alert Triggered] ${item.platform} - ${item.title} -> ${item.salePrice} ${item.currency}`);

            // Send notification to Telegram
            await sendTelegramAlert(alertMessage);

            // Synchronize with Salla merchant store
            await syncPriceToSalla(item);
        }
    }

    console.log(`[Webhook Complete] Processed ${items.length} products with ${priceDropCount} price-drop alerts triggered.`);
}

const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/webhook/apify') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', async () => {
            try {
                if (WEBHOOK_SECRET && req.headers['x-webhook-secret'] !== WEBHOOK_SECRET) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Unauthorized: invalid webhook secret' }));
                    return;
                }

                const payload = JSON.parse(body || '{}');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'received', timestamp: new Date().toISOString() }));

                // Process in background
                processWebhook(payload).catch((err) => console.error('[Background Processing Error]', err));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
            }
        });
    } else if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Salla & GCC Perfumes Price Alert Webhook server listening on port ${PORT}`);
    console.log(`Webhook endpoint: http://localhost:${PORT}/webhook/apify`);
});
