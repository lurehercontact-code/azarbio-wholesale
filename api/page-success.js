import baseHandler from './page.js';

function enhanceSuccessExperience(html) {
  if (!html || !html.includes('id="leadForm"') || html.includes('id="thankYouPanel"')) return html;

  const styles = `
  <style>
    .thank-you-panel{display:none;text-align:center;padding:12px 2px 4px}
    .thank-you-panel.show{display:block;animation:thankYouIn .35s ease-out}
    .thank-you-icon{width:72px;height:72px;margin:2px auto 16px;border-radius:50%;display:grid;place-items:center;background:#eaf2ed;color:#173d2c;font-size:34px;font-weight:900;box-shadow:0 10px 28px rgba(23,61,44,.14)}
    .thank-you-panel h3{font-size:30px;line-height:1.35;margin:0 0 10px;color:#173d2c}
    .thank-you-lead{font-size:16px;line-height:1.9;color:#46554b;margin:0 auto 16px;max-width:500px}
    .thank-you-offer{background:#f8f4ec;border:1px solid #e5ddd2;border-radius:17px;padding:13px 14px;margin:0 auto 15px;text-align:right;max-width:500px}
    .thank-you-offer small{display:block;color:#657067;font-size:12px;margin-bottom:2px}
    .thank-you-offer strong{display:block;color:#173d2c;font-size:18px;line-height:1.55}
    .phone-reminder{background:#eaf2ed;border-radius:17px;padding:14px;margin:0 auto 18px;color:#173d2c;font-size:14px;font-weight:800;line-height:1.75;max-width:500px}
    .thank-you-confirm{width:100%;min-height:54px;font-size:15px;margin-top:2px}
    .thank-you-wish{font-size:13px;color:#657067;margin:13px 0 0}
    .modal-box.success-mode .close,.modal-box.success-mode #modalTitle,.modal-box.success-mode .modal-intro,.modal-box.success-mode .selected-line{display:none}
    @keyframes thankYouIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @media(min-width:700px){.thank-you-panel{padding:18px 12px 8px}.thank-you-confirm{width:auto;min-width:300px}}
  </style>`;

  const panel = `
      <section class="thank-you-panel" id="thankYouPanel" aria-live="polite" aria-labelledby="thankYouTitle">
        <div class="thank-you-icon" aria-hidden="true">✓</div>
        <h3 id="thankYouTitle">مبروك يا <span id="thankYouName"></span> 🎉</h3>
        <p class="thank-you-lead">خطوة موفقة. توصلنا بمعلوماتك بنجاح ونتمنى لك كل التوفيق في مشروعك مع الفواكه المجففة بالتجميد.</p>
        <div class="thank-you-offer"><small>الاختيار ديالك</small><strong id="thankYouOffer"></strong></div>
        <div class="phone-reminder">غادي نتاصلوا بيك في أقرب وقت. خلي هاتفك شغال وقريب منك، وانتبه للمكالمات الواردة باش ما يفوتكش اتصالنا.</div>
        <button class="btn primary thank-you-confirm" type="button" id="thankYouConfirm">تمام، سأبقى منتبهاً للهاتف</button>
        <p class="thank-you-wish">بالتوفيق، وفريق AzarBio سعيد ببدايتك معنا.</p>
      </section>`;

  const script = `
  <script>
    (() => {
      const form = document.getElementById('leadForm');
      const modal = document.getElementById('offerModal');
      const modalBox = modal && modal.querySelector('.modal-box');
      const closeBtn = document.getElementById('closeModal');
      const statusEl = document.getElementById('formStatus');
      const selectedText = document.getElementById('selectedOfferText');
      const selectedSub = document.getElementById('selectedOfferSub');
      const panel = document.getElementById('thankYouPanel');
      const nameEl = document.getElementById('thankYouName');
      const offerEl = document.getElementById('thankYouOffer');
      const confirmBtn = document.getElementById('thankYouConfirm');
      if (!form || !modal || !panel || !confirmBtn) return;

      function resetSuccessView() {
        panel.classList.remove('show');
        form.style.display = '';
        if (modalBox) modalBox.classList.remove('success-mode');
        if (closeBtn) closeBtn.style.display = '';
        if (statusEl) {
          statusEl.className = 'status';
          statusEl.textContent = '';
        }
      }

      document.querySelectorAll('.offer').forEach(card => {
        card.addEventListener('click', resetSuccessView);
        card.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') resetSuccessView();
        });
      });

      document.addEventListener('submit', async (event) => {
        if (event.target !== form) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (statusEl) {
          statusEl.className = 'status';
          statusEl.textContent = '';
        }

        const button = form.querySelector('button[type="submit"]');
        const originalText = button ? button.textContent : '';
        if (button) {
          button.disabled = true;
          button.textContent = 'جاري الإرسال...';
        }

        try {
          const data = Object.fromEntries(new FormData(form).entries());
          const customerName = String(data.name || '').trim();
          const params = new URLSearchParams(window.location.search);
          data.source = 'AzarBio - صفحة الجملة';
          data.utm_source = params.get('utm_source') || '';
          data.utm_medium = params.get('utm_medium') || '';
          data.utm_campaign = params.get('utm_campaign') || '';
          data.utm_content = params.get('utm_content') || '';
          data.utm_term = params.get('utm_term') || '';
          data.landing_page = window.location.href;

          const response = await fetch('/api/lead', {
            method: 'POST',
            headers: {'Content-Type':'application/json','Accept':'application/json'},
            credentials: 'same-origin',
            cache: 'no-store',
            body: JSON.stringify(data)
          });

          let result = {};
          try { result = await response.json(); } catch (_) {}
          if (!response.ok || result.ok !== true) throw new Error(result.error || ('http_' + response.status));

          const offerText = [selectedText ? selectedText.textContent : '', selectedSub ? selectedSub.textContent : ''].filter(Boolean).join(' — ');
          nameEl.textContent = customerName || 'صديقنا';
          offerEl.textContent = offerText || 'تم تسجيل اختيارك بنجاح';

          form.style.display = 'none';
          if (modalBox) modalBox.classList.add('success-mode');
          if (closeBtn) closeBtn.style.display = 'none';
          panel.classList.add('show');
          panel.setAttribute('tabindex', '-1');
          panel.focus({preventScroll:true});
          panel.scrollIntoView({behavior:'smooth', block:'center'});

          form.reset();
        } catch (error) {
          const code = error && error.message ? error.message : '';
          const messages = {
            invalid_name:'المرجو إدخال الاسم بشكل صحيح.',
            invalid_phone:'المرجو إدخال رقم هاتف صحيح.',
            invalid_offer:'المرجو إعادة اختيار العرض.',
            too_many_requests:'تم إرسال محاولات كثيرة. انتظر دقيقة وحاول من جديد.',
            service_not_configured:'خدمة استقبال الطلبات غير مفعلة حالياً.',
            upstream_error:'تعذر تسجيل الطلب حالياً. حاول بعد قليل.',
            upstream_unavailable:'تعذر الاتصال بخدمة تسجيل الطلبات حالياً.'
          };
          if (statusEl) {
            statusEl.textContent = messages[code] || 'تعذر إرسال الطلب حالياً. حاول مرة أخرى بعد قليل أو تواصل معنا عبر واتساب.';
            statusEl.classList.add('error');
          }
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = originalText;
          }
        }
      }, true);

      confirmBtn.addEventListener('click', () => {
        resetSuccessView();
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    })();
  </script>`;

  html = html.replace('</head>', styles + '\n</head>');
  html = html.replace('</form>', '</form>' + panel);
  html = html.replace('</body>', script + '\n</body>');
  return html;
}

export default function handler(req, res) {
  const originalEnd = res.end.bind(res);
  res.end = (body, ...args) => {
    if (req.method === 'GET' && typeof body === 'string') {
      body = enhanceSuccessExperience(body);
    }
    return originalEnd(body, ...args);
  };
  return baseHandler(req, res);
}
