import fs from 'node:fs';
import path from 'node:path';

const OFFERS = {
  '2.5KG': { label: 'عرض البداية', qty: '2.5 كغ', unit: '179 درهم/كغ', total: '447.5 درهم', note: 'مناسب للتجربة وبداية إعادة البيع' },
  '5KG': { label: 'عرض التاجر', qty: '5 كغ', unit: '160 درهم/كغ', total: '799 درهم', note: 'توازن أفضل بين الكمية والسعر' },
  '10KG': { label: 'أفضل سعر للكيلو', qty: '10 كغ', unit: '145 درهم/كغ', total: '1450 درهم', note: 'للتجار والطلبات الأكبر' }
};

function pickImages(source) {
  const images = [...source.matchAll(/<img\s+[^>]*src="([^"]+)"[^>]*>/gi)].map((m) => m[1]);
  return { hero: images[4] || images[0] || '', detail: images[0] || images[1] || '' };
}

function securityHeaders(res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https://www.facebook.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
}

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.statusCode = 405;
    return res.end();
  }

  const source = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const images = pickImages(source);
  securityHeaders(res);

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#123b2b">
  <meta name="description" content="AzarBio — فواكه مجففة بالتبريد بالجملة للمحلات وإعادة البيع. الطلب ابتداءً من 2.5 كغ.">
  <title>AzarBio | فواكه مجففة بالتبريد بالجملة</title>
  <style>
    :root{--g:#123b2b;--gold:#b48a43;--cream:#faf7f0;--soft:#f0f5f1;--line:#e4e7e3;--ink:#17211b;--muted:#667169;--danger:#a22b2b;--ok:#17673b;--shadow:0 16px 42px rgba(18,59,43,.10)}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#fff;color:var(--ink);font-family:Arial,Tahoma,"Noto Sans Arabic",sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased;padding-bottom:72px}button,input,select,textarea{font:inherit}img{display:block;width:100%;height:auto}a{color:inherit}.wrap{width:min(calc(100% - 24px),1120px);margin:auto}
    .topbar{background:var(--g);color:#fff;text-align:center;padding:8px 10px;font-size:12px;font-weight:800}.brandrow{display:flex;align-items:center;justify-content:space-between;padding:13px 0}.brand{display:flex;align-items:center;gap:10px;text-decoration:none}.mark{width:42px;height:42px;border-radius:14px;background:var(--g);color:#fff;display:grid;place-items:center;font-size:22px;font-weight:900}.brand b{display:block;color:var(--g);font-size:22px;line-height:1}.brand small{display:block;color:var(--muted);font-size:11px;margin-top:3px}
    .hero{padding:0 0 28px}.hero-media{position:relative;border-radius:0 0 26px 26px;overflow:hidden;background:#e7ece8;box-shadow:var(--shadow)}.hero-media img{aspect-ratio:1/1;object-fit:cover}.hero-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.02) 34%,rgba(7,28,20,.80) 100%)}.hero-copy{position:absolute;right:18px;left:18px;bottom:18px;color:#fff}.hero-kicker{display:inline-flex;background:#fff;color:var(--g);padding:6px 10px;border-radius:999px;font-size:12px;font-weight:900;margin-bottom:8px}.hero h1{font-size:clamp(29px,8.6vw,54px);line-height:1.18;margin:0 0 8px;font-weight:900}.hero h1 em{font-style:normal;color:#f3cf74}.hero-copy p{margin:0;font-size:14px;font-weight:700;opacity:.96}.quick{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:12px}.quick div{background:var(--soft);border:1px solid var(--line);border-radius:14px;padding:10px 7px;text-align:center;font-size:11px;font-weight:800;color:var(--g);line-height:1.45}
    .section{padding:38px 0}.section.soft{background:var(--cream)}.title{margin-bottom:20px}.title h2{font-size:27px;line-height:1.3;margin:0 0 6px;color:var(--g)}.title p{margin:0;color:var(--muted);font-size:14px}
    .offers{display:grid;gap:11px}.offer-card{position:relative;border:2px solid var(--line);background:#fff;border-radius:20px;padding:17px;text-align:right;cursor:pointer;transition:.18s ease}.offer-card.selected{border-color:var(--g);box-shadow:0 0 0 4px rgba(18,59,43,.07)}.offer-card.recommended{border-color:#d7c392;background:linear-gradient(180deg,#fff,#fbf8ef)}.offer-card .badge{position:absolute;left:12px;top:12px;background:var(--g);color:#fff;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:900}.offer-card h3{font-size:25px;margin:0;color:var(--g)}.offer-card .label{font-size:13px;color:var(--muted);font-weight:800;margin-top:2px}.money{display:flex;align-items:end;justify-content:space-between;gap:10px;margin-top:12px;padding-top:11px;border-top:1px solid var(--line)}.money strong{font-size:25px;color:var(--ink)}.money small{color:var(--muted);font-weight:800}.offer-card p{font-size:12px;color:var(--muted);margin:9px 0 0}.offer-btn{width:100%;border:0;background:var(--g);color:#fff;border-radius:13px;min-height:47px;font-weight:900;margin-top:13px;cursor:pointer}
    .formbox{background:#fff;border:1px solid var(--line);border-radius:24px;padding:18px;box-shadow:var(--shadow)}.formbox h2{font-size:25px;color:var(--g);margin:0 0 4px}.formbox>p{margin:0 0 17px;color:var(--muted);font-size:13px}.form-grid{display:grid;gap:12px}.field{display:flex;flex-direction:column;gap:6px}.field label{font-size:14px;font-weight:900;color:#25352c}.field input,.field select,.field textarea{width:100%;min-height:52px;border:1.5px solid #cfd6d1;border-radius:13px;padding:12px 13px;background:#fff;color:var(--ink);font-size:16px;outline:none}.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--g);box-shadow:0 0 0 3px rgba(18,59,43,.08)}.field textarea{min-height:88px;resize:vertical}
    .selected-offer{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--soft);border:1px solid #d8e5dc;border-radius:15px;padding:12px 13px;margin-bottom:13px}.selected-offer small{display:block;color:var(--muted);font-size:11px}.selected-offer strong{display:block;color:var(--g);font-size:16px}.consent{display:flex;gap:9px;align-items:flex-start;margin:14px 0;color:#39463e;font-size:13px;font-weight:700}.consent input{width:19px;height:19px;flex:0 0 auto;margin-top:2px;accent-color:var(--g)}.primary{width:100%;min-height:54px;border:0;border-radius:14px;background:var(--g);color:#fff;font-weight:900;font-size:16px;cursor:pointer}.primary:disabled{opacity:.58;cursor:not-allowed}
    .review{display:none;margin-top:15px;background:var(--cream);border:1px solid #e6dac7;border-radius:17px;padding:15px}.review.show{display:block}.review h3{margin:0 0 9px;color:var(--g);font-size:18px}.review-lines{display:grid;gap:6px;font-size:13px}.review-line{display:flex;justify-content:space-between;gap:12px;border-bottom:1px dashed #ddd3c5;padding-bottom:6px}.review-line:last-child{border-bottom:0}.review-actions{display:grid;grid-template-columns:1fr .65fr;gap:8px;margin-top:13px}.secondary{min-height:50px;border:1px solid var(--g);border-radius:13px;background:#fff;color:var(--g);font-weight:900;cursor:pointer}.status{display:none;margin-top:12px;padding:12px;border-radius:13px;font-size:13px}.status.show{display:block}.status.error{background:#fff0f0;color:var(--danger)}.status.success{background:#edf8f0;color:var(--ok)}
    .proof-grid{display:grid;gap:10px}.proof{background:#fff;border:1px solid var(--line);border-radius:17px;padding:15px}.proof b{display:block;color:var(--g);margin-bottom:3px}.proof span{font-size:13px;color:var(--muted)}.detail{border-radius:22px;overflow:hidden;background:#eee;box-shadow:var(--shadow);margin-bottom:16px}.detail img{aspect-ratio:4/3;object-fit:cover}.audience{display:flex;gap:8px;flex-wrap:wrap}.audience span{background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 11px;font-size:12px;font-weight:800;color:var(--g)}
    details{border-bottom:1px solid var(--line);padding:14px 0}summary{font-weight:900;color:var(--g);cursor:pointer}details p{font-size:13px;color:var(--muted);margin:8px 0 0}.wa{background:var(--g);color:#fff;border-radius:22px;padding:20px}.wa h2{margin:0 0 7px;font-size:24px}.wa p{margin:0 0 14px;opacity:.88;font-size:13px}.wa a{display:flex;align-items:center;justify-content:center;min-height:50px;border-radius:13px;background:#fff;color:var(--g);text-decoration:none;font-weight:900}footer{padding:25px 0 32px;color:var(--muted);font-size:12px;text-align:center}.sticky{position:fixed;right:0;left:0;bottom:0;z-index:60;background:#fff;border-top:1px solid var(--line);padding:8px 10px calc(8px + env(safe-area-inset-bottom));box-shadow:0 -5px 20px rgba(0,0,0,.08)}.sticky a{display:flex;align-items:center;justify-content:center;min-height:50px;border-radius:13px;background:var(--g);color:#fff;text-decoration:none;font-weight:900}.hp{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;overflow:hidden!important}
    @media(min-width:760px){body{padding-bottom:0}.sticky{display:none}.hero{padding:18px 0 44px}.hero-media{border-radius:28px}.hero-media img{aspect-ratio:16/7}.hero-copy{right:34px;left:34px;bottom:30px}.hero-copy p{font-size:16px}.quick{grid-template-columns:repeat(3,180px);justify-content:center;margin-top:16px}.offers{grid-template-columns:repeat(3,1fr)}.formbox{padding:25px}.form-grid{grid-template-columns:1fr 1fr}.field.full{grid-column:1/-1}.proof-grid{grid-template-columns:repeat(3,1fr)}.content-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start}}
  </style>
</head>
<body>
  <div class="topbar">الجملة فقط · الطلب ابتداءً من 2.5 كغ · التوصيل متوفر إلى مختلف المدن</div>
  <header class="wrap brandrow"><a class="brand" href="#top" aria-label="AzarBio"><span class="mark">A</span><span><b>AzarBio</b><small>Fruits lyophilisés · Wholesale</small></span></a></header>

  <main id="top">
    <section class="hero wrap">
      <div class="hero-media">
        <img src="${images.hero}" alt="فواكه مجففة بالتبريد مع مخزون للبيع بالجملة" fetchpriority="high" decoding="async">
        <div class="hero-shade"></div>
        <div class="hero-copy"><span class="hero-kicker">للمحلات وإعادة البيع</span><h1>فواكه مجففة بالتبريد <em>بالجملة</em></h1><p>ابدأ من 2.5 كغ واختر العرض المناسب لنشاطك.</p></div>
      </div>
      <div class="quick"><div>📦 كمية جملة واضحة</div><div>❄️ لا تحتاج ثلاجة عند الحفظ الجاف والمحكم</div><div>🚚 توصيل لمختلف المدن</div></div>
    </section>

    <section class="section soft" id="offers"><div class="wrap">
      <div class="title"><h2>اختر عرض الجملة المناسب</h2><p>ثلاثة عروض فقط، والأسعار الإجمالية واضحة قبل إرسال الطلب.</p></div>
      <div class="offers">
        <article class="offer-card selected" data-offer="2.5KG" tabindex="0"><h3>2.5 كغ</h3><div class="label">عرض البداية</div><div class="money"><strong>447.5 درهم</strong><small>179 درهم/كغ</small></div><p>مناسب للتجربة وبداية إعادة البيع.</p><button class="offer-btn" type="button">اختيار 2.5 كغ</button></article>
        <article class="offer-card recommended" data-offer="5KG" tabindex="0"><span class="badge">عرض التاجر</span><h3>5 كغ</h3><div class="label">للبيع المنتظم</div><div class="money"><strong>799 درهم</strong><small>حوالي 160 درهم/كغ</small></div><p>كمية أكبر بسعر/كغ أقل من عرض البداية.</p><button class="offer-btn" type="button">اختيار 5 كغ</button></article>
        <article class="offer-card" data-offer="10KG" tabindex="0"><span class="badge">أفضل سعر/كغ</span><h3>10 كغ</h3><div class="label">للطلبات الأكبر</div><div class="money"><strong>1450 درهم</strong><small>145 درهم/كغ</small></div><p>أقل سعر للكيلو بين عروض الصفحة.</p><button class="offer-btn" type="button">اختيار 10 كغ</button></article>
      </div>
    </div></section>

    <section class="section" id="order"><div class="wrap"><div class="formbox">
      <h2>أرسل طلبك</h2><p>راجع معلوماتك قبل التأكيد. سنتواصل معك هاتفياً لتأكيد الطلب قبل الشحن.</p>
      <div class="selected-offer"><span><small>العرض المختار</small><strong id="selectedOfferLabel">2.5 كغ — 447.5 درهم</strong></span><span>✓</span></div>
      <form id="leadForm" novalidate>
        <input type="hidden" name="offer_package" id="offerPackage" value="2.5KG"><input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="form-grid">
          <div class="field"><label for="name">الاسم الكامل *</label><input id="name" name="name" type="text" autocomplete="name" minlength="2" maxlength="100" required placeholder="مثال: محمد العلوي"></div>
          <div class="field"><label for="phone">رقم الهاتف *</label><input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="06XXXXXXXX أو 07XXXXXXXX"></div>
          <div class="field"><label for="city">المدينة *</label><input id="city" name="city" type="text" autocomplete="address-level2" maxlength="80" required placeholder="مثال: الدار البيضاء"></div>
          <div class="field"><label for="businessType">نوع النشاط *</label><select id="businessType" name="business_type" required><option value="">اختر النشاط</option><option>محل مكسرات وزريعة</option><option>بقالة / سوبرماركت</option><option>مقهى / حلويات / مخبزة</option><option>إعادة البيع أونلاين</option><option>مشروع جديد</option><option>نشاط آخر</option></select></div>
          <div class="field full"><label for="address">العنوان بالتفصيل *</label><input id="address" name="address" type="text" autocomplete="street-address" minlength="5" maxlength="220" required placeholder="الحي، الشارع، رقم المحل أو أقرب نقطة معروفة"></div>
          <div class="field full"><label for="offerSelect">العرض *</label><select id="offerSelect" required><option value="2.5KG">2.5 كغ — 447.5 درهم</option><option value="5KG">5 كغ — 799 درهم</option><option value="10KG">10 كغ — 1450 درهم</option></select></div>
          <div class="field full"><label for="notes">ملاحظة (اختياري)</label><textarea id="notes" name="notes" maxlength="600" placeholder="أي معلومة إضافية تساعدنا في تأكيد الطلب"></textarea></div>
        </div>
        <label class="consent"><input type="checkbox" name="consent_order" value="yes" required><span>أؤكد أن رقم الهاتف هذا يخصني وأنني أرغب فعلاً في هذا الطلب وأوافق على التواصل معي لتأكيده.</span></label>
        <button type="button" class="primary" id="reviewBtn">راجع طلبي قبل الإرسال</button>
        <div class="review" id="reviewPanel" aria-live="polite"><h3>تأكد من الطلب قبل الإرسال</h3><div class="review-lines" id="reviewLines"></div><div class="review-actions"><button type="button" class="primary" id="confirmBtn">نعم، أكد طلبي</button><button type="button" class="secondary" id="editBtn">تعديل</button></div></div>
        <div class="status" id="formStatus" role="status"></div>
      </form>
    </div></div></section>

    <section class="section soft"><div class="wrap content-grid">
      <div><div class="detail"><img src="${images.detail}" alt="مزيج فواكه مجففة بالتبريد" loading="lazy" decoding="async"></div></div>
      <div><div class="title"><h2>منتج موجه للبيع المهني</h2><p>الصفحة مخصصة للجملة، لذلك نعرض الكميات والأسعار مباشرة بدون عروض استهلاك فردي.</p></div>
        <div class="proof-grid"><div class="proof"><b>سهل التقسيم</b><span>يمكن تقسيم الكمية إلى عبوات أصغر حسب طريقة البيع عندك.</span></div><div class="proof"><b>تخزين بسيط</b><span>يحفظ محكماً في مكان جاف وبعيداً عن الرطوبة والحرارة المباشرة.</span></div><div class="proof"><b>مناسب لعدة أنشطة</b><span>محلات المكسرات، البيع أونلاين، المقاهي والحلويات وغيرها.</span></div></div>
        <div class="audience" style="margin-top:14px"><span>محلات المكسرات</span><span>بقالة راقية</span><span>حلويات ومقاهي</span><span>إعادة البيع أونلاين</span><span>مشاريع جديدة</span></div>
      </div>
    </div></section>

    <section class="section"><div class="wrap"><div class="title"><h2>أسئلة سريعة قبل الطلب</h2></div>
      <details><summary>ما هو الحد الأدنى للطلب؟</summary><p>الحد الأدنى في هذه الصفحة هو 2.5 كغ.</p></details>
      <details><summary>هل يحتاج المنتج إلى الثلاجة؟</summary><p>لا يحتاج إلى الثلاجة عند حفظه محكماً في مكان جاف، بعيداً عن الرطوبة والحرارة وأشعة الشمس المباشرة.</p></details>
      <details><summary>هل يصلح لإعادة البيع؟</summary><p>نعم، ويمكن تقسيمه إلى عبوات أصغر حسب نشاطك وطريقة البيع عندك.</p></details>
      <details><summary>هل التوصيل متوفر؟</summary><p>نعم، التوصيل متوفر إلى مختلف المدن، ويتم تأكيد تفاصيل الشحن أثناء مكالمة التأكيد.</p></details>
    </div></section>

    <section class="section" id="whatsapp"><div class="wrap"><div class="wa"><h2>عندك استفسار قبل الطلب؟</h2><p>واتساب للمساعدة والاستفسارات فقط. إذا كنت جاهزاً للطلب، استعمل الفورم أعلاه حتى نسجل معلوماتك بشكل صحيح.</p><a href="https://wa.me/212708101099?text=%D8%B3%D9%84%D8%A7%D9%85%D8%8C%20%D8%B9%D9%86%D8%AF%D9%8A%20%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%B9%D8%B1%D9%88%D8%B6%20AzarBio%20%D9%84%D9%84%D8%AC%D9%85%D9%84%D8%A9" target="_blank" rel="noopener">تواصل عبر واتساب</a></div></div></section>
  </main>

  <footer class="wrap">AzarBio · بيع الفواكه المجففة بالتبريد بالجملة في المغرب</footer><div class="sticky"><a href="#offers">شوف عروض الجملة</a></div>

  <script>
    (function(){
      var offers = ${JSON.stringify(OFFERS)};
      var loadedAt=Date.now(),form=document.getElementById('leadForm'),cards=Array.prototype.slice.call(document.querySelectorAll('.offer-card')),offerInput=document.getElementById('offerPackage'),offerSelect=document.getElementById('offerSelect'),selectedLabel=document.getElementById('selectedOfferLabel'),reviewBtn=document.getElementById('reviewBtn'),reviewPanel=document.getElementById('reviewPanel'),reviewLines=document.getElementById('reviewLines'),confirmBtn=document.getElementById('confirmBtn'),editBtn=document.getElementById('editBtn'),status=document.getElementById('formStatus'),sending=false;
      function setOffer(key,scroll){if(!offers[key])return;offerInput.value=key;offerSelect.value=key;selectedLabel.textContent=offers[key].qty+' — '+offers[key].total;cards.forEach(function(card){card.classList.toggle('selected',card.getAttribute('data-offer')===key)});reviewPanel.classList.remove('show');if(scroll)document.getElementById('order').scrollIntoView({behavior:'smooth',block:'start'})}
      cards.forEach(function(card){function choose(){setOffer(card.getAttribute('data-offer'),true)}card.addEventListener('click',choose);card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();choose()}})});offerSelect.addEventListener('change',function(){setOffer(offerSelect.value,false)});
      function validPhone(value){var digits=String(value||'').replace(/\D/g,'');if(digits.indexOf('212')===0)digits='0'+digits.slice(3);return /^0[5-7]\d{8}$/.test(digits)}
      function showStatus(message,type){status.textContent=message;status.className='status show '+type}function clearStatus(){status.className='status';status.textContent=''}function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
      reviewBtn.addEventListener('click',function(){clearStatus();if(!form.reportValidity())return;if(!validPhone(form.phone.value)){showStatus('المرجو إدخال رقم هاتف مغربي صحيح يبدأ بـ 05 أو 06 أو 07.','error');form.phone.focus();return}var key=offerInput.value,o=offers[key];reviewLines.innerHTML='<div class="review-line"><span>الاسم</span><b>'+escapeHtml(form.name.value)+'</b></div>'+'<div class="review-line"><span>الهاتف</span><b>'+escapeHtml(form.phone.value)+'</b></div>'+'<div class="review-line"><span>المدينة</span><b>'+escapeHtml(form.city.value)+'</b></div>'+'<div class="review-line"><span>العنوان</span><b>'+escapeHtml(form.address.value)+'</b></div>'+'<div class="review-line"><span>العرض</span><b>'+escapeHtml(o.qty+' — '+o.total)+'</b></div>';reviewPanel.classList.add('show');reviewPanel.scrollIntoView({behavior:'smooth',block:'center'});try{if(window.gtag)window.gtag('event','form_review',{offer_package:key})}catch(e){}});
      editBtn.addEventListener('click',function(){reviewPanel.classList.remove('show');form.scrollIntoView({behavior:'smooth',block:'start'})});
      confirmBtn.addEventListener('click',async function(){if(sending)return;clearStatus();if(!form.reportValidity()||!validPhone(form.phone.value))return;sending=true;confirmBtn.disabled=true;confirmBtn.textContent='جاري تسجيل الطلب...';try{var data=Object.fromEntries(new FormData(form).entries()),params=new URLSearchParams(window.location.search);data.source='AzarBio - Landing V2 Wholesale';data.utm_source=params.get('utm_source')||'';data.utm_medium=params.get('utm_medium')||'';data.utm_campaign=params.get('utm_campaign')||'';data.utm_content=params.get('utm_content')||'';data.utm_term=params.get('utm_term')||'';data.landing_page=window.location.href;data.client_elapsed_ms=String(Date.now()-loadedAt);var response=await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},credentials:'same-origin',cache:'no-store',body:JSON.stringify(data)}),result={};try{result=await response.json()}catch(e){}if(!response.ok||result.ok!==true)throw new Error(result.error||'submit_failed');form.reset();setOffer('2.5KG',false);reviewPanel.classList.remove('show');showStatus('تم تسجيل طلبك بنجاح. سنتواصل معك لتأكيده قبل الشحن.','success');status.scrollIntoView({behavior:'smooth',block:'center'})}catch(err){var map={invalid_name:'المرجو إدخال الاسم بشكل صحيح.',invalid_phone:'المرجو إدخال رقم هاتف صحيح.',invalid_city:'المرجو إدخال المدينة.',invalid_address:'المرجو إدخال العنوان بشكل أوضح.',invalid_business_type:'المرجو اختيار نوع النشاط.',consent_required:'خاصك تأكد أن رقم الهاتف ديالك وأنك باغي الطلب.',invalid_offer:'المرجو اختيار عرض صحيح.',duplicate_recent:'تم تسجيل طلب بنفس الرقم مؤخراً. إذا احتجت تعديلاً تواصل معنا.',duplicate_phone:'تم تسجيل طلبات بنفس الرقم مؤخراً. إذا احتجت تعديلاً تواصل معنا.',too_fast:'المرجو مراجعة المعلومات ثم إعادة المحاولة.',too_many_requests:'عدد المحاولات كبير. انتظر قليلاً ثم حاول من جديد.',upstream_error:'تعذر تسجيل الطلب مؤقتاً. حاول بعد قليل.',upstream_unavailable:'تعذر الاتصال بخدمة تسجيل الطلبات حالياً.'};showStatus(map[err.message]||'تعذر تسجيل الطلب حالياً. حاول مرة أخرى بعد قليل.','error')}finally{sending=false;confirmBtn.disabled=false;confirmBtn.textContent='نعم، أكد طلبي'}});
    })();
  </script>
</body>
</html>`;

  res.statusCode = 200;
  if (req.method === 'HEAD') return res.end();
  res.end(html);
}
