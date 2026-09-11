import fs from 'node:fs';
import path from 'node:path';

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.statusCode = 405;
    return res.end();
  }

  const filePath = path.join(process.cwd(), 'index.html');
  let html = fs.readFileSync(filePath, 'utf8');

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

  if (!html.includes('name="website"')) {
    html = html.replace(
      '<form id="leadForm">',
      '<form id="leadForm" autocomplete="on"><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:1px;width:1px">'
    );
  }

  const secureHandler = `
<script>
(() => {
  const form = document.getElementById('leadForm');
  const statusEl = document.getElementById('formStatus');
  if (!form || !statusEl) return;

  document.addEventListener('submit', async (event) => {
    if (event.target !== form) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    statusEl.className = 'status';
    statusEl.textContent = '';

    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton ? submitButton.textContent : '';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'جاري الإرسال...';
    }

    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const params = new URLSearchParams(window.location.search);
      data.source = 'AzarBio Landing Page';
      data.utm_source = params.get('utm_source') || '';
      data.utm_medium = params.get('utm_medium') || '';
      data.utm_campaign = params.get('utm_campaign') || '';
      data.utm_content = params.get('utm_content') || '';
      data.utm_term = params.get('utm_term') || '';
      data.landing_page = window.location.href;

      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data)
      });

      let result = {};
      try { result = await response.json(); } catch (_) {}

      if (!response.ok || !result.ok) {
        const code = result && result.error ? result.error : 'request_failed';
        throw new Error(code);
      }

      statusEl.textContent = 'تم إرسال طلبك بنجاح. سنتواصل معك قريباً.';
      statusEl.classList.add('success');
      form.reset();
    } catch (error) {
      console.error('AzarBio lead submit failed:', error && error.message ? error.message : error);
      statusEl.textContent = 'تعذر إرسال الطلب حالياً. حاول مرة أخرى بعد قليل.';
      statusEl.classList.add('error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  }, true);
})();
</script>`;

  html = html.replace('</body>', secureHandler + '\n</body>');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests");

  if (req.method === 'HEAD') {
    res.statusCode = 200;
    return res.end();
  }

  res.statusCode = 200;
  return res.end(html);
}
