import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const packet=path.dirname(fileURLToPath(import.meta.url)),target=process.cwd(),apply=process.argv.includes('--apply');
const pkg=JSON.parse(fs.readFileSync(path.join(target,'package.json'),'utf8'));if(pkg.name!=='vitamor-azarbio-crm')throw Error('Run from the existing cod-crm-cloudflare repository.');
const changes=new Map();
function change(file,fn){const location=path.join(target,file),before=fs.readFileSync(location,'utf8');if(before.includes("from './storefront.js'")||file==='public/app.js'&&before.includes("from './boutiques.js'"))throw Error('Storefront integration already present: '+file);changes.set(file,fn(before));}
function once(source,before,after){if(source.split(before).length!==2)throw Error('Expected one integration anchor: '+before.slice(0,100));return source.replace(before,after);}
change('src/domain.js',s=>{s=once(s,'shipping]));',"shipping,...(options.storeOfferPrices?[Object.entries(options.storeOfferPrices).sort(([a],[b])=>a.localeCompare(b))]:[])]));");return once(s,'  if(offer.is_bundle){',"  const storePrice=options.storeOfferPrices?.[offer.external_code];\n  if(storePrice!==undefined){if(!source.id.startsWith('storefront-')||actor!=='source:'+source.id||!Number.isSafeInteger(storePrice)||storePrice<0||storePrice>100000000)fail(403,'Tarif boutique non autorisé');offer.price=storePrice;}\n  if(offer.is_bundle){");});
change('src/operations.js',s=>"import {boutiquesAPI} from './storefront.js';\n"+once(s," if(p==='/api/order-alerts'"," if(p.startsWith('/api/boutiques'))return boutiquesAPI(req,env,url,u,body);\n if(p==='/api/order-alerts'"));
change('src/worker.js',s=>{
 s="import {storefrontPublic} from './storefront.js';\n"+s;
 s=once(s,' const db=env.DB,path=url.pathname,method=req.method;'," const db=env.DB,path=url.pathname,method=req.method;\n if(path.startsWith('/api/storefront/')){const result=await storefrontPublic(req,env,url,{body,ingest,admitSubmitter,recordSubmitter});if(result!==undefined)return result;}");
 s=once(s,'(intake|orders|sheets|loyalty)','(intake|orders|sheets|loyalty|storefront)');
 s=once(s,'const r=await env.ASSETS.fetch(req),h=new Headers(r.headers);',"const shop=/^\\/shop\\/[a-z0-9-]+(?:\\/.*)?$/.test(url.pathname),assetRequest=shop?new Request(new URL('/store.html',url),req):req;\n   const r=await env.ASSETS.fetch(assetRequest),h=new Headers(r.headers);");
 s=once(s,"h.set('X-Content-Type-Options','nosniff');h.set('Referrer-Policy'", "if(shop)h.set('Content-Security-Policy',\"default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://connect.facebook.net https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms; style-src 'self'; img-src 'self' data: https:; media-src 'self' blob: https:; connect-src 'self' https://challenges.cloudflare.com https://www.facebook.com https://www.google-analytics.com https://region1.google-analytics.com https://*.clarity.ms; frame-src 'self' https://challenges.cloudflare.com; frame-ancestors 'self'; base-uri 'none'; form-action 'self'\");\n   h.set('X-Content-Type-Options','nosniff');h.set('Referrer-Policy'");return s;
});
change('public/app.js',s=>{
 s="import {renderBoutiques} from './boutiques.js';\n"+s;s=once(s,"['Administration',[['settings'","['Administration',[['boutiques','Gestion des boutiques'],['settings'");
 s=once(s,'async function render(){',"async function boutiquesView(){shell('Gestion des boutiques','Produits, offres, apparence et commandes dans un seul espace.');await renderBoutiques({host:$('#content'),api,toast,boot});}\nasync function render(){");
 s=once(s,"configureWorkspace(workspaceContext());if(view==='protection')","configureWorkspace(workspaceContext());if(view==='boutiques')return boutiquesView();if(view==='protection')");
 for(const anchor of ['function login(){','async function unlockScreen(status){'])s=once(s,anchor,anchor+"document.querySelectorAll('.boutique-preview[open]').forEach(d=>d.close());");return s;
});
change('public/index.html',s=>once(s,'<link rel="stylesheet" href="/order-workspace.css">','<link rel="stylesheet" href="/order-workspace.css"><link rel="stylesheet" href="/boutiques.css">'));
const files=['src/storefront.js','src/storefront-config.js','public/store.html','public/store.js','public/store.css','public/store-cart.js','public/boutiques.js','public/boutiques.css','migrations/0017_storefront_admin.sql','tests/storefront.test.mjs','tests/fixtures/core-schema.sql'];
for(const file of files){if(fs.existsSync(path.join(target,file)))throw Error('Target already exists; review before integrating: '+file);changes.set(file,fs.readFileSync(path.join(packet,file)));}
for(const file of fs.readdirSync(path.join(packet,'public/store-assets')))changes.set('public/store-assets/'+file,fs.readFileSync(path.join(packet,'public/store-assets',file)));
console.log((apply?'Applying':'Validated')+' '+changes.size+' files. Existing stock, domains and orders are not changed by this installer.');
if(apply)for(const [file,content]of changes){const dst=path.join(target,file);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,content);}
if(!apply)console.log('Re-run with --apply only in the clean CRM checkout, then run npm test and wrangler deploy --dry-run. Migration 0017 and deployment are separate steps.');
