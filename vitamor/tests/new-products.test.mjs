import test from 'node:test';
import assert from 'node:assert/strict';
import pageHandler from '../api/consumer-page.js';
import leadHandler from '../api/consumer-lead.js';
process.env.THANNATECH_CRM_URL='https://vitamor-azarbio-crm.vitamor-azarbio.workers.dev/api/intake';
process.env.THANNATECH_CRM_SOURCE='site-vitamor-vercel';
process.env.THANNATECH_CRM_TOKEN='local-test-only-source-secret-at-least-32-chars';
function page(url){let html;pageHandler({url,headers:{host:'local.test'}},{setHeader(){},end(x){html=x}});return html}
test('four equal product cards precede configurable multi-item form in both languages',()=>{
 for(const lang of ['ar','fr']){
  const html=page('/?lang='+lang);
  assert.equal((html.match(/class="product-card"/g)||[]).length,4);
  assert.ok(html.indexOf('id="products"')<html.indexOf('id="form"'));
  assert.ok(html.includes('id="productSelect"')&&html.includes('id="offerSelect"')&&html.includes('id="cartLines"'));
  assert.ok(html.includes('name="items" value="[]"'));
  assert.ok(!html.includes('value="2KG_PLUS_500G" selected'));
  assert.ok(html.includes('229')&&html.includes('69'));
  for(const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new Function(script[1]);
 }
});
let n=0;
async function submit(items){
 let posted,called=0;const old=globalThis.fetch;
 globalThis.fetch=async(_,init)=>{called++;posted=JSON.parse(init.body);return Response.json({ok:true,status:'Envoyé',order_id:'synthetic-local',order_total:298})};
 const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(x){this.body=JSON.parse(x)}};
 try{await leadHandler({method:'POST',headers:{'content-type':'application/json','x-forwarded-for':'synthetic-'+(++n)},body:{name:'Synthetic test',phone:'0600000000',city:'Test city',items,event_id:'synthetic-event-001',client_elapsed_ms:5000,price:1,shipping:999}},res);return{res,posted,called}}finally{globalThis.fetch=old}
}
test('canonical mixed items and counts are forwarded with free shipping and trusted identity',async()=>{
 const {res,posted}=await submit([{offer_package:'TRIO_CROQUANT',count:1,price:1},{offer_package:'MARCHMILO_50G',count:1,price:1}]);
 assert.equal(res.statusCode,200);assert.equal(res.body.order_total,298);
 assert.deepEqual(posted.items,[{offer_package:'MARCHMILO_50G',count:1},{offer_package:'TRIO_CROQUANT',count:1}]);assert.equal(posted.shipping_centimes,0);assert.ok(posted.submitter.device_hash);
});
test('invalid items and excessive quantities never reach CRM',async()=>{
 for(const items of [[],[{offer_package:'UNKNOWN',count:1}],[{offer_package:'500G',count:0}],[{offer_package:'500G',count:21}],[{offer_package:'500G',count:'2'}],[{offer_package:'500G',count:15},{offer_package:'500G',count:15}]]){
  const {res,called}=await submit(items);assert.equal(res.statusCode,400);assert.equal(called,0);
 }
});
