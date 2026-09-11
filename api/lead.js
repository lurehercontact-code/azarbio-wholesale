const ALLOWED_OFFERS = {
  '1KG': { unit: 199, total: 199 },
  '2.5KG': { unit: 179, total: 447.5 },
  '5KG': { unit: 149, total: 745 },
  '10KG': { unit: 145, total: 1450 },
};

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 8;
const rateStore = globalThis.__azarbioRateStore || new Map();
globalThis.__azarbioRateStore = rateStore;

function clean(value, max = 200) {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .trim()
    .slice(0, max);
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (_) { return null; }
  }

  if (Buffer.isBuffer(req.body)) {
    try { return JSON.parse(req.body.toString('utf8')); } catch (_) { return null; }
  }

  return null;
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

  const ip = clean(
    String(req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket?.remoteAddress || 'unknown',
    80
  );

  const now = Date.now();
  const recent = (rateStore.get(ip) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    return sendJson(res, 429, { ok: false, error: 'too_many_requests' });
  }
  recent.push(now);
  rateStore.set(ip, recent);

  const body = parseBody(req);
  if (!body) {
    return sendJson(res, 400, { ok: false, error: 'invalid_json' });
  }

  // Honeypot for simple bots.
  if (clean(body.website, 120) || clean(body.company_website, 120)) {
    return sendJson(res, 200, { ok: true });
  }

  const name = clean(body.name, 100);
  const phone = clean(body.phone, 32);
  const city = clean(body.city, 80);
  const businessType = clean(body.business_type, 80);
  const offerPackage = clean(body.offer_package, 16);
  const notes = clean(body.notes, 800);

  if (name.length < 2) {
    return sendJson(res, 400, { ok: false, error: 'invalid_name' });
  }
  if (phone.replace(/\D/g, '').length < 8) {
    return sendJson(res, 400, { ok: false, error: 'invalid_phone' });
  }
  if (!ALLOWED_OFFERS[offerPackage]) {
    return sendJson(res, 400, { ok: false, error: 'invalid_offer' });
  }

  const offer = ALLOWED_OFFERS[offerPackage];
  const payload = {
    submitted_at: new Date().toISOString(),
    name,
    phone,
    city,
    business_type: businessType,
    offer_package: offerPackage,
    offer_quantity_kg: offerPackage.replace('KG', ''),
    offer_unit_price: String(offer.unit),
    offer_total: String(offer.total),
    source: 'AzarBio Landing Page',
    utm_source: clean(body.utm_source, 120),
    utm_medium: clean(body.utm_medium, 120),
    utm_campaign: clean(body.utm_campaign, 160),
    utm_content: clean(body.utm_content, 160),
    utm_term: clean(body.utm_term, 160),
    landing_page: clean(body.landing_page || req.headers.referer || '', 500),
    notes,
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
        'User-Agent': 'AzarBio-Vercel-Lead-Proxy/1.1',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      console.error('AzarBio: Make webhook returned', response.status);
      return sendJson(res, 502, { ok: false, error: 'upstream_error' });
    }

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('AzarBio: lead proxy failed', error?.name || '', error?.message || error);
    return sendJson(res, 502, { ok: false, error: 'upstream_unavailable' });
  }
}
