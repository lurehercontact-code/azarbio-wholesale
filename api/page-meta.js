import baseHandler from './page-success.js';

const META_PIXEL_ID = '1335011538356784';

function enhanceCsp(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(
      "script-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' https://connect.facebook.net"
    )
    .replace(
      "connect-src 'self'",
      "connect-src 'self' https://www.facebook.com https://graph.facebook.com https://connect.facebook.net"
    );
}

function injectMetaPixel(html) {
  if (!html || html.includes(`fbq('init','${META_PIXEL_ID}')`) || html.includes(`fbq('init', '${META_PIXEL_ID}')`)) {
    return html;
  }

  const metaPixel = `
  <script>
    (() => {
      const META_PIXEL_ID = '${META_PIXEL_ID}';

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
        content_name: 'AzarBio - البيع بالجملة',
        content_category: 'فواكه مجففة بالتجميد'
      });

      document.addEventListener('click', (event) => {
        const link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
        if (!link) return;
        const href = String(link.getAttribute('href') || '');
        if (href.includes('wa.me') || href.startsWith('tel:') || href.startsWith('mailto:')) {
          fbq('track', 'Contact', {
            content_name: href.includes('wa.me') ? 'واتساب' : (href.startsWith('tel:') ? 'اتصال هاتفي' : 'بريد إلكتروني')
          });
        }
      }, {passive:true});

      const nativeFetch = window.fetch.bind(window);
      window.fetch = async function(input, init) {
        const response = await nativeFetch(input, init);

        try {
          const url = typeof input === 'string' ? input : String((input && input.url) || '');
          const method = String((init && init.method) || 'GET').toUpperCase();

          if (url.includes('/api/lead') && method === 'POST' && response.ok) {
            const result = await response.clone().json().catch(() => null);
            if (result && result.ok === true) {
              let payload = {};
              try { payload = JSON.parse((init && init.body) || '{}'); } catch (_) {}

              const totals = {
                '1KG': 199,
                '2.5KG': 447.5,
                '5KG': 745,
                '10KG': 1450
              };
              const selectedPackage = String(payload.offer_package || '');

              fbq('track', 'Lead', {
                currency: 'MAD',
                value: totals[selectedPackage] || 0,
                content_name: 'AzarBio - طلب جملة',
                content_category: 'فواكه مجففة بالتجميد',
                content_ids: selectedPackage ? [selectedPackage] : []
              });
            }
          }
        } catch (_) {
          // Analytics must never interrupt the customer flow.
        }

        return response;
      };
    })();
  </script>
  <noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1"></noscript>`;

  return html.replace('</head>', metaPixel + '\n</head>');
}

export default function handler(req, res) {
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = (name, value) => {
    if (String(name).toLowerCase() === 'content-security-policy') {
      value = enhanceCsp(value);
    }
    return originalSetHeader(name, value);
  };

  const originalEnd = res.end.bind(res);
  res.end = (body, ...args) => {
    if (req.method === 'GET' && typeof body === 'string') {
      body = injectMetaPixel(body);
    }
    return originalEnd(body, ...args);
  };

  return baseHandler(req, res);
}
