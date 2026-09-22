const OFFERS = {
  '500G': { quantity: '0.5', productTotal: 199, label: '500 غرام' },
  '1KG': { quantity: '1', productTotal: 299, label: '1 كيلو' },
  '2KG_PLUS_500G': { quantity: '2.5', productTotal: 499, label: '2 كيلو + 500غ مجاناً' },
};

const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 4;
const PHONE_WINDOW_MS = 3 * 24 * 60 * 60_000;
const PHONE_MAX = 1;
const rateStore = globalThis.__azarbioB2CRateStore || new Map();
const phoneStore = globalThis.__azarbioB2CPhoneStore || new Map();
globalThis.__azarbioB2CRateStore = rateStore;
globalThis.__azarbioB2CPhoneStore = phoneStore;

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
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('00212')) digits = digits.slice(5);
  if (digits.startsWith('212')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return /^[67]\d{8}$/.test(digits) ? '0' + digits : '';
}

function touchWindow(store, key, now, windowMs, limit) {
  const recent = (store.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  store.set(key, recent);
  return true;
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
  const pendingCookie = String(req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith('az_b2c_order_pending='));
  const pendingSince = Number(pendingCookie ? pendingCookie.slice('az_b2c_order_pending='.length) : 0);
  if (Number.isFinite(pendingSince) && pendingSince > 0 && pendingSince <= now && now - pendingSince < PHONE_WINDOW_MS) {
    return sendJson(res, 409, { ok: false, error: 'order_pending' });
  }
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
    source: 'AzarBio Offre Famille B2C',
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
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'AzarBio-B2C-Vercel/1.0' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) {
      phoneStore.delete(phone);
      return sendJson(res, 502, { ok: false, error: 'upstream_error' });
    }
    res.setHeader('Set-Cookie', 'az_b2c_order_pending=' + now + '; Path=/; Max-Age=259200; HttpOnly; Secure; SameSite=Lax');
    return sendJson(res, 200, { ok: true, offer_package: offerPackage, order_total: offer.productTotal, shipping_fee: 0 });
  } catch (_) {
    phoneStore.delete(phone);
    return sendJson(res, 502, { ok: false, error: 'upstream_unavailable' });
  }
}
