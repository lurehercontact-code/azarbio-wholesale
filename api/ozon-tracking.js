const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 500;
const rateStore = globalThis.__azarbioOzonProxyRate || new Map();
globalThis.__azarbioOzonProxyRate = rateStore;

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || String(req.socket?.remoteAddress || 'unknown');
}

function allowRate(ip) {
  const now = Date.now();
  const recent = (rateStore.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now);
  rateStore.set(ip, recent);
  return true;
}

function parseBasicAuth(header) {
  const raw = String(header || '');
  if (!raw.startsWith('Basic ')) return null;
  try {
    const decoded = Buffer.from(raw.slice(6), 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    if (idx <= 0) return null;
    const customerId = decoded.slice(0, idx).trim();
    const apiKey = decoded.slice(idx + 1).trim();
    if (!customerId || !apiKey) return null;
    return { customerId, apiKey };
  } catch {
    return null;
  }
}

function normalizeHistory(history) {
  if (!history) return [];
  if (Array.isArray(history)) return history;
  if (typeof history === 'object') return Object.values(history);
  return [];
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  if (!allowRate(clientIp(req))) {
    return sendJson(res, 429, { ok: false, error: 'rate_limited' });
  }

  const auth = parseBasicAuth(req.headers.authorization);
  if (!auth) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Ozon Proxy"');
    return sendJson(res, 401, { ok: false, error: 'invalid_credentials' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body && typeof body === 'object' ? body : {};

  const trackingNumber = String(
    body.tracking_number || body['tracking-number'] || ''
  ).trim();

  if (!/^[A-Za-z0-9_-]{5,80}$/.test(trackingNumber)) {
    return sendJson(res, 400, { ok: false, error: 'invalid_tracking_number' });
  }

  const url =
    'https://api.ozonexpress.ma/customers/' +
    encodeURIComponent(auth.customerId) +
    '/' +
    encodeURIComponent(auth.apiKey) +
    '/tracking';

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'tracking-number': trackingNumber }).toString(),
      redirect: 'follow'
    });

    const text = await upstream.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return sendJson(res, 502, {
        ok: false,
        error: 'ozon_invalid_response',
        upstream_status: upstream.status
      });
    }

    if (!upstream.ok) {
      return sendJson(res, 502, {
        ok: false,
        error: 'ozon_http_error',
        upstream_status: upstream.status
      });
    }

    const check = payload?.CHECK_API || {};
    const tracking = payload?.TRACKING || {};
    const history = normalizeHistory(tracking?.HISTORY)
      .filter((item) => item && typeof item === 'object')
      .sort((a, b) => num(a.TIME) - num(b.TIME));

    const last = tracking?.LAST_TRACKING || history[history.length - 1] || {};
    const first = history[0] || {};

    const lastStatus = String(last?.STATUT || '').trim();
    const lastTime = num(last?.TIME);
    const createdTime = num(first?.TIME);

    return sendJson(res, 200, {
      ok: String(check?.RESULT || '').toUpperCase() === 'SUCCESS' &&
          String(tracking?.RESULT || '').toUpperCase() === 'SUCCESS',
      tracking_number: String(
        tracking?.['TRACKING-NUMBER'] ||
        tracking?.TRACKING_NUMBER ||
        trackingNumber
      ),
      last_status: lastStatus,
      last_time: lastTime,
      last_time_str: String(last?.TIME_STR || ''),
      last_comment: String(last?.COMMENT || ''),
      created_time: createdTime,
      created_time_str: String(first?.TIME_STR || ''),
      is_delivered: lastStatus.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'livre'
    });
  } catch {
    return sendJson(res, 502, { ok: false, error: 'ozon_unreachable' });
  }
}
