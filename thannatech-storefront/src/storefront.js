import {DEFAULT_STORE,validateStore,text,error,assetURL,shippingPrice,cents} from './storefront-config.js';
const q=(db,sql,...values)=>db.prepare(sql).bind(...values),one=(db,sql,...a)=>q(db,sql,...a).first(),all=async(db,sql,...a)=>(await q(db,sql,...a).all()).results;
const now=()=>new Date().toISOString(),uuid=()=>crypto.randomUUID(),json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const audit=(db,u,action,detail)=>q(db,'INSERT INTO audit(actor,action,detail) VALUES(?,?,?)',u.id,action,JSON.stringify(detail));
const admin=(u,brand)=>{if(!u||u.role!=='admin'||u.brand_id&&u.brand_id!==brand)error(403,'Administration de la boutique non autorisée');};
export async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
const secret=env=>{const key=env.STORE_VISITOR_SECRET||env.SETUP_TOKEN||'';if(key.length<32)error(503,'Protection des visiteurs à configurer');return key;};
async function hmac(env,s){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode('storefront-visitor|'+secret(env)),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(s)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export async function visitorIdentity(req,env){
 const raw=/__Host-thanna_shop=([^;]+)/.exec(req.headers.get('cookie')||'')?.[1]||'';let [device,expiry,signature]=raw.split('.'),valid=false;
 if(/^[a-f0-9]{64}$/.test(device||'')&&/^\d{13}$/.test(expiry||'')&&+expiry>Date.now()&&+expiry<Date.now()+181*86400000&&/^[a-f0-9]{64}$/.test(signature||'')){const expected=await hmac(env,'cookie:'+device+'.'+expiry);let diff=0;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^signature.charCodeAt(i);valid=diff===0;}
 if(!valid){device=[...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join('');expiry=String(Date.now()+180*86400000);signature=await hmac(env,'cookie:'+device+'.'+expiry);}
 const ip=text(req.headers.get('CF-Connecting-IP'),80);
 return {submitter:{device_hash:await hmac(env,'device:'+device),ip_hash:ip?await hmac(env,'ip:'+ip):''},cookie:valid?null:'__Host-thanna_shop='+device+'.'+expiry+'.'+signature+'; Path=/; Max-Age=15552000; HttpOnly; Secure; SameSite=Lax'};
}
async function limited(db,key,max){const t=Date.now();await q(db,'INSERT INTO login_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<? THEN excluded.expires ELSE expires END',key,t+900000,t,t).run();if((await one(db,'SELECT count FROM login_limits WHERE key=?',key)).count>max)error(429,'Trop de demandes. Réessayez dans quelques minutes.');}
export async function catalog(db,brand,config){
 const offers=await all(db,'SELECT o.*,p.unit,p.name product_name,p.active product_active,p.color,p.size FROM offers o JOIN products p ON p.id=o.sku WHERE o.brand_id=? ORDER BY o.price',brand),stock=await all(db,'SELECT sku,on_hand-reserved available FROM stock'),stocks=new Map(stock.map(x=>[x.sku,x.available])),components=await all(db,'SELECT c.*,p.active FROM offer_components c JOIN products p ON p.id=c.sku');
 return offers.map(o=>{const edit=config.offerEdits.find(e=>e.id===o.id),bom=o.is_bundle?components.filter(x=>x.offer_id===o.id):[{sku:o.sku,quantity:o.quantity,active:o.product_active}],capacity=bom.length&&bom.every(x=>x.active)?Math.max(0,Math.min(...bom.map(x=>Math.floor((stocks.get(x.sku)||0)/x.quantity)))):0;return {...o,name:edit?.name||o.name,price:edit?.price??o.price,active:!!o.active&&!!o.product_active&&(edit?.active??true),available:capacity,bom:bom.map(x=>({sku:x.sku,quantity:x.quantity,available:stocks.get(x.sku)||0})),color:o.color||'',size:o.size||''};});
}
export async function getStore(db,slug,preview=false){const s=await one(db,'SELECT * FROM storefronts WHERE slug=?',slug);if(!s||(!preview&&!s.published))error(404,'Boutique indisponible');const config=JSON.parse(preview?s.draft:s.published),offers=await catalog(db,s.brand_id,config);return {store:s,config,offers,revision:preview?s.draft_revision:s.published_revision};}
function exposed(data,preview){const {store,config,offers,revision}=data;return {brand_id:store.brand_id,slug:store.slug,revision,preview,config:{...config,products:config.products.filter(p=>p.visible),slides:config.slides.filter(s=>s.active),offerEdits:undefined,coupons:undefined,domains:undefined},offers:offers.filter(o=>o.active).map(({id,external_code,name,price,unit,quantity,available,color,size})=>({id,external_code,name,price,unit,quantity,available,color,size}))};}
function canonicalItems(items,offers,config){if(!Array.isArray(items)||!items.length||items.length>20)error(400,'Choisissez entre 1 et 20 articles');const allowed=new Set(config.products.filter(p=>p.visible&&!p.comingSoon).flatMap(p=>p.offerCodes)),counts=new Map();for(const line of items){if(!line||!allowed.has(line.offer_package)||!Number.isSafeInteger(line.count)||line.count<1||line.count>20)error(400,'Article ou quantité invalide');counts.set(line.offer_package,(counts.get(line.offer_package)||0)+line.count);}return [...counts].sort(([a],[b])=>a.localeCompare(b)).map(([offer_package,count])=>{const offer=offers.find(o=>o.external_code===offer_package&&o.active);if(!offer||count>20)error(400,'Offre indisponible');return {offer_package,count,offer};});}
export function quoteOrder(data,b,{checkStock=true}={}){
 const lines=canonicalItems(b.items,data.offers,data.config),demand=new Map();let subtotal=0;for(const line of lines){subtotal+=line.offer.price*line.count;for(const component of line.offer.bom)demand.set(component.sku,(demand.get(component.sku)||0)+component.quantity*line.count);}
 if(checkStock){const available=new Map();for(const line of lines)for(const c of line.offer.bom){const known=c.available;available.set(c.sku,Math.min(available.get(c.sku)??Infinity,known));}for(const [sku,total]of demand)if(total>(available.get(sku)||0))error(409,'Une quantité sélectionnée dépasse le stock disponible.');}
 let discount=0,percent=0;const code=text(b.coupon_code,30).toUpperCase();if(code){const coupon=data.config.coupons.find(x=>x.active&&x.code===code&&Date.parse(x.expires)>Date.now()&&subtotal>=x.minTotal);if(!coupon)error(400,'Code promotionnel expiré ou non applicable');percent=coupon.percent;discount=lines.reduce((n,l)=>n+(l.offer.price-Math.round(l.offer.price*(100-percent)/100))*l.count,0);}
 if(subtotal>1000000000)error(400,'Montant du panier trop élevé');
 const shipping=shippingPrice(data.config,b.city||'',subtotal-discount),prices=Object.fromEntries(lines.map(l=>[l.offer.external_code,Math.round(l.offer.price*(100-percent)/100)]));
 return {items:lines.map(({offer_package,count})=>({offer_package,count})),prices,subtotal,discount,shipping,total:subtotal-discount+shipping,coupon_code:code,revision:data.revision};
}
async function uploadMedia(req,db,u,brand){
 const mime=req.headers.get('content-type')?.split(';')[0];if(!['image/jpeg','image/png','image/webp'].includes(mime))error(415,'Utilisez une image JPEG, PNG ou WebP');
 const reader=req.body?.getReader();if(!reader)error(400,'Image requise');let length=0,parts=[];for(;;){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>300000){await reader.cancel();error(413,'Image trop lourde : maximum 300 Ko après optimisation');}parts.push(value);}const bytes=new Uint8Array(length);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}
 const valid=mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216:mime==='image/png'?bytes.slice(0,8).join(',')==='137,80,78,71,13,10,26,10':String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';if(!valid)error(400,'Format d’image invalide');
 let binary='';for(let i=0;i<length;i+=8192)binary+=String.fromCharCode(...bytes.slice(i,i+8192));const id=uuid();await db.batch([q(db,'INSERT INTO storefront_media VALUES(?,?,?,?,?,?)',id,brand,mime,btoa(binary),now(),u.id),audit(db,u,'store.media.upload',{brand,id,mime,bytes:length})]);return {id,url:'/api/storefront/media/'+id};
}
async function configBody(req){if(!req.headers.get('content-type')?.includes('application/json'))error(415,'JSON requis');const reader=req.body?.getReader();if(!reader)error(400,'Configuration vide');let n=0,parts=[];for(;;){const {value,done}=await reader.read();if(done)break;n+=value.length;if(n>192000){await reader.cancel();error(413,'Configuration trop volumineuse');}parts.push(value);}const bytes=new Uint8Array(n);let p=0;for(const value of parts){bytes.set(value,p);p+=value.length;}try{return JSON.parse(new TextDecoder().decode(bytes));}catch{error(400,'JSON invalide');}}
export async function boutiquesAPI(req,env,url,u,body){
 const p=url.pathname,m=req.method,db=env.DB;if(!p.startsWith('/api/boutiques'))return;
 const previewRoute=/^\/api\/boutiques\/preview\/([a-z0-9-]+)(?:\/(quote|events|checkout))?$/.exec(p);
 if(previewRoute){const data=await getStore(db,previewRoute[1],true);admin(u,data.store.brand_id);const action=previewRoute[2]||'';if(m==='GET'&&!action)return exposed(data,true);if(m==='POST'&&action==='quote')return quoteOrder(data,await body(req));if(m==='POST'&&action==='events')return {ok:true,preview:true};if(action==='checkout')error(409,'La prévisualisation ne reçoit pas de vraies commandes');error(405,'Action non disponible');}
 if(p==='/api/boutiques'&&m==='GET'){admin(u,u.brand_id);return {stores:await all(db,'SELECT s.brand_id,s.slug,s.draft_revision,s.published_revision,s.updated_at,b.name FROM storefronts s JOIN brands b ON b.id=s.brand_id'+(u.brand_id?' WHERE s.brand_id=?':''),...(u.brand_id?[u.brand_id]:[])),brands:await all(db,'SELECT * FROM brands'+(u.brand_id?' WHERE id=?':''),...(u.brand_id?[u.brand_id]:[]))};}
 const match=/^\/api\/boutiques\/([^/]+)(?:\/([^/]+))?$/.exec(p);if(!match)error(404,'Page introuvable');const brand=decodeURIComponent(match[1]),action=match[2]||'';admin(u,brand);if(!await one(db,'SELECT id FROM brands WHERE id=?',brand))error(404,'Marque introuvable');
 if(action==='media'&&m==='POST')return uploadMedia(req,db,u,brand);
 if(action==='initialize'&&m==='POST'){
  if(await one(db,'SELECT brand_id FROM storefronts WHERE brand_id=?',brand))error(409,'Boutique déjà créée');const b=await body(req),slug=text(b.slug||brand,80);if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug))error(400,'Adresse de boutique invalide');
  const config=structuredClone(DEFAULT_STORE);config.name=(await one(db,'SELECT name FROM brands WHERE id=?',brand)).name;config.offerEdits=(await all(db,'SELECT * FROM offers WHERE brand_id=?',brand)).map(o=>({id:o.id,name:o.name,price:o.price,active:!!o.active}));
  if(brand!=='vitamor'){config.products=[];config.slides=[];}const draft=JSON.stringify(validateStore(config)),source='storefront-'+brand;
  await db.batch([q(db,'INSERT INTO storefronts(brand_id,slug,draft,updated_at,updated_by) VALUES(?,?,?,?,?)',brand,slug,draft,now(),u.id),q(db,'INSERT OR IGNORE INTO sources(id,brand_id,name,url,secret_hash,active) VALUES(?,?,?,?,?,1)',source,brand,'Boutique '+config.name,new URL('/shop/'+slug,url.origin).href,await digest(uuid())),audit(db,u,'store.initialize',{brand,slug})]);return {ok:true};
 }
 const store=await one(db,'SELECT * FROM storefronts WHERE brand_id=?',brand);if(!store)error(404,'Créez d’abord la boutique');
 if(m==='GET'&&!action)return {store,config:JSON.parse(store.draft),catalog:await catalog(db,brand,JSON.parse(store.draft)),products:await all(db,'SELECT id,name,unit,color,size,active FROM products ORDER BY name'),versions:await all(db,'SELECT id,version,created_at FROM storefront_versions WHERE brand_id=? ORDER BY version DESC LIMIT 30',brand)};
 if(m==='GET'&&action==='stats'){
  const days=Math.min(366,Math.max(1,Number(url.searchParams.get('days'))||30)),since=new Date(Date.now()-days*86400000).toISOString();
  return {days,events:await all(db,'SELECT event,COUNT(*) count,COUNT(DISTINCT session_id) sessions FROM storefront_events WHERE brand_id=? AND created_at>=? GROUP BY event',brand,since),orders:await one(db,"SELECT COUNT(*) orders,COALESCE(SUM(confirmation='Confirmé'),0) confirmed,COALESCE(SUM(delivery='Livré'),0) delivered,COALESCE(SUM(total),0) value FROM active_orders WHERE source_id=? AND created_at>=? AND kind='order'",'storefront-'+brand,since)};
 }
 if(m==='POST'&&['save','publish','restore'].includes(action)){
  const b=await configBody(req);if(b.revision!==store.draft_revision)error(409,'La boutique a été modifiée. Rechargez avant de sauvegarder.');let config;
  if(action==='restore'){const version=await one(db,'SELECT config FROM storefront_versions WHERE id=? AND brand_id=?',b.version_id,brand);if(!version)error(404,'Version introuvable');config=validateStore(JSON.parse(version.config));}else config=validateStore(b.config);
  const canonical=await all(db,'SELECT id,external_code FROM offers WHERE brand_id=?',brand);if(config.offerEdits.some(e=>!canonical.some(o=>o.id===e.id)))error(400,'Offre d’une autre marque ou supprimée');const codes=new Set(canonical.map(o=>o.external_code));if(config.products.some(p=>p.offerCodes.some(c=>!codes.has(c))))error(400,'Produit lié à une offre inconnue');
  const operation=uuid(),statements=[q(db,'INSERT INTO guards VALUES(?,(SELECT COUNT(*) FROM storefronts WHERE brand_id=? AND draft_revision=?))',operation,brand,b.revision)],serialized=JSON.stringify(config);
  if(action==='publish'){if(!config.products.some(p=>p.visible&&!p.comingSoon&&p.offerCodes.length))error(400,'Ajoutez au moins un produit disponible');const version=store.published_revision+1;statements.push(q(db,'INSERT INTO storefront_versions VALUES(?,?,?,?,?,?)',uuid(),brand,version,serialized,now(),u.id),q(db,'UPDATE storefronts SET draft=?,published=?,draft_revision=draft_revision+1,published_revision=?,updated_at=?,updated_by=? WHERE brand_id=?',serialized,serialized,version,now(),u.id,brand));}else statements.push(q(db,'UPDATE storefronts SET draft=?,draft_revision=draft_revision+1,updated_at=?,updated_by=? WHERE brand_id=?',serialized,now(),u.id,brand));
  statements.push(audit(db,u,'store.'+action,{brand,revision:b.revision+1}),q(db,'DELETE FROM guards WHERE id=?',operation));await db.batch(statements);return {ok:true,revision:b.revision+1};
 }
 if(m==='POST'&&action==='product'){
  const b=await body(req),pid=text(b.sku,100),unit=b.unit;if(!/^[a-z0-9-]{2,100}$/.test(pid)||!['g','unit'].includes(unit)||!text(b.name,200))error(400,'Référence, nom et unité requis');await db.batch([q(db,'INSERT INTO products(id,name,unit,color,size) VALUES(?,?,?,?,?)',pid,text(b.name,200),unit,text(b.color,80),text(b.size,80)),audit(db,u,'store.product.create',{brand,sku:pid})]);return {ok:true};
 }
 if(m==='POST'&&action==='offer'){
  const b=await body(req),code=text(b.code,80),name=text(b.name,200),price=cents(b.price),components=Array.isArray(b.components)?b.components:[];
  if(!/^[A-Z0-9_-]{2,80}$/.test(code)||!name||components.length>20)error(400,'Offre invalide');
  const bom=components.length?components.map(c=>({sku:text(c.sku,100),quantity:Number(c.quantity)})):[{sku:text(b.sku,100),quantity:Number(b.quantity)}];
  if(new Set(bom.map(c=>c.sku)).size!==bom.length||bom.some(c=>!Number.isSafeInteger(c.quantity)||c.quantity<1||c.quantity>100000000))error(400,'Composants ou quantités invalides');
  for(const c of bom)if(!await one(db,'SELECT id FROM products WHERE id=? AND active=1',c.sku))error(400,'Produit physique indisponible');
  const oid=uuid(),bundle=components.length>0;await db.batch([q(db,'INSERT INTO offers(id,brand_id,external_code,sku,name,quantity,price,active,is_bundle) VALUES(?,?,?,?,?,?,?,1,?)',oid,brand,code,bom[0].sku,name,bundle?1:bom[0].quantity,price,bundle?1:0),...(bundle?bom.map(c=>q(db,'INSERT INTO offer_components(offer_id,sku,quantity) VALUES(?,?,?)',oid,c.sku,c.quantity)):[]),audit(db,u,'store.offer.create',{brand,id:oid,code,bundle,components:bom})]);return {ok:true};
 }
 error(405,'Action non disponible');
}
export async function storefrontPublic(req,env,url,deps){
 const p=url.pathname,m=req.method,db=env.DB;
 const media=/^\/api\/storefront\/media\/([a-f0-9-]{36})$/.exec(p);if(media&&m==='GET'){const image=await one(db,'SELECT mime,data FROM storefront_media WHERE id=?',media[1]);if(!image)error(404,'Image introuvable');return new Response(Uint8Array.from(atob(image.data),c=>c.charCodeAt(0)),{headers:{'Content-Type':image.mime,'Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});}
 const match=/^\/api\/storefront\/([a-z0-9-]+)(?:\/(quote|checkout|events))?$/.exec(p);if(!match)return;const slug=match[1],action=match[2]||'',preview=url.searchParams.get('preview')==='1';
 if(preview)error(403,'Utilisez la prévisualisation authentifiée depuis Gestion des boutiques');const data=await getStore(db,slug,false);
 if(m==='GET'&&!action)return json(exposed(data,preview));
 if(m!=='POST'||!action)error(405,'Méthode non autorisée');if(req.headers.get('origin')!==url.origin)error(403,'Origine non autorisée');
 if(preview&&action==='checkout')error(409,'La prévisualisation ne reçoit pas de vraies commandes');
 const b=await deps.body(req);if(text(b.website))error(400,'Requête invalide');
 const ip=req.headers.get('CF-Connecting-IP')||'unknown';await limited(db,'store:'+slug+':'+action+':'+await hmac(env,'rate:'+ip),action==='events'?150:action==='quote'?80:20);
 if(action==='events'){
  if(!['visit','view_product','add_to_cart','begin_checkout'].includes(b.event)||! /^[a-f0-9-]{36}$/.test(b.id||'')||!/^[a-f0-9-]{36}$/.test(b.session_id||''))error(400,'Événement invalide');if(!preview)await q(db,'INSERT OR IGNORE INTO storefront_events VALUES(?,?,?,?,?,?)',b.id,data.store.brand_id,b.session_id,b.event,text(b.product_id,80),now()).run();return json({ok:true});
 }
 if(action==='quote')return json(quoteOrder(data,b));
 const event=text(b.event_id,100);if(!/^[A-Za-z0-9_-]{8,100}$/.test(event))error(400,'Référence de commande requise');const mode=b.capture_mode==='abandoned'?'abandoned':'order',source=await one(db,'SELECT * FROM sources WHERE id=? AND active=1','storefront-'+data.store.brand_id);if(!source)error(503,'Réception de la boutique désactivée');
 const receipt=await one(db,'SELECT * FROM storefront_receipts WHERE brand_id=? AND event_id=?',source.brand_id,event);
 if(!Array.isArray(b.items)||!b.items.length||b.items.length>20)error(400,'Panier invalide');const counts=new Map();for(const item of b.items){if(!/^[A-Za-z0-9_-]{2,80}$/.test(item.offer_package||'')||!Number.isSafeInteger(item.count)||item.count<1||item.count>20)error(400,'Article invalide');counts.set(item.offer_package,(counts.get(item.offer_package)||0)+item.count);}
 const incomingItems=[...counts].sort(([a],[b])=>a.localeCompare(b)).map(([offer_package,count])=>({offer_package,count}));
 const canonical={name:text(b.name,100),phone:text(b.phone,40),city:text(b.city,80),address:text(b.address,500),notes:text(b.notes,1000),items:incomingItems,coupon_code:text(b.coupon_code,30).toUpperCase()};const requestHash=await digest(JSON.stringify(canonical));
 if(receipt&&receipt.request_hash!==requestHash)error(409,'Cette référence correspond à un autre panier.');
 const stored=receipt?JSON.parse(receipt.payload):null,quote=stored?{items:stored.items,prices:stored.store_quote.prices,shipping:stored.shipping_centimes,coupon_code:stored.coupon_code}:quoteOrder(data,b,{checkStock:mode!=='abandoned'});
 if(!receipt&&b.revision!==data.revision)error(409,'Les offres ont changé. Rechargez le panier pour vérifier les prix.');
 const phone=canonical.phone.replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-1632)).replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-1776)).replace(/[\s().-]/g,'');if(!/^(?:0|(?:\+|00)?212)[67]\d{8}$/.test(phone))error(400,'Téléphone marocain invalide');if(mode==='order'&&(canonical.name.length<2||canonical.city.length<2))error(400,'Nom et ville requis');
 const visitor=await visitorIdentity(req,env),payload=receipt?JSON.parse(receipt.payload):{...canonical,event_id:event,capture_mode:mode,cart_updated_at:Date.now(),shipping_centimes:quote.shipping,...Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','ad_id','ad_name','adset_id','adset_name','campaign_id','video_name','referrer','landing_page'].map(k=>[k,text(b[k],500)])),browser:/Edg/.test(req.headers.get('user-agent')||'')?'Edge':/Chrome|CriOS/.test(req.headers.get('user-agent')||'')?'Chrome':'Safari',store_quote:{revision:data.revision,prices:quote.prices}};
 payload.capture_mode=mode;payload.submitter=visitor.submitter;payload.turnstile_token=text(b.turnstile_token,2048);
 const identity=await deps.admitSubmitter(env,source,payload);
 if(!receipt&&mode==='order'){await q(db,'INSERT OR IGNORE INTO storefront_receipts VALUES(?,?,?,?,NULL,?)',source.brand_id,event,requestHash,JSON.stringify(payload),now()).run();const saved=await one(db,'SELECT request_hash FROM storefront_receipts WHERE brand_id=? AND event_id=?',source.brand_id,event);if(saved.request_hash!==requestHash)error(409,'Cette référence correspond à un autre panier.');}
 const result=await deps.ingest(db,source,payload,'source:'+source.id,{preventDuplicatePhone:true,storeOfferPrices:payload.store_quote.prices});await deps.recordSubmitter(db,source,result.order_id,identity,result.duplicate);
 if(mode==='order')await q(db,'UPDATE storefront_receipts SET order_id=? WHERE brand_id=? AND event_id=?',result.order_id,source.brand_id,event).run();
 if(result.deleted)error(409,'Commande supprimée. Contactez la boutique.');
 return json({...result,confirmation:'Nouveau',test:[payload.name,payload.city].some(v=>/\btest\b/i.test(v))},200,visitor.cookie?{'Set-Cookie':visitor.cookie}:{});
}
