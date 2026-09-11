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
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    return json(res, 415, { ok: false, error: 'invalid_content_type' });
  }

  const ip = clean((req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket?.remoteAddress || 'unknown', 80);
  const now = Date.now();
  const recent = (rateStore.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    return json(res, 429, { ok: false, error: 'too_many_requests' });
  }
  recent.push(now);
  rateStore.set(ip, recent);

  const body = req.body || {};
  if (body.website || body.company_website) {
    return json(res, 200, { ok: true });
  }

  const name = clean(body.name, 100);
  const phone = clean(body.phone, 32);
  const city = clean(body.city, 80);
  const businessType = clean(body.business_type, 80);
  const offerPackage = clean(body.offer_package, 16);
  const notes = clean(body.notes, 800);

  if (name.length < 2 || phone.length < 8 || !ALLOWED_OFFERS[offerPackage]) {
    return json(res, 400, { ok: false, error: 'invalid_input' });
  }

  const offer = ALLOWED_OFFERS[offerPackage];
  const payload = {
    submitted_at: new Date().toISOString(),
    name,
    phone,
    city,
    business_type: businessType,
    offer_package: offerPackage,
    offer_unit_price: String(offer.unit),
    offer_total: String(offer.total),
    source: 'AzarBio Landing Page',
    utm_source: clean(body.utm_source, 120),
    utm_medium: clean(body.utm_medium, 120),
    utm_campaign: clean(body.utm_campaign, 160),
    utm_content: clean(body.utm_content, 160),
    utm_term: clean(body.utm_term, 160),
    landing_page: clean(body.landing_page || req.headers.referer, 500),
    notes,
  };

  const webhook = process.env.MAKE_WEBHOOK_URL;
  if (!webhook || !/^https:\/\/hook\.eu1\.make\.com\//.test(webhook)) {
    console.error('MAKE_WEBHOOK_URL missing or invalid');
    return json(res, 503, { ok: false, error: 'service_not_configured' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AzarBio-Vercel-Lead-Proxy/1.0',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error('Make webhook error', response.status);
      return json(res, 502, { ok: false, error: 'upstream_error' });
    }

    return json(res, 200, { ok: true });
  } catch (error) {
    console.error('Lead proxy failed', error?.message || error);
    return json(res, 502, { ok: false, error: 'upstream_unavailable' });
  }
}
