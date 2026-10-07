import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const apiSource = readFileSync(new URL('../api/consumer-lead.js', import.meta.url), 'utf8').replace('export default async function handler', 'async function handler');
const pageSource = readFileSync(new URL('../api/consumer-page.js', import.meta.url), 'utf8');
test('unfinished carts stay separate from final orders', async () => {
  const calls = [];
  const handler = new Function('fetch','process','Buffer','AbortController','setTimeout','clearTimeout', apiSource + '\nreturn handler;')(
    async (_, options) => { calls.push(JSON.parse(options.body)); return { ok:true, json:async()=>({ok:true,status:'Abandonné'}) }; },
    {env:{MAKE_WEBHOOK_URL:'https://hook.eu1.make.com/test-only'}}, Buffer, AbortController, ()=>1, ()=>{});
  async function send(body, headers={}) {
    const res={headers:{},setHeader(k,v){this.headers[k]=v},end(v){this.body=JSON.parse(v)}};
    await handler({method:'POST',headers:{'content-type':'application/json',host:'vitamor-fruits.vercel.app',...headers},body},res);
    return res;
  }
  const draft={capture_mode:'abandoned',phone:'+212600000000',offer_package:'500G',client_elapsed_ms:100};
  let res=await send({...draft,name:'=1+1 "TEST"',city:'',address:''});
  assert.equal(res.statusCode,200);
  assert.equal(res.headers['Set-Cookie'],undefined);
  assert.equal(calls[0].business_type,'Panier abandonné / B2C');
  assert.equal(JSON.parse(calls[0].notes).values[0][4],'=1+1 "TEST"');
  assert.equal((await send({...draft,phone:'06'})).statusCode,400);
  assert.equal((await send(draft,{origin:'https://other.example'})).statusCode,403);
  const count=calls.length;
  assert.equal((await send({...draft,website:'bot'})).body.ignored,true);
  assert.equal(calls.length,count);
  res=await send({...draft,capture_mode:undefined,name:'TEST',city:'TEST',client_elapsed_ms:5000});
  assert.equal(res.statusCode,200);
  assert.ok(res.headers['Set-Cookie']);
  assert.notEqual(calls.at(-1).business_type,'Panier abandonné / B2C');
  assert.equal((await send(draft,{cookie:'vitamor_b2c_order_pending='+Date.now()})).statusCode,409);
});
test('phone input saves without a submit; duplicate snapshots and completed orders do not save', async()=>{
  const start=pageSource.indexOf('    // Save a contactable unfinished cart;');
  const end=pageSource.indexOf('    form.onsubmit=async function',start);
  assert.ok(start>0 && end>start);
  const code=pageSource.slice(start,end);
  const values={phone:'0600000000',name:'',city:'',address:'',offer_package:'500G'};
  const phoneInput={get value(){return values.phone}};
  const form={addEventListener(){}};
  let pending=false;
  const calls=[];
  const functions=new Function('form','phoneInput','hasPending','normalizeMoroccanMobile','started','submitting','FormData','location','document','window','fetch','setTimeout','clearTimeout',
    code+'\nreturn {saveUnfinishedCart,queueCartSave};')(
      form,phoneInput,()=>pending,v=>/^0[67]\d{8}$/.test(v)?v:'',Date.now(),false,
      class { entries(){return Object.entries(values)} },{search:''},
      {querySelectorAll(){return []},addEventListener(){}},{addEventListener(){}},
      async(_,opts)=>{calls.push(JSON.parse(opts.body));assert.equal(opts.keepalive,true);return{ok:true,json:async()=>({ok:true,status:'Abandonné'})}},
      ()=>1,()=>{});
  functions.queueCartSave();
  await functions.saveUnfinishedCart(false);
  assert.equal(calls.length,1);
  assert.equal(calls[0].phone,'0600000000');
  await functions.saveUnfinishedCart(false);
  assert.equal(calls.length,1);
  values.city='TEST';functions.queueCartSave();
  await functions.saveUnfinishedCart(false);
  assert.equal(calls.length,2);
  values.phone='06';await functions.saveUnfinishedCart(true);
  assert.equal(calls.length,2);
  values.phone='0700000000';pending=true;
  await functions.saveUnfinishedCart(true);
  assert.equal(calls.length,2);
});
test('Arabic and French notices exist and generated JavaScript parses',()=>{
  assert.ok(pageSource.includes('id="cartNotice"'));
  assert.ok(pageSource.includes('En saisissant votre numéro'));
  const html=pageSource.match(/String\.raw`([\s\S]*?)`;/)[1];
  for (const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) new Function(script[1]);
});
