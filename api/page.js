import fs from 'node:fs';
import path from 'node:path';

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  const filePath = path.join(process.cwd(), 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');

  // Never expose the Make webhook to the browser. Route form submissions through /api/lead.
  html = html.replace(
    /const MAKE_WEBHOOK_URL\s*=\s*["'][^"']*["'];/,
    'const MAKE_WEBHOOK_URL = "/api/lead";'
  );

  html = html.replace(
    'الفورم مهيأ باش يرسل البيانات إلى Make webhook، ومن Make تمشي مباشرة إلى Google Sheet.',
    'الطلب كيتعالج عبر اتصال آمن من السيرفر، ومن بعد كيمشي أوتوماتيكياً إلى نظام المتابعة.'
  );
  html = html.replace(
    'منين نضيف رابط Make الحقيقي ديالك، كل Lead جديد غادي يتسجل أوتوماتيكياً.',
    'كل Lead جديد كيتسجل أوتوماتيكياً في نظام المتابعة بدون إظهار روابط الأتمتة للزائر.'
  );
  html = html.replace(
    'Make integration ready: أضف رابط Webhook ديال Make في الكود لتفعيل الإرسال التلقائي نحو Google Sheet.',
    'معلوماتك كتترسل عبر اتصال آمن ومخصصة فقط لمعالجة طلبك والتواصل معك.'
  );

  // Add privacy-friendly UTM collection and a hidden honeypot without changing the visible form.
  html = html.replace(
    '<form id="leadForm">',
    '<form id="leadForm" autocomplete="on"><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:1px;width:1px">'
  );

  html = html.replace(
    "data.source = 'AzarBio Landing Page';\n      data.submitted_at = new Date().toISOString();",
    "data.source = 'AzarBio Landing Page';\n      data.submitted_at = new Date().toISOString();\n      const params = new URLSearchParams(location.search);\n      data.utm_source = params.get('utm_source') || '';\n      data.utm_medium = params.get('utm_medium') || '';\n      data.utm_campaign = params.get('utm_campaign') || '';\n      data.utm_content = params.get('utm_content') || '';\n      data.utm_term = params.get('utm_term') || '';\n      data.landing_page = location.href;"
  );

  html = html.replace(
    /if\(!MAKE_WEBHOOK_URL\)\s*\{[\s\S]*?return;\s*\}/,
    ''
  );

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests");

  if (req.method === 'HEAD') return res.status(200).end();
  return res.status(200).send(html);
}
