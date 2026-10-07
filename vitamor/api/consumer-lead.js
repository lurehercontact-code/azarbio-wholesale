const OFFERS = {
  '500G': { quantity: '0.5', productTotal: 199, label: '500 غرام' },
  '1KG': { quantity: '1', productTotal: 299, label: '1 كيلو' },
  '2KG_PLUS_500G': { quantity: '2.5', productTotal: 499, label: '2 كيلو + 500غ مجاناً' },
};

const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 4;
const PHONE_WINDOW_MS = 3 * 24 * 60 * 60_000;
const PHONE_MAX = 1;
const rateStore = globalThis.__vitamorB2CRateStore || new Map();
const phoneStore = globalThis.__vitamorB2CPhoneStore || new Map();
globalThis.__vitamorB2CRateStore = rateStore;
globalThis.__vitamorB2CPhoneStore = phoneStore;

function clean(value, max = 200) {
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  try { return JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '')); }
  catch (_) { return null; }
}

function normalizeMoroccanMobile(value) {
  const compact = String(value ?? '').trim().replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 1776)).replace(/[\s()-]/g, '');
  const match = /^(?:0|(?:\+|00)?212)([67]\d{8})$/.exec(compact);
  return match ? '0' + match[1] : '';
}

function touchWindow(store, key, now, windowMs, limit) {
  const recent = (store.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  store.set(key, recent);
  return true;
}


const cartRateStore = globalThis.__vitamorCartRateStore || new Map();
globalThis.__vitamorCartRateStore = cartRateStore;

async function saveCart(req, res, body) {
  const now = Date.now();
  const phone = normalizeMoroccanMobile(body.phone);
  if (!phone) return sendJson(res, 400, { ok: false, error: 'invalid_phone' });
  const offer = OFFERS[clean(body.offer_package, 24)];
  if (!offer) return sendJson(res, 400, { ok: false, error: 'invalid_offer' });
  const elapsed = Number(body.client_elapsed_ms);
  if (!Number.isFinite(elapsed) || elapsed < 0) return sendJson(res, 400, { ok: false, error: 'too_fast' });
  const origin = String(req.headers.origin || '');
  if (origin) {
    try { if (new URL(origin).host !== req.headers.host) return sendJson(res, 403, { ok: false, error: 'invalid_origin' }); }
    catch (_) { return sendJson(res, 403, { ok: false, error: 'invalid_origin' }); }
  }
  const ip = clean(String(req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket?.remoteAddress || 'unknown', 80);
  for (const [key, times] of cartRateStore) if (!times.some(time => now - time < RATE_WINDOW_MS)) cartRateStore.delete(key);
  if (!touchWindow(cartRateStore, ip, now, RATE_WINDOW_MS, 60)) return sendJson(res, 429, { ok: false, error: 'too_many_requests' });
  const webhook = String(process.env.MAKE_WEBHOOK_URL || '').trim();
  if (!/^https:\/\/hook\.eu1\.make\.com\/[A-Za-z0-9_-]+$/.test(webhook)) return sendJson(res, 503, { ok: false, error: 'service_not_configured' });
  const startedAt = now - Math.min(elapsed, 86400000);
  const revision = Number(body.cart_updated_at);
  const updatedAt = Number.isFinite(revision) && revision >= startedAt && revision <= now + 60000 ? Math.min(revision, now) : now;
  const values = [[phone, startedAt, updatedAt, 'Abandonné', clean(body.name, 100), clean(body.city, 80),
    clean(body.address, 220), offer.label, offer.productTotal, clean(body.utm_campaign, 160),
    clean(body.utm_source, 120), clean(body.utm_content, 160)]];
  const payload = {
    submitted_at: new Date(now).toISOString(), phone,
    business_type: 'Panier abandonné / B2C', source: 'Vitamor Offre Famille B2C',
    notes: JSON.stringify({ values }),
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(webhook, { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Vitamor-Cart-Vercel/1.0' },
      body: JSON.stringify(payload), signal: controller.signal });
    if (!response.ok) return sendJson(res, 502, { ok: false, error: 'upstream_error' });
    const result = await response.json();
    if (result.ok !== true || result.status !== 'Abandonné') return sendJson(res, 502, { ok: false, error: 'capture_not_ready' });
    return sendJson(res, 200, { ok: true, status: 'Abandonné' });
  } catch (_) { return sendJson(res, 502, { ok: false, error: 'upstream_unavailable' }); }
  finally { clearTimeout(timer); }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
  }
  if (!String(req.headers['content-type'] || '').toLowerCase().includes('application/json')) {
    return sendJson(res, 415, { ok: false, error: 'invalid_content_type' });
  }

  const body = parseBody(req);
  if (!body) return sendJson(res, 400, { ok: false, error: 'invalid_json' });
  if (clean(body.website, 120)) return sendJson(res, 200, { ok: true, ignored: true });

  const now = Date.now();
  const pendingCookie = String(req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith('vitamor_b2c_order_pending='));
  const pendingSince = Number(pendingCookie ? pendingCookie.slice('vitamor_b2c_order_pending='.length) : 0);
  if (Number.isFinite(pendingSince) && pendingSince > 0 && pendingSince <= now && now - pendingSince < PHONE_WINDOW_MS) {
    return sendJson(res, 409, { ok: false, error: 'order_pending' });
  }
  if (body.capture_mode === 'abandoned') return saveCart(req, res, body);
  const ip = clean(String(req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket?.remoteAddress || 'unknown', 80);
  if (!touchWindow(rateStore, ip, now, RATE_WINDOW_MS, RATE_MAX)) {
    return sendJson(res, 429, { ok: false, error: 'too_many_requests' });
  }

  const name = clean(body.name, 100);
  const phone = normalizeMoroccanMobile(body.phone);
  const city = clean(body.city, 80);
  const address = clean(body.address, 220);
  const offerPackage = clean(body.offer_package, 24);
  const offer = OFFERS[offerPackage];
  const elapsedMs = Number(body.client_elapsed_ms || 0);
  if (name.length < 2) return sendJson(res, 400, { ok: false, error: 'invalid_name' });
  if (!phone) return sendJson(res, 400, { ok: false, error: 'invalid_phone' });
  if (city.length < 2) return sendJson(res, 400, { ok: false, error: 'invalid_city' });
  if (!offer) return sendJson(res, 400, { ok: false, error: 'invalid_offer' });
  if (elapsedMs > 0 && elapsedMs < 2200) return sendJson(res, 400, { ok: false, error: 'too_fast' });
  if (!touchWindow(phoneStore, phone, now, PHONE_WINDOW_MS, PHONE_MAX)) {
    return sendJson(res, 409, { ok: false, error: 'duplicate_phone' });
  }

  const payload = {
    submitted_at: new Date().toISOString(),
    form_version: 'consumer-v1',
    name,
    phone,
    city,
    address,
    business_type: 'مستهلك / B2C',
    offer_package: offer.label,
    offer_quantity_kg: offer.quantity,
    offer_unit_price: String(Math.round((offer.productTotal / Number(offer.quantity)) * 10) / 10),
    offer_product_total: String(offer.productTotal),
    shipping_fee: '0',
    offer_total: String(offer.productTotal),
    source: 'Vitamor Offre Famille B2C',
    utm_source: clean(body.utm_source, 120),
    utm_medium: clean(body.utm_medium, 120),
    utm_campaign: clean(body.utm_campaign, 160),
    utm_content: clean(body.utm_content, 160),
    utm_term: clean(body.utm_term, 160),
    landing_page: clean(body.landing_page || req.headers.referer || '', 500),
    notes: [
      'نوع الصفحة: B2C / Offre Famille',
      'التوصيل: مجاني ضمن عرض اليوم',
      address ? 'العنوان: ' + address : 'العنوان: يؤخذ هاتفياً عند التأكيد'
    ].join(' | '),
  };

  const webhook = String(process.env.MAKE_WEBHOOK_URL || '').trim();
  if (!/^https:\/\/hook\.eu1\.make\.com\/[A-Za-z0-9_-]+$/.test(webhook)) {
    phoneStore.delete(phone);
    return sendJson(res, 503, { ok: false, error: 'service_not_configured' });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Vitamor-B2C-Vercel/1.0' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) {
      phoneStore.delete(phone);
      return sendJson(res, 502, { ok: false, error: 'upstream_error' });
    }
    res.setHeader('Set-Cookie', 'vitamor_b2c_order_pending=' + now + '; Path=/; Max-Age=259200; HttpOnly; Secure; SameSite=Lax');
    return sendJson(res, 200, { ok: true, offer_package: offerPackage, order_total: offer.productTotal, shipping_fee: 0 });
  } catch (_) {
    phoneStore.delete(phone);
    return sendJson(res, 502, { ok: false, error: 'upstream_unavailable' });
  }
}
