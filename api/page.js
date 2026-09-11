import fs from 'node:fs';
import path from 'node:path';

function pickImages(source) {
  const images = [...source.matchAll(/<img\s+[^>]*src="([^"]+)"[^>]*>/gi)].map((match) => match[1]);
  return {
    hero: images[0] || '',
    detail: images[1] || images[0] || '',
    packs: images[2] || images[0] || '',
    warehouse: images[4] || images[images.length - 1] || images[0] || ''
  };
}

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.statusCode = 405;
    return res.end();
  }

  const source = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const images = pickImages(source);

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#173d2c">
  <meta name="azarbio-secure-form" content="v4">
  <meta name="description" content="AzarBio — فواكه مجففة بالتجميد بالجملة في المغرب، ابتداءً من 1 كلغ، مناسبة لإعادة البيع والاستعمال المهني.">
  <title>AzarBio | الفواكه المجففة بالتجميد بالجملة</title>
  <style>
    :root{--g:#173d2c;--g2:#245641;--g3:#eaf2ed;--gold:#b88a3d;--cream:#f8f4ec;--sand:#efe4d3;--ink:#18221c;--muted:#657067;--line:#e5ddd2;--white:#fff;--danger:#9b2c2c;--shadow:0 14px 40px rgba(19,55,39,.10);--r:22px}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#fff;color:var(--ink);font-family:Tahoma,Arial,"Noto Sans Arabic",sans-serif;line-height:1.75;-webkit-font-smoothing:antialiased;padding-bottom:76px}button,input,select,textarea{font:inherit}.wrap{width:min(100% - 24px,1120px);margin:auto}a{color:inherit}img{display:block;width:100%;height:auto}.topbar{background:var(--g);color:#fff;text-align:center;font-size:12px;font-weight:800;padding:8px 10px;position:sticky;top:0;z-index:50}.topbar span{opacity:.55;margin:0 5px}.head{display:flex;justify-content:space-between;align-items:center;padding:14px 0;gap:14px}.brand{display:flex;align-items:center;gap:10px;text-decoration:none}.mark{width:42px;height:42px;border-radius:14px;background:var(--g);color:#fff;display:grid;place-items:center;font-weight:900;font-size:22px}.brand b{font-size:21px;color:var(--g);display:block;line-height:1.05}.brand small{font-size:11px;color:var(--muted)}.head-contact{display:none}.btn{min-height:50px;border:0;border-radius:15px;padding:12px 18px;font-weight:900;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}.primary{background:var(--g);color:#fff}.primary:active{background:var(--g2)}.outline{border:1.5px solid var(--g);background:#fff;color:var(--g)}.whatsapp{background:#1f6b47;color:#fff}.hero{padding:10px 0 48px}.hero h1{font-size:clamp(32px,10vw,54px);line-height:1.22;color:var(--g);margin:8px 0 14px;letter-spacing:-.4px}.hero h1 em{font-style:normal;color:var(--gold)}.eyebrow{font-size:12px;color:var(--gold);font-weight:900}.lead{font-size:17px;color:var(--muted);margin:0 0 20px}.hero-actions{display:grid;grid-template-columns:1fr;gap:10px;margin:20px 0}.price-pill{background:var(--cream);border:1px solid var(--line);border-radius:18px;padding:13px 16px;display:inline-flex;flex-direction:column;margin-bottom:18px}.price-pill small{color:var(--muted)}.price-pill strong{font-size:23px;color:var(--g)}.trust-chips{display:flex;gap:8px;overflow:auto;padding-bottom:4px;scrollbar-width:none}.trust-chips::-webkit-scrollbar{display:none}.chip{flex:0 0 auto;background:var(--g3);color:var(--g);border-radius:999px;padding:8px 11px;font-size:12px;font-weight:800}.hero-image{margin-top:25px;background:var(--cream);padding:9px;border-radius:26px;box-shadow:var(--shadow);position:relative}.hero-image img{border-radius:20px;aspect-ratio:4/3;object-fit:cover}.hero-badge{position:absolute;right:20px;bottom:20px;background:rgba(255,255,255,.95);box-shadow:var(--shadow);border-radius:14px;padding:9px 12px;color:var(--g);font-size:12px;font-weight:900}.section{padding:62px 0}.soft{background:var(--cream)}.title{margin-bottom:26px}.title.center{text-align:center}.title h2{font-size:clamp(27px,8vw,42px);line-height:1.28;color:var(--g);margin:5px 0 9px}.title p{color:var(--muted);margin:0;font-size:15px}.cards{display:grid;gap:11px}.card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:17px}.card h3{margin:0 0 5px;color:var(--g);font-size:17px}.card p{margin:0;color:var(--muted);font-size:14px}.icon{width:38px;height:38px;border-radius:12px;background:var(--g3);display:grid;place-items:center;margin-bottom:10px;font-weight:900;color:var(--g)}.photo{border-radius:24px;overflow:hidden;box-shadow:var(--shadow);background:#fff}.photo img{aspect-ratio:4/3;object-fit:cover}.split{display:grid;gap:25px}.plain-steps{display:grid;gap:9px;margin-top:18px}.plain-step{display:flex;align-items:center;gap:11px;background:#fff;border:1px solid var(--line);padding:11px 13px;border-radius:14px;font-weight:800}.plain-step b{width:28px;height:28px;border-radius:50%;background:var(--g);color:#fff;display:grid;place-items:center;font-size:12px;flex:0 0 auto}.math{display:grid;grid-template-columns:1fr;gap:9px}.mathbox{background:#fff;border:1px solid var(--line);border-radius:18px;padding:17px;text-align:center}.mathbox strong{font-size:28px;color:var(--g);display:block}.mathbox small{color:var(--muted)}.raw-cost{background:var(--g);color:#fff;padding:20px;border-radius:20px;text-align:center;margin-top:12px}.raw-cost strong{display:block;font-size:22px}.raw-cost small{opacity:.8}.audience{display:grid;gap:10px}.audience .card{padding:15px 16px}.offers{display:grid;gap:12px}.offer{position:relative;border:2px solid var(--line);border-radius:22px;background:#fff;padding:19px;text-align:right;cursor:pointer;box-shadow:0 5px 18px rgba(0,0,0,.03)}.offer.selected,.offer.featured{border-color:var(--g);background:linear-gradient(180deg,#fff,#f3f8f4)}.offer-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.tag{background:var(--sand);color:#785a22;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:900}.best{background:var(--g);color:#fff}.offer h3{font-size:31px;color:var(--g);margin:13px 0 3px}.offer-name{font-weight:900}.offer-price{font-size:22px;color:var(--g);font-weight:900;margin-top:11px}.offer-total{font-size:14px;color:var(--muted)}.offer p{font-size:13px;color:var(--muted);margin:12px 0 0}.offer-extra{display:inline-block;background:var(--g);color:#fff;border-radius:9px;padding:5px 8px;margin-top:10px;font-size:11px;font-weight:900}.offer:after{content:"اضغط لاختيار العرض";display:block;margin-top:14px;color:var(--g);font-size:12px;font-weight:900}.warehouse{position:relative;overflow:hidden;border-radius:26px;min-height:390px}.warehouse img{position:absolute;inset:0;height:100%;object-fit:cover}.warehouse:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(8,30,21,.85),rgba(8,30,21,.05) 70%)}.warehouse-copy{position:absolute;z-index:2;right:20px;left:20px;bottom:22px;color:#fff}.warehouse-copy h2{font-size:29px;line-height:1.25;margin:0 0 8px}.warehouse-copy p{margin:0;opacity:.92}.ideas{display:flex;flex-wrap:wrap;gap:8px}.ideas span{background:#fff;border:1px solid var(--line);border-radius:999px;padding:9px 12px;font-size:13px;font-weight:800}.faq details{border-bottom:1px solid var(--line);padding:15px 0}.faq summary{font-weight:900;color:var(--g);cursor:pointer}.faq p{margin:8px 0 0;color:var(--muted);font-size:14px}.contact{background:var(--g);color:#fff;border-radius:26px;padding:24px}.contact h2{font-size:29px;line-height:1.25;margin:0 0 9px}.contact p{margin:0 0 18px;opacity:.88}.contact-actions{display:grid;gap:9px}.contact .btn{background:#fff;color:var(--g)}.contact-line{display:flex;align-items:center;gap:10px;margin-top:13px;font-size:14px;word-break:break-word}.contact-line a{text-decoration:none}.legal{color:var(--muted);font-size:12px;margin-top:18px}.footer{padding:28px 0 96px}.footer b{font-size:21px;color:var(--g)}.footer p{margin:5px 0;color:var(--muted);font-size:13px}.sticky{position:fixed;right:0;left:0;bottom:0;background:#fff;border-top:1px solid var(--line);padding:8px max(10px,env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));display:grid;grid-template-columns:1.1fr .9fr;gap:8px;z-index:60;box-shadow:0 -6px 25px rgba(0,0,0,.09)}.sticky a{min-height:50px;border-radius:13px;text-decoration:none;display:grid;place-items:center;font-weight:900}.sticky a:first-child{background:var(--g);color:#fff}.sticky a:last-child{background:var(--sand);color:var(--g)}.modal{position:fixed;inset:0;background:rgba(0,0,0,.58);z-index:90;display:none;align-items:flex-end}.modal.open{display:flex}.modal-box{width:100%;background:#fff;border-radius:26px 26px 0 0;padding:24px 16px calc(20px + env(safe-area-inset-bottom));max-height:92vh;overflow:auto;position:relative}.close{position:absolute;left:14px;top:13px;width:40px;height:40px;border:0;border-radius:50%;background:#f1f1f1;font-size:24px;cursor:pointer}.modal h3{font-size:27px;color:var(--g);margin:0 0 3px}.modal-intro{color:var(--muted);font-size:14px;margin:0 0 16px}.selected-line{background:var(--cream);border:1px solid var(--line);border-radius:15px;padding:12px 14px;margin-bottom:16px}.selected-line small{display:block;color:var(--muted)}.selected-line strong{display:block;color:var(--g);font-size:19px}.grid-form{display:grid;gap:12px}.field{display:flex;flex-direction:column;gap:6px}.field label{font-size:13px;font-weight:900}.field input,.field select,.field textarea{border:1px solid #d9d5cf;border-radius:13px;min-height:49px;padding:11px 12px;background:#fff;color:var(--ink);width:100%}.field textarea{min-height:90px;resize:vertical}.privacy{font-size:11px;color:var(--muted);margin:12px 0}.status{display:none;margin-top:12px;padding:11px;border-radius:12px;font-size:13px}.status.success{display:block;background:#eaf7ee;color:#16673b}.status.error{display:block;background:#fff0f0;color:var(--danger)}.submit{width:100%;min-height:52px}.mini-contact{background:var(--cream);border-radius:16px;padding:13px;margin-top:14px;font-size:13px;color:var(--muted)}.mini-contact a{color:var(--g);font-weight:900;text-decoration:none}
    @media(min-width:700px){body{padding-bottom:0}.head-contact{display:flex;gap:8px}.hero{padding:34px 0 70px}.hero-grid,.split{display:grid;grid-template-columns:1fr 1fr;gap:42px;align-items:center}.hero-image{margin-top:0}.hero-actions{grid-template-columns:auto auto;justify-content:start}.cards{grid-template-columns:repeat(4,1fr)}.audience{grid-template-columns:repeat(3,1fr)}.offers{grid-template-columns:repeat(4,1fr)}.math{grid-template-columns:repeat(3,1fr)}.contact{padding:38px}.contact-actions{grid-template-columns:auto auto;justify-content:start}.modal{align-items:center;justify-content:center;padding:20px}.modal-box{width:min(620px,100%);border-radius:26px;padding:28px}.grid-form{grid-template-columns:1fr 1fr}.field.full{grid-column:1/-1}.sticky{display:none}.footer{padding-bottom:32px}}
  </style>
</head>
<body>
  <div class="topbar">بيع بالجملة من 1 كلغ <span>•</span> تخزين بدون ثلاجة بشروط الحفظ المناسبة <span>•</span> مناسب لإعادة البيع</div>
  <header class="wrap head">
    <a class="brand" href="#top" aria-label="AzarBio">
      <span class="mark">A</span><span><b>AzarBio</b><small>الفواكه المجففة بالتجميد</small></span>
    </a>
    <div class="head-contact">
      <a class="btn outline" href="mailto:azarbio.naturel@gmail.com">البريد الإلكتروني</a>
      <a class="btn whatsapp" href="https://wa.me/212708101099?text=%D8%B3%D9%84%D8%A7%D9%85%D8%8C%20%D8%A8%D8%BA%D9%8A%D8%AA%20%D9%85%D8%B9%D9%84%D9%88%D9%85%D8%A7%D8%AA%20%D8%B9%D9%84%D9%89%20%D8%B9%D8%B1%D9%88%D8%B6%20AzarBio" target="_blank" rel="noopener">واتساب</a>
    </div>
  </header>

  <main id="top">
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <span class="eyebrow">فواكه مجففة بالتجميد بالجملة في المغرب</span>
          <h1>ابدأ بيع منتج <em>مختلف ومقرمش</em> من 1 كلغ فقط</h1>
          <p class="lead">فواكه خفيفة ومقرمشة، سهلة التخزين والتعبئة، وتقدر تبيعها في عبوات صغيرة أو تستعملها في الشوكولاتة والحلويات والمقاهي وعلب الهدايا.</p>
          <div class="hero-actions">
            <a class="btn primary" href="#offers">شوف عروض الجملة</a>
            <a class="btn outline" href="https://wa.me/212708101099?text=%D8%B3%D9%84%D8%A7%D9%85%D8%8C%20%D8%A8%D8%BA%D9%8A%D8%AA%20%D9%86%D8%A8%D8%AF%D8%A7%20%D9%81%D9%8A%20%D8%A8%D9%8A%D8%B9%20%D8%A7%D9%84%D9%81%D9%88%D8%A7%D9%83%D9%87%20%D8%A7%D9%84%D9%85%D8%AC%D9%81%D9%81%D8%A9%20%D8%A8%D8%A7%D9%84%D8%AA%D8%AC%D9%85%D9%8A%D8%AF" target="_blank" rel="noopener">سولنا عبر واتساب</a>
          </div>
          <div class="price-pill"><small>سعر الجملة ابتداءً من</small><strong>149 درهم للكيلوغرام</strong><small>عند اختيار 5 كلغ</small></div>
          <div class="trust-chips">
            <span class="chip">1 كلغ ≈ 20 عبوة من 50 غرام</span>
            <span class="chip">خفيفة وسهلة الشحن</span>
            <span class="chip">مناسبة للمحل والبيع عبر الإنترنت</span>
          </div>
        </div>
        <div class="hero-image">
          <img src="${images.hero}" alt="فواكه مجففة بالتجميد من AzarBio">
          <div class="hero-badge">ابدأ من 1 كلغ فقط</div>
        </div>
      </div>
    </section>

    <section class="wrap section" style="padding-top:0">
      <div class="cards">
        <article class="card"><div class="icon">❄</div><h3>بدون ثلاجة</h3><p>تحفظ في عبوة محكمة الإغلاق، في مكان جاف وبارد بعيداً عن الرطوبة والحرارة والشمس.</p></article>
        <article class="card"><div class="icon">↗</div><h3>سهلة التخزين والشحن</h3><p>الوزن خفيف والحجم عملي، وهذا يسهل عرضها وشحنها للزبناء.</p></article>
        <article class="card"><div class="icon">50</div><h3>مناسبة لعبوات صغيرة</h3><p>يمكن تقسيم الكمية إلى عبوات 50 غرام أو أحجام أخرى حسب طريقة البيع.</p></article>
        <article class="card"><div class="icon">＋</div><h3>استعمالات متعددة</h3><p>للبيع المباشر، الشوكولاتة، الحلويات، المقاهي، المكسرات وعلب الهدايا.</p></article>
      </div>
    </section>

    <section class="section soft" id="about">
      <div class="wrap split">
        <div class="photo"><img src="${images.detail}" alt="أنواع من الفواكه المجففة بالتجميد"></div>
        <div>
          <div class="title"><span class="eyebrow">منتج مختلف عن التجفيف العادي</span><h2>شنو هي الفواكه المجففة بالتجميد؟</h2><p>هي فواكه كيتنحى منها أغلب الماء وهي مجمدة وتحت ظروف مضبوطة. النتيجة كتكون خفيفة ومقرمشة، بخلاف الفواكه المجففة بالطريقة العادية اللي غالباً كتكون طرية أو مطاطية.</p></div>
          <div class="plain-steps">
            <div class="plain-step"><b>1</b> فاكهة قبل التجفيف</div>
            <div class="plain-step"><b>2</b> إزالة أغلب الماء بالتجفيف بالتجميد</div>
            <div class="plain-step"><b>3</b> فاكهة خفيفة ومقرمشة جاهزة للاستعمال</div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="title center"><span class="eyebrow">مثال بسيط لإعادة البيع</span><h2>كيفاش تستغل 1 كلغ؟</h2><p>إلى اخترت عبوات 50 غرام، فالكيلو الواحد كيعطي تقريباً 20 عبوة قبل احتساب أي نقص أو اختلاف في التعبئة.</p></div>
        <div class="math">
          <div class="mathbox"><strong>1 كلغ</strong><small>كمية الفواكه</small></div>
          <div class="mathbox"><strong>≈ 20 عبوة</strong><small>تقريباً</small></div>
          <div class="mathbox"><strong>50 غرام</strong><small>في كل عبوة</small></div>
        </div>
        <div class="raw-cost"><strong>في عرض 5 كلغ: 50 غرام ≈ 7.45 درهم</strong><small>هاد الحساب غير لتكلفة الفواكه الخام. التغليف، الملصق، التوصيل، الإعلانات، اليد العاملة وباقي المصاريف خاصها تتحسب بوحدها.</small></div>
      </div>
    </section>

    <section class="section soft">
      <div class="wrap">
        <div class="title center"><span class="eyebrow">لمن مناسب المنتج؟</span><h2>عدة طرق للبيع والاستعمال</h2></div>
        <div class="audience">
          <article class="card"><h3>محلات المكسرات والفواكه الجافة</h3><p>بيع بالوزن أو في عبوات صغيرة جاهزة.</p></article>
          <article class="card"><h3>التجارة الإلكترونية والدفع عند الاستلام</h3><p>بيع عبوات منفردة أو خلطات وعروض متعددة.</p></article>
          <article class="card"><h3>صناع الشوكولاتة</h3><p>إضافتها للألواح، الحبات المغطاة وعلب الهدايا.</p></article>
          <article class="card"><h3>محلات الحلويات والمخابز</h3><p>للتزيين، الحلويات الباردة، الغرانولا وغيرها.</p></article>
          <article class="card"><h3>المقاهي ومحلات العصائر</h3><p>مع الأطباق، الحلويات، الزبادي والمشروبات.</p></article>
          <article class="card"><h3>علب الهدايا والمنتجات الراقية</h3><p>منتج خفيف وملون يضيف تنوعاً لعلبة الهدايا.</p></article>
        </div>
      </div>
    </section>

    <section class="section" id="offers">
      <div class="wrap">
        <div class="title center"><span class="eyebrow">اختار حسب المرحلة ديالك</span><h2>عروض الجملة</h2><p>اضغط على العرض المناسب، وعمر معلوماتك باش نتواصلو معاك.</p></div>
        <div class="offers" id="offerGrid">
          <article class="offer" tabindex="0" data-package="1KG" data-label="1 كلغ" data-name="للتجربة" data-unit="199" data-total="199">
            <div class="offer-top"><span class="tag">للتجربة</span></div><h3>1 كلغ</h3><div class="offer-name">بداية بسيطة</div><div class="offer-price">199 درهم للكيلوغرام</div><div class="offer-total">المجموع: 199 درهم</div><p>مناسب باش تشوف المنتج وتجرب الطلب بكمية صغيرة.</p>
          </article>
          <article class="offer" tabindex="0" data-package="2.5KG" data-label="2.5 كلغ" data-name="توفير أكثر" data-unit="179" data-total="447.50">
            <div class="offer-top"><span class="tag">توفير أكثر</span></div><h3>2.5 كلغ</h3><div class="offer-name">كمية وسطية</div><div class="offer-price">179 درهم للكيلوغرام</div><div class="offer-total">المجموع: 447.50 درهم</div><p>مناسبة لتجربة البيع على نطاق أوسع.</p>
          </article>
          <article class="offer featured selected" tabindex="0" data-package="5KG" data-label="5 كلغ" data-name="اختيار التجار" data-unit="149" data-total="745">
            <div class="offer-top"><span class="tag best">الأكثر توازناً</span><span class="tag">اختيار التجار</span></div><h3>5 كلغ</h3><div class="offer-name">سعر جملة قوي</div><div class="offer-price">149 درهم للكيلوغرام</div><div class="offer-total">المجموع: 745 درهم</div><p>مناسب لإعادة التعبئة والبيع بشكل منتظم.</p><span class="offer-extra">50 غرام ≈ 7.45 درهم فواكه خام</span>
          </article>
          <article class="offer" tabindex="0" data-package="10KG" data-label="10 كلغ" data-name="أفضل سعر" data-unit="145" data-total="1450">
            <div class="offer-top"><span class="tag">أفضل سعر</span></div><h3>10 كلغ</h3><div class="offer-name">للكميات الكبيرة</div><div class="offer-price">145 درهم للكيلوغرام</div><div class="offer-total">المجموع: 1,450 درهم</div><p>لمن عنده بيع مستمر أو استهلاك مهني أكبر.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="wrap" style="padding-bottom:62px">
      <div class="warehouse">
        <img src="${images.warehouse}" alt="مخزون الفواكه المجففة بالتجميد بالجملة">
        <div class="warehouse-copy"><h2>بدا بكمية تناسبك وكبر حسب المبيعات</h2><p>ما محتاجش تبدأ بمخزون كبير. اختبر السوق أولاً، ومن بعد زيد الكمية على حسب الطلب الحقيقي.</p></div>
      </div>
    </section>

    <section class="section soft">
      <div class="wrap">
        <div class="title center"><span class="eyebrow">أفكار جاهزة</span><h2>شنو تقدر تخرج من نفس المنتج؟</h2></div>
        <div class="ideas"><span>عبوة 50 غرام</span><span>خليط فواكه</span><span>فواكه مع المكسرات</span><span>شوكولاتة بالفواكه</span><span>تزيين الحلويات</span><span>إضافة للغرانولا والزبادي</span><span>علب هدايا</span><span>مسحوق فواكه للاستعمال المهني</span></div>
        <p class="legal">في حالة إعادة التعبئة أو البيع تحت علامتك، خاص احترام التغليف الغذائي والملصقات والمتطلبات القانونية المطبقة على نشاطك.</p>
      </div>
    </section>

    <section class="section faq" id="faq">
      <div class="wrap">
        <div class="title center"><span class="eyebrow">قبل الطلب</span><h2>أسئلة شائعة</h2></div>
        <details open><summary>واش خاصها الثلاجة؟</summary><p>لا، إلا كانت محفوظة بشكل صحيح: عبوة محكمة الإغلاق، مكان جاف وبارد، وبعيدة عن الرطوبة والحرارة وأشعة الشمس المباشرة. الرطوبة كتأثر على القرمشة.</p></details>
        <details><summary>واش نقدر نبدأ غير بـ1 كلغ؟</summary><p>نعم، عرض البداية هو 1 كلغ بسعر 199 درهم.</p></details>
        <details><summary>واش نقدر نعبّيها في عبوات 50 غرام؟</summary><p>نعم، مع استعمال تغليف غذائي مناسب واحترام متطلبات الملصقات والقوانين المطبقة على نشاطك.</p></details>
        <details><summary>شنو الأنواع المتوفرة؟</summary><p>الأنواع كتتغير على حسب المخزون. تواصل معنا عبر واتساب باش تعرف المتوفر وقت الطلب.</p></details>
        <details><summary>شنو الفرق بينها وبين الفواكه المجففة العادية؟</summary><p>الفواكه المجففة بالتجميد كتكون خفيفة ومقرمشة، بينما التجفيف العادي غالباً كيعطي قوام طري أو مطاطي.</p></details>
      </div>
    </section>

    <section class="wrap" id="contact">
      <div class="contact">
        <h2>عندك سؤال قبل ما تختار الكمية؟</h2><p>تواصل معنا مباشرة، ونوضح لك العروض والأنواع المتوفرة.</p>
        <div class="contact-actions">
          <a class="btn" href="https://wa.me/212708101099?text=%D8%B3%D9%84%D8%A7%D9%85%D8%8C%20%D8%A8%D8%BA%D9%8A%D8%AA%20%D9%85%D8%B9%D9%84%D9%88%D9%85%D8%A7%D8%AA%20%D8%B9%D9%84%D9%89%20%D8%A7%D9%84%D9%81%D9%88%D8%A7%D9%83%D9%87%20%D8%A7%D9%84%D9%85%D8%AC%D9%81%D9%81%D8%A9%20%D8%A8%D8%A7%D9%84%D8%AA%D8%AC%D9%85%D9%8A%D8%AF" target="_blank" rel="noopener">واتساب: 0708101099</a>
          <a class="btn" href="mailto:azarbio.naturel@gmail.com">راسلنا بالبريد الإلكتروني</a>
        </div>
        <div class="contact-line">الهاتف وواتساب: <a href="tel:0708101099">0708101099</a></div>
        <div class="contact-line">البريد الإلكتروني: <a href="mailto:azarbio.naturel@gmail.com">azarbio.naturel@gmail.com</a></div>
      </div>
    </section>
  </main>

  <footer class="wrap footer"><b>AzarBio</b><p>الفواكه المجففة بالتجميد بالجملة في المغرب</p><p>0708101099 · azarbio.naturel@gmail.com</p></footer>

  <div class="sticky"><a href="#offers">اختار العرض</a><a href="https://wa.me/212708101099?text=%D8%B3%D9%84%D8%A7%D9%85%D8%8C%20%D8%A8%D8%BA%D9%8A%D8%AA%20%D9%85%D8%B9%D9%84%D9%88%D9%85%D8%A7%D8%AA%20%D8%B9%D9%84%D9%89%20%D8%B9%D8%B1%D9%88%D8%B6%20AzarBio" target="_blank" rel="noopener">واتساب</a></div>

  <div class="modal" id="offerModal" aria-hidden="true">
    <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <button class="close" id="closeModal" aria-label="إغلاق">×</button>
      <h3 id="modalTitle">اطلب هذا العرض</h3>
      <p class="modal-intro">دخل معلوماتك، وغادي نتواصلو معاك لتأكيد التفاصيل.</p>
      <div class="selected-line"><small>العرض المختار</small><strong id="selectedOfferText">5 كلغ — 149 درهم للكيلوغرام</strong><span id="selectedOfferSub">المجموع: 745 درهم</span></div>
      <form id="leadForm">
        <input type="hidden" name="offer_package" id="offer_package" value="5KG">
        <input type="hidden" name="offer_unit_price" id="offer_unit_price" value="149">
        <input type="hidden" name="offer_total" id="offer_total" value="745">
        <div class="grid-form">
          <div class="field"><label for="name">الاسم</label><input id="name" name="name" autocomplete="name" required placeholder="الاسم الكامل"></div>
          <div class="field"><label for="phone">رقم الهاتف</label><input id="phone" name="phone" inputmode="tel" autocomplete="tel" required placeholder="06 أو 07..."></div>
          <div class="field"><label for="city">المدينة</label><input id="city" name="city" autocomplete="address-level2" placeholder="مثلاً: الدار البيضاء"></div>
          <div class="field"><label for="business_type">نوع النشاط</label><select id="business_type" name="business_type"><option value="">اختار نوع النشاط</option><option>محل مكسرات وفواكه جافة</option><option>تجارة إلكترونية</option><option>صناعة الشوكولاتة</option><option>محل حلويات أو مخبزة</option><option>مقهى أو محل عصائر</option><option>علب هدايا</option><option>استعمال شخصي أو نشاط آخر</option></select></div>
          <div class="field full"><label for="notes">ملاحظات</label><textarea id="notes" name="notes" placeholder="مثلاً: بغيت نعرف الأنواع المتوفرة"></textarea></div>
        </div>
        <div class="privacy">معلوماتك كتترسل عبر اتصال آمن ومخصصة فقط لمعالجة طلبك والتواصل معك.</div>
        <button class="btn primary submit" type="submit">إرسال الطلب</button>
        <div class="status" id="formStatus"></div>
        <div class="mini-contact">بغيتي جواب سريع؟ <a href="https://wa.me/212708101099" target="_blank" rel="noopener">تواصل عبر واتساب: 0708101099</a></div>
      </form>
    </div>
  </div>

  <script>
    (() => {
      const cards = [...document.querySelectorAll('.offer')];
      const modal = document.getElementById('offerModal');
      const closeBtn = document.getElementById('closeModal');
      const form = document.getElementById('leadForm');
      const statusEl = document.getElementById('formStatus');
      const selectedText = document.getElementById('selectedOfferText');
      const selectedSub = document.getElementById('selectedOfferSub');
      const pkg = document.getElementById('offer_package');
      const unit = document.getElementById('offer_unit_price');
      const total = document.getElementById('offer_total');

      function openOffer(card) {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        pkg.value = card.dataset.package;
        unit.value = card.dataset.unit;
        total.value = card.dataset.total;
        selectedText.textContent = card.dataset.label + ' — ' + card.dataset.unit + ' درهم للكيلوغرام';
        selectedSub.textContent = 'المجموع: ' + card.dataset.total + ' درهم';
        statusEl.className = 'status';
        statusEl.textContent = '';
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
      function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
      cards.forEach(card => {
        card.addEventListener('click', () => openOffer(card));
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOffer(card); } });
      });
      closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        statusEl.className = 'status';
        statusEl.textContent = '';
        const button = form.querySelector('button[type="submit"]');
        const original = button.textContent;
        button.disabled = true;
        button.textContent = 'جاري الإرسال...';
        try {
          const data = Object.fromEntries(new FormData(form).entries());
          const params = new URLSearchParams(window.location.search);
          data.source = 'AzarBio - صفحة الجملة';
          data.utm_source = params.get('utm_source') || '';
          data.utm_medium = params.get('utm_medium') || '';
          data.utm_campaign = params.get('utm_campaign') || '';
          data.utm_content = params.get('utm_content') || '';
          data.utm_term = params.get('utm_term') || '';
          data.landing_page = window.location.href;
          const response = await fetch('/api/lead', {method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},credentials:'same-origin',cache:'no-store',body:JSON.stringify(data)});
          let result = {};
          try { result = await response.json(); } catch (_) {}
          if (!response.ok || result.ok !== true) throw new Error(result.error || ('http_' + response.status));
          statusEl.textContent = 'تم تسجيل طلبك بنجاح. غادي نتواصلو معاك قريباً.';
          statusEl.classList.add('success');
          const savedOffer = {p: pkg.value, u: unit.value, t: total.value};
          form.reset();
          pkg.value = savedOffer.p; unit.value = savedOffer.u; total.value = savedOffer.t;
        } catch (error) {
          const code = error && error.message ? error.message : '';
          const messages = {invalid_name:'المرجو إدخال الاسم بشكل صحيح.',invalid_phone:'المرجو إدخال رقم هاتف صحيح.',invalid_offer:'المرجو إعادة اختيار العرض.',too_many_requests:'تم إرسال محاولات كثيرة. انتظر دقيقة وحاول من جديد.',service_not_configured:'خدمة استقبال الطلبات غير مفعلة حالياً.',upstream_error:'تعذر تسجيل الطلب حالياً. حاول بعد قليل.',upstream_unavailable:'تعذر الاتصال بخدمة تسجيل الطلبات حالياً.'};
          statusEl.textContent = messages[code] || 'تعذر إرسال الطلب حالياً. حاول مرة أخرى بعد قليل أو تواصل معنا عبر واتساب.';
          statusEl.classList.add('error');
        } finally {
          button.disabled = false;
          button.textContent = original;
        }
      });
    })();
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests");

  if (req.method === 'HEAD') { res.statusCode = 200; return res.end(); }
  res.statusCode = 200;
  return res.end(html);
}
