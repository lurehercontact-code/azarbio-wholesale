import baseHandler from './page-success.js';

const META_PIXEL_ID = '1335011538356784';
const GA4_MEASUREMENT_ID = 'G-GWDREPDPJC';
const CLARITY_PROJECT_ID = 'ygx63c3vf8';

function enhanceCsp(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(
      "default-src 'self'",
      "default-src 'self' https://*.clarity.ms https://c.bing.com"
    )
    .replace(
      "script-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://www.googletagmanager.com https://www.clarity.ms https://*.clarity.ms"
    )
    .replace(
      "connect-src 'self'",
      "connect-src 'self' https://www.facebook.com https://graph.facebook.com https://connect.facebook.net https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://*.google-analytics.com https://www.clarity.ms https://*.clarity.ms https://c.bing.com"
    );
}

function injectAnalytics(html) {
  if (!html || html.includes('id="azarbio-analytics-suite"')) return html;

  const analytics = `
  <script id="azarbio-analytics-suite">
    (() => {
      const META_PIXEL_ID = '${META_PIXEL_ID}';
      const GA4_MEASUREMENT_ID = '${GA4_MEASUREMENT_ID}';
      const CLARITY_PROJECT_ID = '${CLARITY_PROJECT_ID}';

      !function(f,b,e,v,n,t,s){
        if(f.fbq)return;
        n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
        t=b.createElement(e);t.async=!0;t.src=v;
        s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
      }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

      fbq('init', META_PIXEL_ID);
      fbq('track', 'PageView');
      fbq('track', 'ViewContent', {
        content_name: 'AzarBio - Wholesale V2',
        content_category: 'Fruits lyophilises en gros'
      });

      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_MEASUREMENT_ID);
      document.head.appendChild(gaScript);
      window.gtag('js', new Date());
      window.gtag('config', GA4_MEASUREMENT_ID, {send_page_view:true});

      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);

      const gaEvent = (name, params) => {
        try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (_) {}
      };
      const clarityEvent = (name) => {
        try { if (typeof window.clarity === 'function') window.clarity('event', name); } catch (_) {}
      };
      const valueFor = (offer) => ({
        '2.5KG':447.5,
        '5KG':799,
        '10KG':1450
      })[offer] || 0;

      const form = document.getElementById('leadForm');
      let formStarted = false;

      document.querySelectorAll('.offer-card').forEach(card => {
        card.addEventListener('click', () => {
          const offer = String(card.dataset.offer || '');
          gaEvent('offer_selected', {
            offer_package: offer || 'unknown',
            value: valueFor(offer),
            currency: 'MAD'
          });
          clarityEvent('offer_selected');
        });
      });

      if (form) {
        const markStart = (event) => {
          if (formStarted) return;
          if (event?.target?.type === 'hidden') return;
          formStarted = true;
          const offer = String(form.querySelector('[name="offer_package"]')?.value || '');
          gaEvent('form_start', {offer_package:offer || 'unknown'});
          clarityEvent('form_start');
        };
        form.addEventListener('input', markStart, {passive:true});
        form.addEventListener('change', markStart, {passive:true});
        form.addEventListener('invalid', () => {
          gaEvent('form_error', {error_type:'validation'});
          clarityEvent('form_error');
        }, true);
      }

      document.addEventListener('click', event => {
        const link = event.target?.closest?.('a[href]');
        if (!link) return;
        const href = String(link.getAttribute('href') || '');
        const isWhatsapp = href.includes('wa.me');
        const isPhone = href.startsWith('tel:');
        const isEmail = href.startsWith('mailto:');
        if (!isWhatsapp && !isPhone && !isEmail) return;

        const contactType = isWhatsapp ? 'whatsapp' : (isPhone ? 'phone' : 'email');
        fbq('track', 'Contact', {content_name:contactType});
        gaEvent('contact_click', {contact_type:contactType});
        if (isWhatsapp) gaEvent('whatsapp_click', {});
        clarityEvent(isWhatsapp ? 'whatsapp_click' : 'contact_click');
      }, {passive:true});

      const nativeFetch = window.fetch.bind(window);
      window.fetch = async function(input, init) {
        const response = await nativeFetch(input, init);

        try {
          const url = typeof input === 'string' ? input : String(input?.url || '');
          const method = String(init?.method || 'GET').toUpperCase();

          if (url.includes('/api/lead') && method === 'POST') {
            let payload = {};
            try { payload = JSON.parse(init?.body || '{}'); } catch (_) {}
            const offer = String(payload.offer_package || '');
            const result = await response.clone().json().catch(() => null);

            if (response.ok && result?.ok === true && result?.ignored !== true) {
              fbq('track', 'Lead', {
                currency:'MAD',
                value:valueFor(offer),
                content_name:'AzarBio - Wholesale Lead V2',
                content_category:'Fruits lyophilises en gros',
                content_ids:offer ? [offer] : []
              });
              gaEvent('generate_lead', {
                currency:'MAD',
                value:valueFor(offer),
                offer_package:offer || 'unknown',
                form_version:'landing-v2'
              });
              clarityEvent('generate_lead');
            } else {
              gaEvent('form_error', {
                error_type:String(result?.error || 'submit_failed').slice(0,60),
                offer_package:offer || 'unknown'
              });
              clarityEvent('form_error');
            }
          }
        } catch (_) {}

        return response;
      };
    })();
  </script>
  <noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1"></noscript>`;

  return html.replace('</head>', analytics + '\n</head>');
}

export default function handler(req, res) {
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = (name, value) => {
    if (String(name).toLowerCase() === 'content-security-policy') value = enhanceCsp(value);
    return originalSetHeader(name, value);
  };

  const originalEnd = res.end.bind(res);
  res.end = (body, ...args) => {
    if (req.method === 'GET' && typeof body === 'string') body = injectAnalytics(body);
    return originalEnd(body, ...args);
  };

  return baseHandler(req, res);
}
