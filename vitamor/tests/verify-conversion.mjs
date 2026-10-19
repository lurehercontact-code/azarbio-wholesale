import {createServer} from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import handler from '../api/consumer-page.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PACKAGE||'@playwright/test');
process.env.THANNATECH_CRM_TOKEN='synthetic-local-only-secret';
const root=fileURLToPath(new URL('../public/',import.meta.url)),prices={'500G':199,'1KG':299,'2KG_PLUS_500G':499,MARCHMILO_50G:69,NOGA_100G:69,TRIO_CROQUANT:229};
let mode='success',requests=[];
const server=createServer(async(req,res)=>{
 if(req.url.startsWith('/api/consumer-lead')){let body='';for await(const c of req)body+=c;const d=JSON.parse(body);requests.push(d);res.setHeader('Content-Type','application/json');
 if(d.capture_mode==='abandoned'){res.end(JSON.stringify({ok:true,status:'Abandonné'}));return}
 if(mode==='failure'){res.statusCode=503;res.end(JSON.stringify({error:'crm_unavailable'}));return}
 res.end(JSON.stringify({ok:true,order_id:'synthetic-local-order',order_total:d.items.reduce((s,i)=>s+prices[i.offer_package]*i.count,0)}));return}
 const pathname=new URL(req.url,'http://local.test').pathname;
 if(pathname==='/'){handler(req,res);return}
 const path=root+pathname.slice(1);if(!path.startsWith(root)||!existsSync(path)){res.statusCode=404;res.end();return}
 res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':path.endsWith('.svg')?'image/svg+xml':'image/webp');res.end(readFileSync(path));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const lang of ['ar','fr'])for(const width of [320,390,430,1280]){
 const context=await browser.newContext({viewport:{width,height:844}});await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());await context.addInitScript(()=>{window.events=[];window.gtag=(...a)=>window.events.push(a)});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/?lang='+lang);
 assert.equal(await page.locator('.product-card').count(),4);assert.equal(await page.locator('#submit').isEnabled(),false);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Product overflow '+lang+width);
 if(width===390||width===1280)await page.screenshot({path:'storefront-'+lang+'-'+width+'.png'});
 await page.locator('[data-buy="500G"]').click();
 assert.deepEqual(JSON.parse(await page.locator('[name="items"]').inputValue()),[{offer_package:'500G',count:1}]);
 await page.locator('#cartLines select').selectOption('1KG');
 assert.equal(await page.locator('#sumPrice').innerText(),'299');
 await page.locator('#productSelect').selectOption('marsh');await page.locator('#itemCount').fill('2');await page.locator('#addItem').click();
 assert.equal(await page.locator('#sumPrice').innerText(),'437');
 await page.locator('#productSelect').selectOption('pack');await page.locator('#itemCount').fill('1');await page.locator('#addItem').click();
 assert.equal(await page.locator('#sumPrice').innerText(),'666');
 await page.locator('#cartLines .remove-item').first().click();
 assert.equal(await page.locator('#sumPrice').innerText(),'367');
 await page.locator('#cartLines input').first().fill('3');await page.locator('#cartLines input').first().press('Tab');
 assert.equal(await page.locator('#sumPrice').innerText(),'436');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Form overflow '+lang+width);
 if(width===390)await page.screenshot({path:'storefront-form-'+lang+'-390.png'});
 await page.locator('#name').fill('Synthetic Test');await page.locator('#phone').fill('123');await page.locator('#city').fill('TEST');
 await page.locator('#submit').click();assert.equal(await page.locator('#thanks').isVisible(),false);
 await page.locator('#phone').fill('0600000000');mode='failure';requests=[];
 await page.locator('#submit').click();await page.locator('#error').waitFor({state:'visible'});
 assert.equal(await page.locator('#submit').isEnabled(),true);assert.equal(await page.locator('#thanks').isVisible(),false);
 const first=requests.find(d=>!d.capture_mode);assert.ok(first&&first.items.length===2);
 assert.equal(await page.evaluate(()=>window.events.filter(e=>e[1]==='generate_lead').length),0);
 mode='success';await page.locator('#submit').click();await page.locator('#thanks').waitFor({state:'visible'});
 assert.equal(requests.filter(d=>!d.capture_mode).at(-1).event_id,first.event_id);
 assert.equal(await page.locator('#form').isVisible(),false);
 const lead=await page.evaluate(()=>window.events.filter(e=>e[1]==='generate_lead'));assert.equal(lead.length,1);assert.equal(lead[0][2].value,436);
 assert.deepEqual(errors,[]);await context.close();console.log('PASS',lang,width,'mixed cart, variants, quantities, totals, validation, error, stable retry, acknowledged Lead');
 }
}finally{await browser.close();await new Promise(r=>server.close(r))}
