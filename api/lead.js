const ALLOWED_OFFERS = {
  '2.5KG': { unit: 160, productTotal: 400 },
  '5KG': { unit: 150, productTotal: 750 },
  '10KG': { unit: 140, productTotal: 1400 },
};

const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 4;
const PHONE_WINDOW_MS = 3 * 24 * 60 * 60_000;
const PHONE_MAX = 1;
const ORDER_PENDING_MS = 3 * 24 * 60 * 60_000;
const ORDER_PENDING_COOKIE = 'az_order_pending';
const PROMO_MS = 2 * 60 * 60 * 1000;
const PROMO_COOKIE = 'az_promo_start';

const rateStore = globalThis.__azarbioRateStoreV2 || new Map();
const phoneStore = globalThis.__azarbioPhoneStoreV2 || new Map();
globalThis.__azarbioRateStoreV2 = rateStore;
globalThis.__azarbioPhoneStoreV2 = phoneStore;

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
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (_) { return null; }
  }
  if (Buffer.isBuffer(req.body)) {
    try { return JSON.parse(req.body.toString('utf8')); } catch (_) { return null; }
  }
  return null;
}

function normalizeMoroccanMobile(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('00212')) digits = digits.slice(5);
  if (digits.startsWith('212')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!/^[67]\d{8}$/.test(digits)) return '';
  return '0' + digits;
}

function touchWindow(store, key, now, windowMs, limit) {
  const recent = (store.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  store.set(key, recent);
  return true;
}

function readCookie(req, name) {
  const raw = String(req.headers.cookie || '');
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

function shippingForRequest(req, now) {
  const startedAt = Number(readCookie(req, PROMO_COOKIE));
  if (!Number.isFinite(startedAt) || startedAt <= 0 || startedAt > now + 60_000) return 35;
  return now - startedAt <= PROMO_MS ? 0 : 35;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return sendJson(res, 415, { ok: false, error: 'invalid_content_type' });
  }

  const body = parseBody(req);
  if (!body) return sendJson(res, 400, { ok: false, error: 'invalid_json' });

  if (clean(body.website, 120) || clean(body.company_website, 120)) {
    return sendJson(res, 200, { ok: true, ignored: true });
  }

  const ip = clean(String(req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket?.remoteAddress || 'unknown', 80);
  const now = Date.now();

  if (!touchWindow(rateStore, ip, now, RATE_WINDOW_MS, RATE_MAX)) {
    return sendJson(res, 429, { ok: false, error: 'too_many_requests' });
  }

  const name = clean(body.name, 100);
  const phone = normalizeMoroccanMobile(body.phone);
  const city = clean(body.city, 80);
  const address = clean(body.address, 220);
  const businessType = clean(body.business_type, 100);
  const offerPackage = clean(body.offer_package, 16);
  const notes = clean(body.notes, 800);
  const consentOrder = clean(body.consent_order, 10);
  const elapsedMs = Number(body.client_elapsed_ms || 0);

  if (name.length < 2) return sendJson(res, 400, { ok: false, error: 'invalid_name' });
  if (!phone) return sendJson(res, 400, { ok: false, error: 'invalid_phone' });
  if (city.length < 2) return sendJson(res, 400, { ok: false, error: 'invalid_city' });
  if (!ALLOWED_OFFERS[offerPackage]) return sendJson(res, 400, { ok: false, error: 'invalid_offer' });
  if (consentOrder !== 'yes') return sendJson(res, 400, { ok: false, error: 'consent_required' });
  if (Number.isFinite(elapsedMs) && elapsedMs > 0 && elapsedMs < 2500) {
    return sendJson(res, 400, { ok: false, error: 'too_fast' });
  }

  if (!touchWindow(phoneStore, phone, now, PHONE_WINDOW_MS, PHONE_MAX)) {
    return sendJson(res, 409, { ok: false, error: 'duplicate_phone' });
  }

  const offer = ALLOWED_OFFERS[offerPackage];
  const shippingFee = shippingForRequest(req, now);
  const orderTotal = offer.productTotal + shippingFee;
  const shippingText = shippingFee === 0 ? 'مجاني ضمن عرض الساعتين' : '35 درهم';

  const payload = {
    submitted_at: new Date().toISOString(),
    form_version: 'landing-v3-short',
    name,
    phone,
    city,
    address,
    business_type: businessType,
    offer_package: offerPackage,
    offer_quantity_kg: offerPackage.replace('KG', ''),
    offer_unit_price: String(offer.unit),
    offer_product_total: String(offer.productTotal),
    shipping_fee: String(shippingFee),
    offer_total: String(orderTotal),
    source: 'AzarBio Landing Page V2',
    utm_source: clean(body.utm_source, 120),
    utm_medium: clean(body.utm_medium, 120),
    utm_campaign: clean(body.utm_campaign, 160),
    utm_content: clean(body.utm_content, 160),
    utm_term: clean(body.utm_term, 160),
    landing_page: clean(body.landing_page || req.headers.referer || '', 500),
    consent_order: 'yes',
    notes: [
      address ? 'العنوان: ' + address : 'العنوان: يؤخذ هاتفياً عند التأكيد',
      'التوصيل: ' + shippingText,
      notes ? 'ملاحظة: ' + notes : ''
    ].filter(Boolean).join(' | '),
  };

  const webhook = String(process.env.MAKE_WEBHOOK_URL || '').trim();
  if (!/^https:\/\/hook\.eu1\.make\.com\/[A-Za-z0-9_-]+$/.test(webhook)) {
    console.error('AzarBio: MAKE_WEBHOOK_URL missing or invalid');
    return sendJson(res, 503, { ok: false, error: 'service_not_configured' });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AzarBio-Vercel-Lead-Proxy/2.1',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      console.error('AzarBio: Make webhook returned', response.status);
      return sendJson(res, 502, { ok: false, error: 'upstream_error' });
    }

    res.setHeader(
      'Set-Cookie',
      ORDER_PENDING_COOKIE + '=' + now + '; Path=/; Max-Age=259200; HttpOnly; Secure; SameSite=Lax'
    );

    return sendJson(res, 200, {
      ok: true,
      offer_package: offerPackage,
      shipping_fee: shippingFee,
      order_total: orderTotal,
      order_pending_days: 3
    });
  } catch (error) {
    console.error('AzarBio: lead proxy failed', error?.name || '', error?.message || error);
    return sendJson(res, 502, { ok: false, error: 'upstream_unavailable' });
  }
}
