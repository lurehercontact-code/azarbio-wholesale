// Draft catalogue: prices must be supplied before checkout is enabled.
// One package is one stock unit, regardless of the weight printed in the SKU name.
export const NEW_PRODUCT_DRAFTS = Object.freeze([
 {code:'MARCHMILO_50G',sku:'marchmilo-50g',price:null,status:'draft',components:[{sku:'marchmilo-50g',quantity:1}]},
 {code:'NOGA_100G',sku:'noga-100g',price:null,status:'draft',components:[{sku:'noga-100g',quantity:1}]},
 {code:'TRIO_CROQUANT',price:null,status:'draft',components:[{sku:'fruits-mix',quantity:500},{sku:'marchmilo-50g',quantity:1},{sku:'noga-100g',quantity:1}]}
]);
export function renderNewProductsPreview(lang='ar'){
 const fr=lang==='fr';
 const copy=fr?{
  heading:'Trois façons de craquer',intro:'Découvrez les nouveautés Vitamor et notre Pack Trio Croquant.',
  pack:'Pack Trio Croquant',tag:'3 saveurs, 3 sachets, un moment à partager.',
  contents:'500 g de fruits lyophilisés + un sachet de marshmallows + un sachet de nougat.',
  marsh:'Marshmallows lyophilisés',marshText:'Une pause colorée, à découvrir dans son sachet individuel.',
  noga:'Nougat lyophilisé',nogaText:'Le nougat en version lyophilisée, dans son sachet individuel.',
  draft:'Aperçu • Prix et disponibilité en préparation',soon:'Bientôt disponible',note:'Visuels de présentation. Les commandes de ces nouveautés ne sont pas encore ouvertes.',
  ice:'Prochainement : glace italienne'
 }:{
  heading:'ثلاث نكهات… والقرمشة تجمعنا',intro:'اكتشف جديد Vitamor وباك ثلاثي القرمشة.',
  pack:'باك ثلاثي القرمشة',tag:'ثلاثة ساشيات، ثلاث نكهات، ولحظة زوينة للمشاركة.',
  contents:'500g خليط فواكه مجففة بالتبريد + ساشي مارشميلو + ساشي نوكا.',
  marsh:'مارشميلو مجفف بالتبريد',marshText:'ألوان كتفرّح، فـساشي بوحدو باش تعيش تجربة جديدة.',
  noga:'نوكا مجففة بالتبريد',nogaText:'اكتشف النوكا بنسخة مجففة بالتبريد، فـساشي بوحدو.',
  draft:'معاينة • الأثمنة والتوفر قيد الإعداد',soon:'قريباً للطلب',note:'صور توضيحية للتقديم. الطلب على هاد المنتوجات مازال ما تفتحش.',
  ice:'قريباً: الآيس كريم الإيطالي'
 };
 return `<style>
 body:has(#new-products) .sticky{display:none}.new-catalog{background:#f0f5f1;color:#132e21;scroll-margin-top:55px;font-family:Tahoma,Arial,sans-serif}.new-catalog .catalog-intro{text-align:center;max-width:650px;margin:0 auto 28px;font-size:18px;line-height:1.8}.catalog-draft{display:inline-block;padding:6px 12px;background:#e0ece4;color:#173f2c;border-radius:99px;font-size:13px;font-weight:700}.catalog-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.catalog-card{min-width:0;background:#fff;border:1px solid #c9d8cd;box-shadow:0 8px 25px #173f2c0a;border-radius:22px;overflow:hidden}.catalog-card img{display:block;width:100%;height:300px;object-fit:contain;background:#fff}.catalog-card .catalog-copy{padding:28px}.catalog-card h3{font-size:30px;line-height:1.45;margin:0 0 9px;color:#173f2c}.catalog-card p{margin:0 0 12px;font-size:18px;line-height:1.85}.catalog-card .soon{display:inline-block;padding:8px 15px;border:1px solid #d9e4d9;background:#dcece0;color:#163d27;border-radius:12px;font-weight:800}.catalog-card.pack{grid-column:1/-1;display:grid;grid-template-columns:1.2fr 1fr;align-items:center;border:2px solid #47795a}.catalog-card.pack img{height:auto;aspect-ratio:4/3;object-fit:contain}.catalog-card.pack h3{font-size:34px}.catalog-note{font-size:14px;line-height:1.8;text-align:center;color:#384b3e;margin-top:18px}.catalog-ice{text-align:center;font-weight:800;color:#173f2c;margin:20px 0 0}
 @media(max-width:760px){.catalog-grid{gap:13px;grid-template-columns:1fr}.catalog-card.pack{display:block;grid-column:auto}.catalog-card img{height:290px}.catalog-card .catalog-copy{padding:22px 18px}.catalog-card h3,.catalog-card.pack h3{font-size:28px}.catalog-card.pack img{aspect-ratio:4/3}.catalog-card p{font-size:17px}.new-catalog .title{font-size:29px;line-height:1.5}.catalog-draft{font-size:12px}}
 </style><section class="new-catalog" id="new-products" aria-labelledby="catalog-title"><div class="wrap"><div class="catalog-intro"><span class="catalog-draft">${copy.draft}</span><h2 class="title" id="catalog-title" style="margin-top:14px">${copy.heading}</h2><p>${copy.intro}</p></div><div class="catalog-grid">
 <article class="catalog-card pack" data-draft-product="TRIO_CROQUANT"><img src="/vitamor-trio-croquant.webp" width="1448" height="1086" loading="lazy" decoding="async" alt="${copy.pack}"><div class="catalog-copy"><h3>${copy.pack}</h3><p><strong>${copy.tag}</strong></p><p>${copy.contents}</p><span class="soon">${copy.soon}</span></div></article>
 <article class="catalog-card" data-draft-product="MARCHMILO_50G"><img src="/vitamor-marchmilo.webp" width="1122" height="1402" loading="lazy" decoding="async" alt="${copy.marsh}"><div class="catalog-copy"><h3>${copy.marsh}</h3><p>${copy.marshText}</p><span class="soon">${copy.soon}</span></div></article>
 <article class="catalog-card" data-draft-product="NOGA_100G"><img src="/vitamor-noga.webp" width="1122" height="1402" loading="lazy" decoding="async" alt="${copy.noga}"><div class="catalog-copy"><h3>${copy.noga}</h3><p>${copy.nogaText}</p><span class="soon">${copy.soon}</span></div></article>
 </div><p class="catalog-note">${copy.note}</p><p class="catalog-ice">${copy.ice}</p></div></section>`;
}