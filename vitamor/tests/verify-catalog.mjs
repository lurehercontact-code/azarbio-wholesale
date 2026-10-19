import {createServer} from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import handler from '../api/consumer-page.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PACKAGE||'@playwright/test');
const root=fileURLToPath(new URL('../public/',import.meta.url));
const server=createServer((req,res)=>{
 const path=new URL(req.url,'http://local.test').pathname;
 if(path==='/'){handler(req,res);return}
 const file=root+path.slice(1);if(!file.startsWith(root)||!existsSync(file)){res.statusCode=404;res.end();return}
 res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.svg')?'image/svg+xml':'image/webp');res.end(readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const lang of ['ar','fr'])for(const width of [320,390,430,1280]){
  const context=await browser.newContext({viewport:{width,height:844}});
  await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/?lang='+lang+'&catalog=preview#new-products');
  await page.locator('#new-products').scrollIntoViewIfNeeded();
  await page.locator('#new-products img').evaluateAll(async images=>{await Promise.all(images.map(img=>img.decode()))});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('[data-draft-product]').count(),3);
  assert.equal(await page.locator('#new-products button,#new-products [data-buy],#new-products [data-offer]').count(),0);
  assert.ok(!/50g|100g/.test(await page.locator('[data-draft-product="TRIO_CROQUANT"]').innerText()));
  assert.deepEqual(errors,[]);
  if(width===390)await page.screenshot({path:'new-catalog-'+lang+'-390.png',fullPage:false});
  await context.close();console.log('PASS',lang,width,'preview, 3 images decoded, no overflow, no unpriced checkout, no errors');
 }
}finally{await browser.close();await new Promise(r=>server.close(r))}
