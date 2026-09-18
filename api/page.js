import fs from 'node:fs';
import path from 'node:path';

const OFFERS = {
  '2.5KG': { label: 'عرض البداية', qty: '2.5 كغ', unit: 179, productTotal: 447.5, note: 'مناسب لأول تجربة وإعادة البيع' },
  '5KG': { label: 'عرض التاجر', qty: '5 كغ', unit: 159.8, productTotal: 799, note: 'كمية أكبر وسعر/كغ أقل' },
  '10KG': { label: 'أفضل سعر للكيلو', qty: '10 كغ', unit: 145, productTotal: 1450, note: 'للمحلات والطلبات الأكبر' }
};

const PROMO_MS = 2 * 60 * 60 * 1000;
const PROMO_COOKIE = 'az_promo_start';

let embeddedHeroCache = '';
function getEmbeddedHero() {
  if (embeddedHeroCache) return embeddedHeroCache;
  const source = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const images = [...source.matchAll(/<img\s+[^>]*src="([^"]+)"[^>]*>/gi)].map((m) => m[1]);
  embeddedHeroCache = images[4] || images[0] || '';
  return embeddedHeroCache;
}

function readCookie(req, name) {
  const raw = String(req.headers.cookie || '');
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

function promoState(req, res) {
  const now = Date.now();
  let startedAt = Number(readCookie(req, PROMO_COOKIE));
  const maxPast = 30 * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(startedAt) || startedAt <= 0 || startedAt > now + 60_000 || now - startedAt > maxPast) {
    startedAt = now;
    res.setHeader('Set-Cookie', PROMO_COOKIE + '=' + startedAt + '; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax');
  }
  return { startedAt, deadline: startedAt + PROMO_MS };
}

