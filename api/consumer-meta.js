import page from './consumer-page.js';

const PIXEL_ID = '1114950737910507';
const GA4_ID = 'G-GWDREPDPJC';
const CLARITY_ID = 'ygx63c3vf8';

export default function handler(req, res) {
  const originalEnd = res.end.bind(res);
  res.end = (body) => {
    if (typeof body === 'string' && body.includes('</head>')) {
      const analytics = `
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA4_ID}',{page_title:'AzarBio Offre Famille',page_type:'B2C'});</script>
<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');fbq('track','ViewContent',{content_name:'AzarBio Offre Famille B2C',content_category:'Fruits lyophilises - Consommateur',value:199,currency:'MAD'});</script>
<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,'clarity','script','${CLARITY_ID}');</script>`;
      body = body.replace('</head>', analytics + '</head>');
    }
    return originalEnd(body);
  };
  return page(req, res);
}
