export const DEFAULT_STORE={
 name:'Vitamor',tagline:'قرمشة مختلفة… تجربة كتستاهل!',language:'ar',currency:'MAD',logo:'/store-assets/logo.svg',phone:'0708101099',email:'',address:'',domains:[],
 copy:{heroKicker:'مرحبا بك فعالم القرمشة',productsTitle:'شنو هي قرمشتك اليوم؟',productsSubtitle:'اختار منتجك، قارن العروض وزيد اللي بغيتي للسلة.',faqTitle:'باقي عندك شي سؤال؟',addToCart:'زيد للسلة ♧',buyNow:'طلب هاد المنتج مباشرة',checkoutTitle:'كمّل طلبك بكل سهولة',checkoutButton:'أكد الطلب · الدفع عند الاستلام',footerTagline:'قرمشة جديدة… كل يوم'},
 colors:{primary:'#16533d',background:'#fffaf2',accent:'#f4c45d'},announcement:'الدفع عند الاستلام · اكتشف قرمشتك المفضلة',
 shipping:{base:0,freeAbove:null,cities:[],estimate:'كنعيطو ليك باش نأكدو الطلب وتفاصيل التوصيل.'},
 slides:[
 {title:'الفواكه… بقرمشة جديدة',subtitle:'خليط فواكه مجففة بالتبريد. اختار الوزن اللي يناسبك.',image:'/store-assets/vitamor-fruits-sachet.webp',mobileImage:'/store-assets/vitamor-fruits-sachet.webp',product:'fruits',background:'#f4e5bd',active:true},
 {title:'قرمشة حلوة كتبدل المود',subtitle:'مرشميلو ونوكا مجففة بالتبريد… جرب نكهة مختلفة.',image:'/store-assets/vitamor-marchmilo.webp',mobileImage:'/store-assets/vitamor-marchmilo.webp',product:'marchmilo',background:'#f9dfdf',active:true},
 {title:'ثلاث نكهات… تجربة واحدة',subtitle:'500g فواكه + ساشي مرشميلو + ساشي نوكا.',image:'/store-assets/vitamor-trio-croquant.webp',mobileImage:'/store-assets/vitamor-trio-croquant.webp',product:'trio',background:'#e4ecdc',active:true}
 ],
 categories:[{id:'all',name:'كل القرمشات'},{id:'fruits',name:'فواكه'},{id:'sweets',name:'مرشميلو ونوكا'},{id:'packs',name:'الباكات'}],
 products:[
 {id:'fruits',slug:'fruits-lyophilises',name:'خليط الفواكه المقرمشة',category:'fruits',image:'/store-assets/vitamor-fruits-sachet.webp',gallery:[],short:'نكهات الفواكه فكل قرمشة.',description:'خليط فواكه مجففة بالتبريد، اختار العرض والكمية اللي تناسبك.',ingredients:'',allergens:'',storage:'يسد الساشي مزيان بعد الفتح ويحفظ بعيداً عن الرطوبة والحرارة.',offerCodes:['500G','1KG','2KG_PLUS_500G'],visible:true,comingSoon:false},
 {id:'marchmilo',slug:'marchmilo-croquant',name:'مرشميلو مجفف بالتبريد',category:'sweets',image:'/store-assets/vitamor-marchmilo.webp',gallery:[],short:'خفيف ومقرمش… مفاجأة من أول لقمة.',description:'ساشي مرشميلو مجفف بالتبريد، بقوام خفيف ومقرمش.',ingredients:'',allergens:'',storage:'يحفظ بعيداً عن الرطوبة.',offerCodes:['MARCHMILO_50G'],visible:true,comingSoon:false},
 {id:'noga',slug:'noga-croquante',name:'نوكا مجففة بالتبريد',category:'sweets',image:'/store-assets/vitamor-noga.webp',gallery:[],short:'لذيذة، خفيفة ومقرمشة.',description:'ساشي نوكا مجففة بالتبريد، بقوام خفيف ومقرمش.',ingredients:'',allergens:'',storage:'يحفظ بعيداً عن الرطوبة.',offerCodes:['NOGA_100G'],visible:true,comingSoon:false},
 {id:'trio',slug:'trio-croquant',name:'باك ثلاثي القرمشة',category:'packs',image:'/store-assets/vitamor-trio-croquant.webp',gallery:[],short:'الفواكه، المرشميلو والنوكا… مجموعين ليك.',description:'500g من خليط الفواكه + ساشي مرشميلو + ساشي نوكا.',ingredients:'',allergens:'',storage:'تحفظ جميع الساشيات بعيداً عن الرطوبة.',offerCodes:['TRIO_CROQUANT'],visible:true,comingSoon:false},
 {id:'icecream',slug:'glace-lyophilisee',name:'آيس كريم مجفف بالتبريد',category:'sweets',image:'',gallery:[],short:'قرمشة جديدة قريباً…',description:'',ingredients:'',allergens:'',storage:'',offerCodes:[],visible:true,comingSoon:true}
 ],
 sections:['products','pack','story','faq'],story:{title:'علاش هاد القرمشة مختلفة؟',text:'التجفيف بالتبريد كيعطي قوام خفيف ومقرمش. اكتشف المنتجات، قارن العروض واختار اللي يناسبك.',video:''},
 faq:[{question:'كيفاش نطلب؟',answer:'اختار المنتجات والعروض، زيدها للسلة وعمر معلوماتك. من بعد نتاصلو بيك لتأكيد الطلب.'},{question:'واش نقدر نجمع عدة منتجات؟',answer:'نعم، تقدر تجمع الفواكه والمرشميلو والنوكا والباكات، بكميات مختلفة فنفس الطلب.'},{question:'كيفاش نخلص؟',answer:'الدفع عند الاستلام. المجموع ومصاريف التوصيل كيبانو قبل تسجيل الطلب.'}],
 policies:{delivery:'',returns:'',privacy:''},reviews:[],offerEdits:[],marketing:{metaPixelId:'',gaId:'',clarityId:''},coupons:[]
};
export const text=(v,max=1000)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
export const error=(status,message)=>{throw Object.assign(new Error(message),{status});};
export function assetURL(value){const s=text(value,600);if(!s)return '';if(/^\/(?!\/)[A-Za-z0-9_./?=&%-]+$/.test(s)&&!s.includes('..'))return s;try{const u=new URL(s);if(u.protocol==='https:'&&!u.username&&!u.password)return u.href;}catch{}error(400,'Lien de média invalide');}
const arr=(v,max)=>{if(!Array.isArray(v)||v.length>max)error(400,'Liste trop longue ou invalide');return v;};
const slug=v=>{const s=text(v,80);if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(s))error(400,'Identifiant invalide');return s;};
export const cents=v=>{if(!Number.isSafeInteger(v)||v<0||v>100000000)error(400,'Montant invalide');return v;};
export function validateStore(value){
 const c=structuredClone(value);if(!c||typeof c!=='object'||Array.isArray(c))error(400,'Configuration invalide');
 c.name=text(c.name,80);if(!c.name)error(400,'Nom du magasin requis');c.tagline=text(c.tagline,160);c.logo=assetURL(c.logo);c.language=['ar','fr'].includes(c.language)?c.language:'ar';c.currency='MAD';
 for(const k of ['phone','email','address','announcement'])c[k]=text(c[k],500);
 c.colors=Object.fromEntries(['primary','background','accent'].map(k=>{if(!/^#[\da-f]{6}$/i.test(c.colors?.[k]||''))error(400,'Couleur invalide');return [k,c.colors[k]];}));
 c.copy=Object.fromEntries(Object.entries(DEFAULT_STORE.copy).map(([k,v])=>[k,text(c.copy?.[k]||v,300)]));
 c.domains=arr(c.domains||[],10).map(d=>{const host=text(d,200).toLowerCase();if(!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(host))error(400,'Domaine invalide');return host;});
 c.shipping={base:cents(c.shipping?.base??0),freeAbove:c.shipping?.freeAbove===null?null:cents(c.shipping?.freeAbove),estimate:text(c.shipping?.estimate,400),cities:arr(c.shipping?.cities||[],100).map(x=>({name:text(x.name,80),price:cents(x.price)}))};
 const unique=(xs,key)=>{if(new Set(xs.map(x=>x[key])).size!==xs.length)error(400,'Identifiants dupliqués');return xs;};
 c.categories=unique(arr(c.categories,12).map(x=>({id:slug(x.id),name:text(x.name,80)})),'id');
 c.products=unique(arr(c.products,60).map(p=>{const out={};for(const k of ['id','slug'])out[k]=slug(p[k]);for(const k of ['name','short','description','ingredients','allergens','storage'])out[k]=text(p[k],k==='description'?3000:1000);if(!out.name)error(400,'Nom de produit requis');out.category=slug(p.category);out.image=assetURL(p.image);out.gallery=arr(p.gallery||[],8).map(assetURL);out.offerCodes=[...new Set(arr(p.offerCodes||[],20).map(x=>text(x,80)))];out.visible=!!p.visible;out.comingSoon=!!p.comingSoon;return out;}),'id');unique(c.products,'slug');
 c.slides=arr(c.slides,6).map(x=>{if(!/^#[\da-f]{6}$/i.test(x.background||''))error(400,'Fond du slider invalide');return {title:text(x.title,120),subtitle:text(x.subtitle,400),button:text(x.button,60),image:assetURL(x.image),mobileImage:assetURL(x.mobileImage||x.image),product:slug(x.product),background:x.background,active:!!x.active};});
 c.sections=[...new Set(arr(c.sections,8))];if(c.sections.some(x=>!['products','pack','story','faq','reviews'].includes(x)))error(400,'Section invalide');
 c.story={title:text(c.story?.title,120),text:text(c.story?.text,2000),video:assetURL(c.story?.video)};
 c.faq=arr(c.faq||[],16).map(x=>({question:text(x.question,160),answer:text(x.answer,1500)}));
 c.policies=Object.fromEntries(['delivery','returns','privacy'].map(k=>[k,text(c.policies?.[k],5000)]));
 c.reviews=arr(c.reviews||[],30).map(x=>({name:text(x.name,100),city:text(x.city,80),text:text(x.text,1200),rating:Math.min(5,Math.max(1,Math.round(Number(x.rating)||5))),verified:!!x.verified}));
 c.offerEdits=unique(arr(c.offerEdits||[],100).map(x=>({id:text(x.id,100),name:text(x.name,200),price:cents(x.price),active:!!x.active})),'id');
 c.marketing={metaPixelId:text(c.marketing?.metaPixelId,30),gaId:text(c.marketing?.gaId,30),clarityId:text(c.marketing?.clarityId,30)};
 if(c.marketing.metaPixelId&&!/^\d{5,25}$/.test(c.marketing.metaPixelId))error(400,'Pixel Meta invalide');if(c.marketing.gaId&&!/^G-[A-Z0-9]+$/.test(c.marketing.gaId))error(400,'Identifiant GA4 invalide');if(c.marketing.clarityId&&!/^[a-z0-9]+$/i.test(c.marketing.clarityId))error(400,'Identifiant Clarity invalide');
 c.coupons=arr(c.coupons||[],20).map(x=>{const code=text(x.code,30).toUpperCase(),percent=Number(x.percent);if(!/^[A-Z0-9_-]{3,30}$/.test(code)||!Number.isInteger(percent)||percent<1||percent>70||!Number.isFinite(Date.parse(x.expires)))error(400,'Code promotionnel invalide');return {code,percent,expires:new Date(x.expires).toISOString(),minTotal:cents(x.minTotal||0),active:!!x.active};});
 return c;
}
export function shippingPrice(config,city,subtotal){if(config.shipping.freeAbove!==null&&subtotal>=config.shipping.freeAbove)return 0;return config.shipping.cities.find(x=>x.name.toLocaleLowerCase()===String(city).trim().toLocaleLowerCase())?.price??config.shipping.base;}
