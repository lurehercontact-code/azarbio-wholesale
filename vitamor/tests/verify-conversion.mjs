import {createServer} from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import handler from '../api/consumer-page.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PACKAGE||'@playwright/test');
process.env.THANNATECH_CRM_TOKEN='local-isolated-test-secret';
const root=fileURLToPath(new URL('../public/',import.meta.url));
let mode='success',requests=[];
const server=createServer(async(req,res)=>{
 if(req.url.startsWith('/api/consumer-lead')){
  let body='';for await(const c of req)body+=c;
  const data=JSON.parse(body);requests.push(data);res.setHeader('Content-Type','application/json');
  if(data.capture_mode==='abandoned'){res.end(JSON.stringify({ok:true,status:'Abandonné'}));return}
  if(mode==='failure'){res.statusCode=503;res.end(JSON.stringify({error:'crm_unavailable'}));return}
  res.end(JSON.stringify({ok:true,order_id:'synthetic-local-order'}));return;
 }
 const path=new URL(req.url,'http://local.test').pathname;
 if(path==='/'){handler(req,res);return}
 const file=root+path.slice(1);
 if(!file.startsWith(root)||!existsSync(file)){res.statusCode=404;res.end();return}
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':'image/webp');res.end(readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const lang of ['ar','fr'])for(const width of [320,390,430,1280]){
  const context=await browser.newContext({viewport:{width,height:844}});
  await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await context.addInitScript(()=>{window.events=[];window.gtag=(...args)=>window.events.push(args)});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/?lang='+lang);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Overflow '+lang+width);
  assert.equal(await page.locator('#timer').count(),0);
  assert.equal(await page.evaluate(()=>document.querySelector('#order').offsetTop<document.querySelector('#reviews').offsetTop),true);
  if(width<760){
   const image=await page.locator('.hero-media').boundingBox(),cta=await page.locator('.hero-quick .cta').boundingBox();
   assert.ok(image.y<450&&cta.y+cta.height<760,'First screen product and CTA '+lang+width);
  }
  if(width===390||width===1280)await page.screenshot({path:'conversion-'+lang+'-'+width+'.png'});
  for(const [key,price] of [['500G',199],['1KG',299],['2KG_PLUS_500G',499]]){
   await page.locator('[data-offer="'+key+'"]').click();
   assert.equal(await page.locator('[name="offer_package"]').inputValue(),key);
   assert.ok((await page.locator('#submit').innerText()).includes(String(price)));
   assert.equal(await page.locator('#sumPrice').innerText(),String(price));
  }
  await page.locator('#name').fill('Synthetic Test');await page.locator('#phone').fill('123');await page.locator('#city').fill('TEST');
  await page.locator('#submit').click();assert.equal(await page.locator('#thanks').isVisible(),false);
  requests=[];mode='failure';await page.locator('#phone').fill('0600000000');await page.locator('#submit').click();
  await page.locator('#error').waitFor({state:'visible'});
  assert.equal(await page.locator('#submit').isEnabled(),true);assert.equal(await page.locator('#thanks').isVisible(),false);
  const first=requests.find(x=>!x.capture_mode);assert.ok(first&&first.offer_package==='2KG_PLUS_500G');
  assert.equal(await page.evaluate(()=>window.events.filter(e=>e[1]==='generate_lead').length),0);
  mode='success';await page.locator('#submit').click();await page.locator('#thanks').waitFor({state:'visible'});
  assert.equal(requests.filter(x=>!x.capture_mode).at(-1).event_id,first.event_id);
  assert.equal(await page.evaluate(()=>window.events.filter(e=>e[1]==='generate_lead').length),1);
  assert.equal(await page.locator('#form').isVisible(),false);assert.deepEqual(errors,[]);
  const events=await page.evaluate(()=>window.events);
  assert.ok(events.some(e=>e[1]==='form_start'));assert.ok(events.some(e=>e[1]==='order_submit_error'));
  assert.ok(!JSON.stringify(events).includes('0600000000')&&!JSON.stringify(events).includes('Synthetic Test'));
  await context.close();console.log('PASS',lang,width,'layout, prices, validation, failure, stable retry, acknowledged Lead, no PII');
 }
}finally{await browser.close();await new Promise(r=>server.close(r))}