function securityHeaders(res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https://www.facebook.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
}

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.statusCode = 405;
    return res.end();
  }

  securityHeaders(res);
  const promo = promoState(req, res);
  const heroSrc = getEmbeddedHero();

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#0f4a2d">
  <meta name="description" content="AzarBio — فواكه مجففة بالتبريد بالجملة للمحلات وإعادة البيع. 6 فواكه في المزيج والطلب ابتداءً من 2.5 كغ.">
  <title>AzarBio | الفواكه المجففة بالتبريد بالجملة</title>
  <style>
    :root{
      --green:#0f4a2d;--green2:#17683e;--green3:#eaf4ed;--gold:#d6aa4d;--gold2:#fff3cf;
      --cream:#fbf8f1;--ink:#17211b;--muted:#657169;--line:#e3e9e5;--red:#bb2d2d;--white:#fff;
      --shadow:0 14px 36px rgba(15,74,45,.10);--radius:20px
    }
    *{box-sizing:border-box}html{scroll-behavior:smooth;max-width:100%;overflow-x:hidden}
    body{margin:0;background:#fff;color:var(--ink);font-family:Arial,Tahoma,"Noto Sans Arabic",sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased;padding-bottom:72px;max-width:100%;overflow-x:hidden;position:relative}
    button,input,select,textarea{font:inherit}button{cursor:pointer}img{display:block;width:100%;max-width:100%;height:auto}a{color:inherit}
    .wrap{width:min(calc(100% - 24px),1120px);max-width:calc(100vw - 24px);margin:auto;min-width:0}
    .ticker{position:relative;width:100%;max-width:100vw;overflow:hidden;contain:paint;clip-path:inset(0);background:var(--green);color:#fff;border-bottom:1px solid rgba(255,255,255,.1);direction:rtl}
    .ticker-track{display:flex;width:max-content;min-width:max-content;max-width:none;gap:42px;padding:8px 0;font-size:12px;font-weight:900;white-space:nowrap;will-change:transform;animation:tickerScroll 28s linear infinite;transform:translateZ(0)}
    .ticker-item{display:flex;gap:42px;flex:0 0 auto}
    .ticker b{color:#ffe49a}
    @keyframes tickerScroll{from{transform:translate3d(0,0,0)}to{transform:translate3d(33.333333%,0,0)}}
    .brandrow{display:flex;align-items:center;justify-content:space-between;padding:12px 0}
    .brand{display:flex;align-items:center;gap:9px;text-decoration:none}.mark{width:42px;height:42px;border-radius:14px;background:var(--green);color:#fff;display:grid;place-items:center;font-weight:1000;font-size:21px}.brand b{display:block;color:var(--green);font-size:22px;line-height:1}.brand small{display:block;color:var(--muted);font-size:10px;margin-top:4px}
    .wholesale-pill{background:var(--gold2);color:#6c4b08;border:1px solid #efd58d;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:900}
    .hero{padding:3px 0 26px;min-width:0}.hero-grid{display:grid;gap:14px;min-width:0}.hero-grid>*{min-width:0}.hero-copy{padding:7px 2px 0}.kicker{display:inline-flex;align-items:center;gap:6px;background:var(--green3);color:var(--green);border:1px solid #d3e8da;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:900}
    h1{font-size:clamp(34px,10vw,62px);line-height:1.12;margin:10px 0 10px;color:var(--green);letter-spacing:-.7px}.gold{color:#a5771c}
    .lead{font-size:15px;color:#35433a;margin:0 0 12px;font-weight:700}.hero-cta{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.hero-cta a{flex:1;min-width:150px;min-height:50px;border-radius:14px;text-decoration:none;display:flex;align-items:center;justify-content:center;font-weight:900}.cta-main{background:var(--green);color:#fff}.cta-ghost{border:1px solid var(--green);color:var(--green);background:#fff}
    .hero-media{position:relative;overflow:hidden;border-radius:24px;background:#eee;box-shadow:var(--shadow)}.hero-media img{aspect-ratio:1/1;object-fit:cover}.stock-badge{position:absolute;right:12px;bottom:12px;background:rgba(255,255,255,.95);color:var(--green);padding:8px 11px;border-radius:13px;font-size:11px;font-weight:900;box-shadow:0 8px 22px rgba(0,0,0,.15)}
    .trust{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:12px}.trust div{border:1px solid var(--line);background:#fff;border-radius:14px;padding:10px 6px;text-align:center;font-size:11px;font-weight:900;color:var(--green);box-shadow:0 5px 14px rgba(15,74,45,.04)}
    .section{padding:36px 0}.soft{background:var(--cream)}.section-title{margin-bottom:18px}.section-title h2{font-size:27px;line-height:1.3;color:var(--green);margin:0 0 5px}.section-title p{font-size:14px;color:var(--muted);margin:0}
    .fruit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.fruit{background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px 7px;text-align:center}.fruit .ico{font-size:28px;line-height:1.1}.fruit b{display:block;color:var(--green);font-size:13px;margin-top:5px}.mix-note{margin-top:12px;background:var(--green3);border:1px solid #d4e7da;border-radius:15px;padding:12px;font-size:12px;color:#355542}
    .opportunity{display:grid;gap:12px;min-width:0}.opportunity>*{min-width:0}.split-card,.why-card,.calc-card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:17px;box-shadow:var(--shadow)}.split-card h3,.why-card h3,.calc-card h3{margin:0 0 8px;color:var(--green);font-size:21px}.split-examples{display:grid;grid-template-columns:1fr 1fr;gap:8px}.split-examples div{background:var(--cream);border-radius:14px;padding:13px;text-align:center}.split-examples strong{font-size:25px;color:var(--green);display:block}.split-examples span{font-size:12px;color:var(--muted);font-weight:800}
    .why-list{display:grid;gap:8px}.why-list div{display:flex;align-items:flex-start;gap:8px;font-size:13px}.check{width:22px;height:22px;border-radius:50%;background:var(--green3);color:var(--green);display:grid;place-items:center;font-weight:1000;flex:0 0 auto}
    .calc-row{display:grid;grid-template-columns:1fr .8fr;gap:8px;align-items:end}.calc-card label{font-size:12px;font-weight:900;color:#3e4d44}.calc-card input{width:100%;height:48px;border:1.5px solid #ccd6cf;border-radius:12px;padding:10px;font-size:16px}.calc-result{background:var(--green);color:#fff;border-radius:14px;padding:12px;text-align:center}.calc-result small{display:block;opacity:.78;font-size:10px}.calc-result strong{font-size:22px}.disclaimer{font-size:10px;color:var(--muted);margin:8px 0 0}
    .promo{background:linear-gradient(135deg,#0c3e26,#17683e);color:#fff;border-radius:24px;padding:18px;box-shadow:0 18px 38px rgba(15,74,45,.22);position:relative;overflow:hidden}.promo:before{content:"";position:absolute;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.06);left:-60px;top:-70px}.promo-top{position:relative;display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;min-width:0}.promo h3{font-size:23px;margin:0 0 4px}.promo p{margin:0;font-size:12px;opacity:.88}.free-badge{background:#fff;color:var(--green);border-radius:13px;padding:8px 10px;font-size:11px;font-weight:1000;white-space:nowrap}.timer{position:relative;display:flex;direction:ltr;justify-content:center;gap:7px;margin:16px 0 8px;perspective:700px}.timer-unit{text-align:center}.timer-cube{min-width:66px;padding:10px 8px;border-radius:14px;background:linear-gradient(180deg,#ffe9a7,#dba840);color:#342502;font-size:28px;font-weight:1000;line-height:1;box-shadow:inset 0 2px 0 rgba(255,255,255,.75),0 8px 0 #9c6f1e,0 14px 20px rgba(0,0,0,.25);transform:rotateX(4deg)}.timer-unit small{display:block;margin-top:12px;font-size:10px;opacity:.8}.promo-after{text-align:center;font-size:11px;opacity:.8}
    .offers{display:grid;gap:11px;margin-top:16px;min-width:0}.offers>*{min-width:0}.offer-card{position:relative;background:#fff;border:2px solid var(--line);border-radius:20px;padding:17px;transition:.18s ease}.offer-card.selected{border-color:var(--green);box-shadow:0 0 0 4px rgba(15,74,45,.08)}.offer-card.pro{border-color:#e3c36d;background:linear-gradient(180deg,#fff,#fffaf0)}.offer-badge{position:absolute;left:12px;top:12px;background:var(--green);color:#fff;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:1000}.offer-card h3{font-size:26px;color:var(--green);margin:0}.offer-label{font-size:12px;color:var(--muted);font-weight:900}.price-row{display:flex;align-items:center;justify-content:space-between;gap:9px;border-top:1px solid var(--line);padding-top:11px;margin-top:10px;flex-wrap:wrap}.price-row>strong{font-size:26px;line-height:1.1}.unit-price{display:inline-flex;align-items:baseline;gap:3px;background:var(--green3);color:var(--green);border:1px solid #cfe2d5;border-radius:11px;padding:7px 9px;font-size:13px;font-weight:1000;line-height:1}.unit-price b{font-size:18px;letter-spacing:-.2px}.resale-note{margin-top:8px;color:#4b5d52;font-size:12px;font-weight:900}.shipping-line{margin-top:9px;border-radius:11px;background:var(--green3);padding:8px 9px;color:var(--green);font-size:11px;font-weight:900;display:none}.offer-card.selected .shipping-line{display:block}.offer-btn{width:100%;min-height:47px;border:0;border-radius:13px;background:var(--green);color:#fff;font-weight:1000;margin-top:11px}
    .formbox{background:#fff;border:1px solid var(--line);border-radius:24px;padding:18px;box-shadow:var(--shadow)}.formbox h2{font-size:25px;color:var(--green);margin:0 0 4px}.formbox>p{font-size:13px;color:var(--muted);margin:0 0 15px}.order-summary{background:var(--cream);border:1px solid #e6dece;border-radius:16px;padding:12px;margin-bottom:14px}.sum-row{display:flex;justify-content:space-between;gap:12px;font-size:12px;padding:4px 0}.sum-row.total{border-top:1px dashed #d3c8b8;margin-top:4px;padding-top:9px;font-size:15px}.sum-row.total b{color:var(--green)}.free-text{color:var(--green);font-weight:1000}
    .form-grid{display:grid;gap:12px;min-width:0}.field{display:flex;flex-direction:column;gap:6px;min-width:0}.field label{font-size:14px;font-weight:1000;color:#27372d}.field input,.field select,.field textarea{width:100%;max-width:100%;min-width:0;min-height:52px;border:1.5px solid #ccd6cf;border-radius:13px;padding:12px 13px;background:#fff;font-size:16px;color:var(--ink);outline:none}.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(15,74,45,.08)}.field textarea{min-height:85px;resize:vertical}.hp{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;overflow:hidden!important}
    .consent{display:flex;gap:9px;align-items:flex-start;margin:14px 0;font-size:12px;font-weight:800;color:#3b4940}.consent input{width:19px;height:19px;flex:0 0 auto;accent-color:var(--green);margin-top:2px}.primary{width:100%;min-height:54px;border:0;border-radius:14px;background:var(--green);color:#fff;font-size:16px;font-weight:1000}.primary:disabled{opacity:.55}.review{display:none;margin-top:14px;background:var(--cream);border:1px solid #e6dece;border-radius:16px;padding:14px}.review.show{display:block}.review h3{margin:0 0 9px;color:var(--green)}.review-line{display:flex;justify-content:space-between;gap:12px;font-size:12px;padding:6px 0;border-bottom:1px dashed #ddd3c5}.review-line:last-child{border-bottom:0}.review-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.6fr);gap:8px;margin-top:12px;min-width:0}.secondary{min-height:50px;border:1px solid var(--green);background:#fff;color:var(--green);border-radius:13px;font-weight:1000}.status{display:none;margin-top:12px;padding:12px;border-radius:13px;font-size:13px}.status.show{display:block}.status.error{background:#fff0f0;color:#9b2626}.status.success{background:#edf8f0;color:#17673b}
    .storage{display:grid;gap:10px}.storage div{background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px}.storage b{display:block;color:var(--green);font-size:15px}.storage span{font-size:12px;color:var(--muted)}details{border-bottom:1px solid var(--line);padding:14px 0}summary{color:var(--green);font-weight:1000;cursor:pointer}details p{font-size:13px;color:var(--muted);margin:8px 0 0}
    .wa{background:var(--green);color:#fff;border-radius:22px;padding:19px}.wa h2{font-size:23px;margin:0 0 5px}.wa p{font-size:12px;opacity:.86;margin:0 0 13px}.wa a{display:flex;min-height:49px;align-items:center;justify-content:center;background:#fff;color:var(--green);border-radius:13px;text-decoration:none;font-weight:1000}.sticky{position:fixed;right:0;left:0;bottom:0;z-index:60;background:#fff;border-top:1px solid var(--line);padding:8px 10px calc(8px + env(safe-area-inset-bottom));box-shadow:0 -6px 22px rgba(0,0,0,.08)}.sticky a{display:flex;min-height:50px;align-items:center;justify-content:center;border-radius:13px;background:var(--green);color:#fff;text-decoration:none;font-weight:1000}footer{text-align:center;color:var(--muted);font-size:11px;padding:25px 0 30px}
    @media(min-width:760px){
      body{padding-bottom:0}.sticky{display:none}.hero{padding:18px 0 45px}.hero-grid{grid-template-columns:.9fr 1.1fr;align-items:center;gap:28px}.hero-copy{order:1}.hero-media{order:2}.hero-media img{aspect-ratio:4/3}.trust{margin-top:0}
      .fruit-grid{grid-template-columns:repeat(6,1fr)}.opportunity{grid-template-columns:1fr 1fr 1fr}.offers{grid-template-columns:repeat(3,1fr)}.form-grid{grid-template-columns:1fr 1fr}.field.full{grid-column:1/-1}.storage{grid-template-columns:repeat(3,1fr)}
    }
  </style>
</head>
<body>
  <div class="ticker" aria-label="معلومات الجملة والتوصيل">
    <div class="ticker-track">
      <div class="ticker-item"><span>📦 <b>الجملة فقط</b></span><span>الطلب ابتداءً من <b>2.5 كيلو</b></span><span>🚚 التوصيل إلى <b>جميع المدن التي تغطيها شركة التوصيل</b></span></div>
      <div class="ticker-item" aria-hidden="true"><span>📦 <b>الجملة فقط</b></span><span>الطلب ابتداءً من <b>2.5 كيلو</b></span><span>🚚 التوصيل إلى <b>جميع المدن التي تغطيها شركة التوصيل</b></span></div>
      <div class="ticker-item" aria-hidden="true"><span>📦 <b>الجملة فقط</b></span><span>الطلب ابتداءً من <b>2.5 كيلو</b></span><span>🚚 التوصيل إلى <b>جميع المدن التي تغطيها شركة التوصيل</b></span></div>
    </div>
  </div>

  <header class="wrap brandrow">
    <a class="brand" href="#top" aria-label="AzarBio"><span class="mark">A</span><span><b>AzarBio</b><small>Fruits lyophilisés · Grossiste</small></span></a>
    <span class="wholesale-pill">عرض خاص بالتجار</span>
  </header>

  <main id="top">
    <section class="hero wrap">
      <div class="hero-grid">
        <div class="hero-copy">
          <span class="kicker">🌿 منتج مختلف لمحلك</span>
          <h1>فواكه مجففة بالتبريد <span class="gold">بالجملة</span></h1>
          <p class="lead">مزيج مقرمش وجذاب يضم 6 فواكه، سهل التقسيم وإعادة البيع. الحد الأدنى للطلب 2.5 كغ.</p>
          <div class="hero-cta"><a class="cta-main" href="#offers">شوف عروض الجملة</a><a class="cta-ghost" href="#business">كيف نبيعها؟</a></div>
        </div>
        <div class="hero-media">
          <img src="${heroSrc}" width="800" height="800" alt="ساشي كبير من الفواكه المجففة بالتبريد مع صحن ومخزون كراتين" fetchpriority="high" decoding="async">
          <span class="stock-badge">مخزون جملة · ساشي كبير</span>
        </div>
      </div>
      <div class="trust"><div>🥭 6 فواكه في المزيج</div><div>📦 ابتداءً من 2.5 كغ</div><div>🔒 حفظ محكم وجاف</div></div>
    </section>

    <section class="section soft">
      <div class="wrap">
        <div class="section-title"><h2>شنو كاين داخل ساشي 2.5 كغ؟</h2><p>التاجر خاصو يعرف المنتوج قبل ما يطلب. المزيج يضم ستة أنواع واضحة.</p></div>
        <div class="fruit-grid">
          <div class="fruit"><div class="ico">🍓</div><b>فريز</b></div>
          <div class="fruit"><div class="ico">🍌</div><b>بنان</b></div>
          <div class="fruit"><div class="ico">🥭</div><b>مانجا</b></div>
          <div class="fruit"><div class="ico">🥝</div><b>كيوي</b></div>
          <div class="fruit"><div class="ico">🍎</div><b>تفاح</b></div>
          <div class="fruit"><div class="ico">◉</div><b>كرموس</b></div>
        </div>
        <div class="mix-note">القوام خفيف ومقرمش، والألوان طبيعية حسب نوع الفاكهة. للحفاظ على القرمشة: سد العبوة جيداً وخليها بعيداً عن الرطوبة والحرارة المباشرة.</div>
      </div>
    </section>

    <section class="section" id="business">
      <div class="wrap">
        <div class="section-title"><h2>كيف تقدر تحول 2.5 كغ لوحدات للبيع؟</h2><p>مثال بسيط يساعدك تفهم الحجم الحقيقي للكمية قبل الطلب.</p></div>
        <div class="opportunity">
          <div class="split-card">
            <h3>مثال التقسيم</h3>
            <div class="split-examples"><div><strong>50</strong><span>كيس × 50g</span></div><div><strong>≈62</strong><span>كيس × 40g</span></div></div>
            <p class="disclaimer">الأرقام حسابية تقريبية قبل فاقد الوزن أو اختلاف طريقة التعبئة.</p>
          </div>
          <div class="why-card">
            <h3>علاش يقدر يكون إضافة جيدة؟</h3>
            <div class="why-list"><div><span class="check">✓</span><span>منتج مختلف بصرياً عن السناكات المعتادة.</span></div><div><span class="check">✓</span><span>سهل تقسيمه إلى أحجام مناسبة لطريقة البيع عندك.</span></div><div><span class="check">✓</span><span>القوام المقرمش يعطي تجربة أكل ممتعة ويساعد على عرض المنتج بطريقة جذابة.</span></div><div><span class="check">✓</span><span>يمكن حفظه مدة طويلة نسبياً عندما يبقى محكماً وجافاً؛ المدة الدقيقة حسب تعبئتك وشروط المورد.</span></div></div>
          </div>
          <div class="calc-card">
            <h3>احسب المداخيل النظرية</h3>
            <div class="calc-row"><div><label for="resalePrice">ثمن بيع 50g عندك</label><input id="resalePrice" type="number" inputmode="decimal" min="1" max="200" value="20"></div><div class="calc-result"><small>50 كيس × السعر</small><strong id="calcRevenue">1000 DH</strong></div></div>
            <p class="disclaimer">هذه مداخيل نظرية قبل تكلفة العبوات، الإشهار، التوصيل والمصاريف الأخرى؛ ليست ربحاً مضموناً.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section soft" id="offers">
      <div class="wrap">
        <div class="promo" id="promoBox">
          <div class="promo-top"><div><h3 id="promoTitle">عرض التوصيل المجاني</h3><p id="promoSubtitle">متاح لمدة ساعتين من أول زيارة على هذا المتصفح.</p></div><span class="free-badge" id="promoBadge">🚚 التوصيل 0 درهم</span></div>
          <div class="timer" id="timer"><div class="timer-unit"><div class="timer-cube" id="hh">02</div><small>ساعة</small></div><div class="timer-unit"><div class="timer-cube" id="mm">00</div><small>دقيقة</small></div><div class="timer-unit"><div class="timer-cube" id="ss">00</div><small>ثانية</small></div></div>
          <div class="promo-after" id="promoAfter">بعد انتهاء العرض: التوصيل 35 درهم.</div>
        </div>

        <div class="section-title" style="margin-top:24px"><h2>اختر عرض الجملة</h2><p>شوف الثمن الإجمالي وثمن الكيلو بوضوح، ثم اضغط على العرض باش يظهر التوصيل والمجموع النهائي.</p></div>
        <div class="offers">
          <article class="offer-card selected" data-offer="2.5KG" tabindex="0">
            <h3>2.5 كغ</h3><div class="offer-label">عرض البداية</div>
            <div class="price-row"><strong>447.5 DH</strong><span class="unit-price"><b>179</b> DH/كغ</span></div><div class="resale-note">≈ 50 كيس × 50g قبل فاقد التعبئة</div>
            <div class="shipping-line">🚚 <span class="shipping-copy">التوصيل مجاني حتى محلك خلال العرض</span></div>
            <button class="offer-btn" type="button">اختيار 2.5 كغ</button>
          </article>
          <article class="offer-card pro" data-offer="5KG" tabindex="0">
            <span class="offer-badge">عرض التاجر</span><h3>5 كغ</h3><div class="offer-label">كمية أكبر</div>
            <div class="price-row"><strong>799 DH</strong><span class="unit-price"><b>≈160</b> DH/كغ</span></div><div class="resale-note">≈ 100 كيس × 50g قبل فاقد التعبئة</div>
            <div class="shipping-line">🚚 <span class="shipping-copy">التوصيل مجاني حتى محلك خلال العرض</span></div>
            <button class="offer-btn" type="button">اختيار 5 كغ</button>
          </article>
          <article class="offer-card" data-offer="10KG" tabindex="0">
            <span class="offer-badge">أفضل سعر/كغ</span><h3>10 كغ</h3><div class="offer-label">للطلبات الأكبر</div>
            <div class="price-row"><strong>1450 DH</strong><span class="unit-price"><b>145</b> DH/كغ</span></div><div class="resale-note">≈ 200 كيس × 50g قبل فاقد التعبئة</div>
            <div class="shipping-line">🚚 <span class="shipping-copy">التوصيل مجاني حتى محلك خلال العرض</span></div>
            <button class="offer-btn" type="button">اختيار 10 كغ</button>
          </article>
        </div>
      </div>
    </section>

    <section class="section" id="order">
      <div class="wrap">
        <div class="formbox">
          <h2>أرسل طلبك</h2><p>سنتواصل معك لتأكيد الطلب والعنوان قبل الشحن. راجع المعلومات قبل الإرسال النهائي.</p>
          <div class="order-summary">
            <div class="sum-row"><span>العرض</span><b id="sumOffer">2.5 كغ</b></div>
            <div class="sum-row"><span>ثمن المنتج</span><b id="sumProduct">447.5 DH</b></div>
            <div class="sum-row"><span>التوصيل</span><b id="sumShipping" class="free-text">مجاني</b></div>
            <div class="sum-row total"><span>المجموع</span><b id="sumTotal">447.5 DH</b></div>
          </div>
          <form id="leadForm" novalidate>
            <input type="hidden" name="offer_package" id="offerPackage" value="2.5KG">
            <input type="hidden" name="client_promo_deadline" id="clientPromoDeadline" value="${promo.deadline}">
            <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
            <div class="form-grid">
              <div class="field"><label for="name">الاسم الكامل *</label><input id="name" name="name" type="text" autocomplete="name" minlength="2" maxlength="100" required placeholder="مثال: محمد العلوي"></div>
              <div class="field"><label for="phone">رقم الهاتف *</label><input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="06XXXXXXXX أو 07XXXXXXXX"></div>
              <div class="field"><label for="city">المدينة *</label><input id="city" name="city" type="text" autocomplete="address-level2" maxlength="80" required placeholder="مثال: الدار البيضاء"></div>
              <div class="field"><label for="businessType">نوع النشاط *</label><select id="businessType" name="business_type" required><option value="">اختر النشاط</option><option>محل مكسرات وزريعة</option><option>بقالة / سوبرماركت</option><option>مقهى / حلويات / مخبزة</option><option>إعادة البيع أونلاين</option><option>مشروع جديد</option><option>نشاط آخر</option></select></div>
              <div class="field full"><label for="address">العنوان بالتفصيل *</label><input id="address" name="address" type="text" autocomplete="street-address" minlength="5" maxlength="220" required placeholder="الحي، الشارع، رقم المحل أو أقرب نقطة معروفة"></div>
              <div class="field full"><label for="offerSelect">العرض *</label><select id="offerSelect" required><option value="2.5KG">2.5 كغ — 447.5 DH</option><option value="5KG">5 كغ — 799 DH</option><option value="10KG">10 كغ — 1450 DH</option></select></div>
              <div class="field full"><label for="notes">ملاحظة (اختياري)</label><textarea id="notes" name="notes" maxlength="600" placeholder="مثلاً: اسم المحل أو أفضل وقت للاتصال"></textarea></div>
            </div>
            <label class="consent"><input type="checkbox" name="consent_order" value="yes" required><span>أؤكد أن رقم الهاتف هذا يخصني وأنني أرغب فعلاً في الطلب وأوافق على التواصل معي لتأكيده.</span></label>
            <button type="button" class="primary" id="reviewBtn">راجع طلبي قبل الإرسال</button>
            <div class="review" id="reviewPanel"><h3>تأكد من الطلب</h3><div id="reviewLines"></div><div class="review-actions"><button type="button" class="primary" id="confirmBtn">نعم، أكد طلبي</button><button type="button" class="secondary" id="editBtn">تعديل</button></div></div>
            <div class="status" id="formStatus" role="status"></div>
          </form>
        </div>
      </div>
    </section>

    <section class="section soft">
      <div class="wrap">
        <div class="section-title"><h2>باش يبقى مقرمش ومزيان</h2><p>الرطوبة هي العدو الأول للفواكه المجففة بالتبريد.</p></div>
        <div class="storage"><div><b>🔒 سد العبوة جيداً</b><span>بعد كل استعمال، أغلق الساشي أو العبوات بإحكام.</span></div><div><b>💧 بعيداً عن الرطوبة</b><span>خزن في مكان جاف ولا تترك المنتج مكشوفاً.</span></div><div><b>☀️ بعيداً عن الحرارة والشمس</b><span>مكان بارد نسبياً وجاف يساعد على الحفاظ على القوام.</span></div></div>
      </div>
    </section>

    <section class="section"><div class="wrap">
      <div class="section-title"><h2>أسئلة التاجر قبل أول طلب</h2></div>
      <details><summary>شنو كاين فالساشي 2.5 كغ؟</summary><p>المزيج يضم الفريز، البنان، المانجا، الكيوي، التفاح والكرموس.</p></details>
      <details><summary>كيفاش نقدر نقسم 2.5 كغ؟</summary><p>حسابياً: 50 كيس من 50g، أو حوالي 62 كيس من 40g. خذ بعين الاعتبار طريقة التعبئة وأي فاقد بسيط.</p></details>
      <details><summary>واش كيحتاج الثلاجة؟</summary><p>لا. خليه محكم الإغلاق، جاف، وبعيداً عن الرطوبة والحرارة المباشرة.</p></details>
      <details><summary>واش التوصيل مجاني؟</summary><p id="faqShipping">نعم خلال عرض الساعتين من أول زيارة. بعد انتهاء العرض يصبح التوصيل 35 درهم.</p></details>
      <details><summary>واش الربح مضمون؟</summary><p>لا توجد أرباح مضمونة. النتيجة تعتمد على سعر البيع، تكلفة العبوة، الإشهار، موقع المحل والمصاريف الأخرى. لهذا وضعنا حاسبة مداخيل نظرية بدل وعود ربح غير واقعية.</p></details>
    </div></section>

    <section class="section" id="whatsapp"><div class="wrap"><div class="wa"><h2>عندك سؤال قبل الطلب؟</h2><p>واتساب للاستفسارات فقط. إذا كنت جاهزاً للطلب استعمل الفورم باش تبقى معلوماتك مسجلة بشكل صحيح.</p><a href="https://wa.me/212708101099?text=%D8%B3%D9%84%D8%A7%D9%85%D8%8C%20%D8%B9%D9%86%D8%AF%D9%8A%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%B9%D8%B1%D9%88%D8%B6%20AzarBio%20%D9%84%D9%84%D8%AC%D9%85%D9%84%D8%A9" target="_blank" rel="noopener">تواصل عبر واتساب</a></div></div></section>
  </main>

  <footer class="wrap">AzarBio · بيع الفواكه المجففة بالتبريد بالجملة في المغرب</footer>
  <div class="sticky"><a href="#offers">ابدأ طلب الجملة من 2.5 كغ</a></div>

  <script>
    (function(){
      var offers=${JSON.stringify(OFFERS)},deadline=${promo.deadline},loadedAt=Date.now(),shipping=0,current='2.5KG',sending=false;
      var form=document.getElementById('leadForm'),cards=[].slice.call(document.querySelectorAll('.offer-card')),offerInput=document.getElementById('offerPackage'),offerSelect=document.getElementById('offerSelect'),reviewBtn=document.getElementById('reviewBtn'),reviewPanel=document.getElementById('reviewPanel'),reviewLines=document.getElementById('reviewLines'),confirmBtn=document.getElementById('confirmBtn'),editBtn=document.getElementById('editBtn'),status=document.getElementById('formStatus');

      function money(v){return (Math.round(v*10)/10).toString().replace('.0','')+' DH'}
      function updateSummary(){
        var o=offers[current],total=o.productTotal+shipping;
        document.getElementById('sumOffer').textContent=o.qty;
        document.getElementById('sumProduct').textContent=money(o.productTotal);
        var s=document.getElementById('sumShipping');
        s.textContent=shipping===0?'مجاني':money(shipping);s.classList.toggle('free-text',shipping===0);
        document.getElementById('sumTotal').textContent=money(total);
        document.querySelectorAll('.shipping-copy').forEach(function(el){el.textContent=shipping===0?'التوصيل مجاني حتى محلك خلال العرض':'التوصيل الآن 35 درهم';});
      }
      function setOffer(key,scroll){if(!offers[key])return;current=key;offerInput.value=key;offerSelect.value=key;cards.forEach(function(c){c.classList.toggle('selected',c.dataset.offer===key)});reviewPanel.classList.remove('show');updateSummary();if(scroll)document.getElementById('order').scrollIntoView({behavior:'smooth',block:'start'})}
      cards.forEach(function(card){function choose(){setOffer(card.dataset.offer,true)}card.addEventListener('click',choose);card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();choose()}})});offerSelect.addEventListener('change',function(){setOffer(offerSelect.value,false)});

      function updatePromo(){
        var left=Math.max(0,deadline-Date.now()),active=left>0;shipping=active?0:35;
        var h=Math.floor(left/3600000),m=Math.floor((left%3600000)/60000),s=Math.floor((left%60000)/1000);
        document.getElementById('hh').textContent=String(h).padStart(2,'0');document.getElementById('mm').textContent=String(m).padStart(2,'0');document.getElementById('ss').textContent=String(s).padStart(2,'0');
        document.getElementById('promoTitle').textContent=active?'عرض التوصيل المجاني':'انتهى عرض التوصيل المجاني';
        document.getElementById('promoSubtitle').textContent=active?'متاح لمدة ساعتين من أول زيارة على هذا المتصفح.':'يمكنك مواصلة الطلب؛ التوصيل الآن 35 درهم.';
        document.getElementById('promoBadge').textContent=active?'🚚 التوصيل 0 درهم':'🚚 التوصيل 35 درهم';
        document.getElementById('promoAfter').textContent=active?'بعد انتهاء العرض: التوصيل 35 درهم.':'العرض انتهى على هذا المتصفح.';
        document.getElementById('faqShipping').textContent=active?'نعم خلال عرض الساعتين من أول زيارة. بعد انتهاء العرض يصبح التوصيل 35 درهم.':'عرض الساعتين انتهى، والتوصيل الآن 35 درهم.';
        updateSummary();
      }
      updatePromo();setInterval(updatePromo,1000);

      var resale=document.getElementById('resalePrice');function calc(){var p=Math.max(0,Number(resale.value)||0);document.getElementById('calcRevenue').textContent=Math.round(p*50)+' DH'}resale.addEventListener('input',calc);calc();

      function validPhone(value){var d=String(value||'').replace(/\\D/g,'');if(d.indexOf('212')===0)d='0'+d.slice(3);return /^0[67]\\d{8}$/.test(d)}
      function showStatus(message,type){status.textContent=message;status.className='status show '+type}function clearStatus(){status.className='status';status.textContent=''}
      function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}

      reviewBtn.addEventListener('click',function(){
        clearStatus();if(!form.reportValidity())return;if(!validPhone(form.phone.value)){showStatus('المرجو إدخال رقم هاتف مغربي صحيح يبدأ بـ 06 أو 07.','error');form.phone.focus();return}
        var o=offers[current],total=o.productTotal+shipping;
        reviewLines.innerHTML='<div class="review-line"><span>الاسم</span><b>'+esc(form.name.value)+'</b></div><div class="review-line"><span>الهاتف</span><b>'+esc(form.phone.value)+'</b></div><div class="review-line"><span>العنوان</span><b>'+esc(form.address.value)+'</b></div><div class="review-line"><span>العرض</span><b>'+esc(o.qty)+'</b></div><div class="review-line"><span>التوصيل</span><b>'+(shipping===0?'مجاني':'35 DH')+'</b></div><div class="review-line"><span>المجموع</span><b>'+money(total)+'</b></div>';
        reviewPanel.classList.add('show');reviewPanel.scrollIntoView({behavior:'smooth',block:'center'});
        try{if(window.gtag)window.gtag('event','form_review',{offer_package:current,shipping_fee:shipping})}catch(e){}
      });
      editBtn.addEventListener('click',function(){reviewPanel.classList.remove('show');form.scrollIntoView({behavior:'smooth',block:'start'})});

      confirmBtn.addEventListener('click',async function(){
        if(sending)return;clearStatus();if(!form.reportValidity()||!validPhone(form.phone.value))return;sending=true;confirmBtn.disabled=true;confirmBtn.textContent='جاري تسجيل الطلب...';
        try{
          var data=Object.fromEntries(new FormData(form).entries()),params=new URLSearchParams(location.search);
          data.source='AzarBio - Landing V2 Wholesale';data.utm_source=params.get('utm_source')||'';data.utm_medium=params.get('utm_medium')||'';data.utm_campaign=params.get('utm_campaign')||'';data.utm_content=params.get('utm_content')||'';data.utm_term=params.get('utm_term')||'';data.landing_page=location.href;data.client_elapsed_ms=String(Date.now()-loadedAt);
          var response=await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},credentials:'same-origin',cache:'no-store',body:JSON.stringify(data)}),result={};try{result=await response.json()}catch(e){}
          if(!response.ok||result.ok!==true)throw new Error(result.error||'submit_failed');
          form.reset();setOffer('2.5KG',false);reviewPanel.classList.remove('show');showStatus('تم تسجيل طلبك بنجاح. سنتواصل معك لتأكيد الطلب والعنوان قبل الشحن.','success');status.scrollIntoView({behavior:'smooth',block:'center'});
        }catch(err){
          var map={invalid_name:'المرجو إدخال الاسم بشكل صحيح.',invalid_phone:'المرجو إدخال رقم هاتف صحيح.',invalid_city:'المرجو إدخال المدينة.',invalid_address:'المرجو إدخال العنوان بشكل أوضح.',invalid_business_type:'المرجو اختيار نوع النشاط.',consent_required:'خاصك تأكد أن رقم الهاتف ديالك وأنك باغي الطلب.',invalid_offer:'المرجو اختيار عرض صحيح.',duplicate_phone:'تم تسجيل طلبات بنفس الرقم مؤخراً. إذا احتجت تعديلاً تواصل معنا.',too_fast:'راجع معلوماتك ثم حاول من جديد.',too_many_requests:'عدد المحاولات كبير. انتظر قليلاً ثم حاول من جديد.',upstream_error:'تعذر تسجيل الطلب مؤقتاً. حاول بعد قليل.',upstream_unavailable:'تعذر الاتصال بخدمة تسجيل الطلبات حالياً.'};showStatus(map[err.message]||'تعذر تسجيل الطلب حالياً. حاول مرة أخرى بعد قليل.','error');
        }finally{sending=false;confirmBtn.disabled=false;confirmBtn.textContent='نعم، أكد طلبي'}
      });
      updateSummary();
    })();
  </script>
</body>
</html>`;

  res.statusCode = 200;
  if (req.method === 'HEAD') return res.end();
  res.end(html);
}
