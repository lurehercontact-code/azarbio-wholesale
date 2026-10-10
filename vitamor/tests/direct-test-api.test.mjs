import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const src=await readFile(new URL('../api/direct-test-lead.js',import.meta.url),'utf8');
const {default:handler}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const base=()=>({mode:'order',event_id:'test-event-0001',updated_at:Date.now(),phone:'0600000000',offer_package:'1KG',name:'TEST',city:'Casablanca'});
async function submit(input,response){
 const old=globalThis.fetch;let called=false;
 globalThis.fetch=async()=>{called=true;return response;};
 const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.body=JSON.parse(v);}};
 try{await handler({method:'POST',headers:{'content-type':'application/json'},body:input},res);return {...res,called};}finally{globalThis.fetch=old;}
}
test('unconfigured destination cannot acknowledge an order',async()=>{delete process.env.DIRECT_SHEET_TEST_URL;delete process.env.DIRECT_SHEET_TEST_SECRET;const r=await submit(base());assert.equal(r.statusCode,503);assert.equal(r.called,false);});
test('Google error and Accepted response never confirm a sheet write',async()=>{
 process.env.DIRECT_SHEET_TEST_URL='https://script.google.com/macros/s/TEST_ONLY/exec';process.env.DIRECT_SHEET_TEST_SECRET='local-test-only-secret-at-least-32-characters';
 for(const response of [new Response('Accepted'),Response.json({ok:false}),Response.json({ok:true,status:'Abandonné'})]){const r=await submit(base(),response);assert.equal(r.statusCode,502);assert.equal(r.body.ok,false);}
});
test('validated acknowledgement confirms and real customer numbers are refused',async()=>{
 const good=await submit(base(),Response.json({ok:true,status:'Order saved',order_id:'TEST-ORDER-1'}));assert.equal(good.statusCode,200);assert.equal(good.body.order_id,'TEST-ORDER-1');
 const bad=await submit({...base(),phone:'0612345678'});assert.equal(bad.statusCode,400);assert.equal(bad.called,false);
});
