import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync(new URL('../api/consumer-page.js', import.meta.url), 'utf8');
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
  const functions=new Function('form','phoneInput','hasPending','normalizeMoroccanMobile','started','submitting','FormData','location','document','window','fetch','setTimeout','clearTimeout','orderEventId','rememberPending',
    code+'\nreturn {saveUnfinishedCart,queueCartSave};')(
      form,phoneInput,()=>pending,v=>/^0[67]\d{8}$/.test(v)?v:'',Date.now(),false,
      class { entries(){return Object.entries(values)} },{search:''},
      {querySelectorAll(){return []},addEventListener(){}},{addEventListener(){}},
      async(_,opts)=>{calls.push(JSON.parse(opts.body));assert.equal(opts.keepalive,true);return{ok:true,json:async()=>({ok:true,status:'Abandonné'})}},
      ()=>1,()=>{},()=>'test-event-0001',()=>{});
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

