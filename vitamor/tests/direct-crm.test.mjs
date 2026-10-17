import test from 'node:test';
import assert from 'node:assert/strict';
import {saveCRM} from '../lib/direct-crm.js';
const endpoint='https://vitamor-azarbio-crm.vitamor-azarbio.workers.dev/api/intake';
process.env.THANNATECH_CRM_URL=endpoint;process.env.THANNATECH_CRM_SOURCE='site-vitamor-vercel';process.env.THANNATECH_CRM_TOKEN='synthetic-local-only-token-not-for-production';
const data={mode:'order',event_id:'test-event-stable',updated_at:123,name:'Client TEST',phone:'0612345678',city:'Rabat',offer_package:'500G',ad_name:'Video fraise',utm_source:'facebook'};
test('direct server request keeps credentials private, passes attribution and retries one stable payload',async()=>{
 const old=globalThis.fetch,calls=[];globalThis.fetch=async(url,o)=>{calls.push({url,...o});if(calls.length===1)throw Error('response lost');return Response.json({ok:true,order_id:'crm-test-id',status:'Envoyé',order_total:199,duplicate:true})};
 try{const r=await saveCRM(data);assert.equal(r.ok,true);assert.equal(r.test,true);assert.equal(r.duplicate,true);assert.equal(calls.length,2);assert.equal(calls[0].body,calls[1].body);assert.equal(calls[0].url,endpoint);assert.equal(calls[0].headers['X-CRM-Source'],'site-vitamor-vercel');assert.match(calls[0].headers.Authorization,/^Bearer /);const p=JSON.parse(calls[0].body);assert.equal(p.capture_mode,'order');assert.equal(p.shipping_centimes,0);assert.equal(p.ad_name,data.ad_name);assert.equal(p.event_id,data.event_id);assert.equal(p.cart_updated_at,123);assert.ok(!calls[0].body.includes(process.env.THANNATECH_CRM_TOKEN));}finally{globalThis.fetch=old;}
});
test('deleted, malformed and unacknowledged orders never report success',async()=>{
 const old=globalThis.fetch;try{for(const value of [{ok:true,deleted:true,order_id:'x'},{ok:true,status:'Envoyé',order_id:'x'}, {ok:true,status:'Abandonné',order_id:'x'}, {ok:false},null]){globalThis.fetch=async()=>Response.json(value);assert.equal((await saveCRM(data)).ok,false);}}finally{globalThis.fetch=old;}
});
test('configuration fails closed and cannot forward credentials to another host',async()=>{
 const old=process.env.THANNATECH_CRM_URL;process.env.THANNATECH_CRM_URL='https://other.example/api/intake';try{assert.equal((await saveCRM(data)).error,'service_not_configured');}finally{process.env.THANNATECH_CRM_URL=old;}
});

test('a concurrent cart update retries the same final order, while a real payload conflict stays rejected',async()=>{
 const old=globalThis.fetch;let calls=0;try{
 globalThis.fetch=async()=>++calls===1?Response.json({ok:false,error:'Mise à jour concurrente. Réessayez avec le même identifiant'},{status:409}):Response.json({ok:true,order_id:'stable-id',status:'Envoyé',order_total:199});
 assert.equal((await saveCRM(data)).ok,true);assert.equal(calls,2);
 calls=0;globalThis.fetch=async()=>{calls++;return Response.json({ok:false,error:'Identifiant déjà utilisé pour une autre commande'},{status:409})};assert.equal((await saveCRM(data)).ok,false);assert.equal(calls,1);
 }finally{globalThis.fetch=old;}
});
