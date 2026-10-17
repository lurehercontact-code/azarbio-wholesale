import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/consumer-lead.js';
process.env.THANNATECH_CRM_URL='https://vitamor-azarbio-crm.vitamor-azarbio.workers.dev/api/intake';
process.env.THANNATECH_CRM_SOURCE='site-vitamor-vercel';
process.env.THANNATECH_CRM_TOKEN='local-test-only-secret-at-least-32-characters';
let sequence=0;
async function submit(response,extra={}){
 const previous=globalThis.fetch;
 globalThis.fetch=async()=>typeof response==='function'?response():response;
 const res={headers:{},setHeader(k,v){this.headers[k]=v},end(v){this.body=JSON.parse(v)}};
 try{await handler({method:'POST',headers:{'content-type':'application/json','x-forwarded-for':'test-'+(++sequence)},body:{name:'Test only',phone:'0600000000',city:'Test city',offer_package:'1KG',client_elapsed_ms:10000,event_id:'test-event-0001',...extra}},res);return res;}finally{globalThis.fetch=previous;}
}
test('queued HTTP 200 does not confirm or set pending, retry can succeed',async()=>{
 const failed=await submit(new Response('Accepted'));assert.equal(failed.statusCode,502);assert.equal(failed.headers['Set-Cookie'],undefined);
 const retry=await submit(Response.json({ok:true,status:'Envoyé',order_id:'TEST-1',order_total:299}));assert.equal(retry.statusCode,200);assert.match(retry.headers['Set-Cookie'],/vitamor_b2c_order_pending_v2=/);
});
test('only the current receiver and completed order acknowledgement can confirm',async()=>{
 for(const body of [{ok:true,status:'Envoyé',order_id:'old'}, {ok:false}, {ok:true,receiver_version:2,status:'Abandonné'},null]){const r=await submit(Response.json(body));assert.equal(r.statusCode,502);assert.equal(r.headers['Set-Cookie'],undefined);}
});
test('a lost response is retried with the same CRM payload',async()=>{
 let attempts=0;const r=await submit(()=>{if(++attempts===1)throw new TypeError('network');return Response.json({ok:true,status:'Envoyé',order_id:'TEST-1',order_total:299,duplicate:true})});assert.equal(attempts,2);assert.equal(r.statusCode,200);assert.equal(r.body.duplicate,true);
});
test('a duplicate phone is rejected without a new success or pending cookie',async()=>{
 const r=await submit(Response.json({ok:false,error:'duplicate_phone'},{status:409}));assert.equal(r.statusCode,409);assert.equal(r.headers['Set-Cookie'],undefined);
});
test('upstream failures are bounded and cannot mark an order saved',async()=>{
 let attempts=0;const r=await submit(()=>{attempts++;return new Response('Unavailable',{status:503})});assert.equal(attempts,2);assert.equal(r.statusCode,502);assert.equal(r.headers['Set-Cookie'],undefined);
});
test('phone-only capture and completed captures do not set pending cookies',async()=>{
 for(const status of ['Abandonné','Envoyé']){const r=await submit(Response.json({ok:true,order_id:'cart-1',status}),{capture_mode:'abandoned',name:'',city:''});assert.equal(r.statusCode,200);assert.equal(r.headers['Set-Cookie'],undefined);}
});
