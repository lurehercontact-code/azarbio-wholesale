import {randomUUID} from 'node:crypto';
import {saveCRM} from '../lib/direct-crm.js';
import {resolveSubmitter,setVisitorCookies} from '../lib/submitter.js';

const OFFERS={'500G':199,'1KG':299,'2KG_PLUS_500G':499,'MARCHMILO_50G':69,'NOGA_100G':69,'TRIO_CROQUANT':229};
const WINDOW=600000;
const rates=globalThis.__vitamorDirectRates||new Map();
globalThis.__vitamorDirectRates=rates;
function clean(value,max=200){return String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);}
function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(body));}
function phoneNumber(value){const compact=String(value??'').trim().replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-1632)).replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-1776)).replace(/[\s()-]/g,'');const m=/^(?:0|(?:\+|00)?212)([67]\d{8})$/.exec(compact);return m?'0'+m[1]:'';}
export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{ok:false,error:'method_not_allowed'});}
  if(!String(req.headers['content-type']||'').toLowerCase().includes('application/json'))return send(res,415,{ok:false,error:'invalid_content_type'});
  let body;try{body=req.body&&typeof req.body==='object'&&!Buffer.isBuffer(req.body)?req.body:JSON.parse(String(req.body||''));}catch{return send(res,400,{ok:false,error:'invalid_json'});}
  if(!body||Array.isArray(body)||JSON.stringify(body).length>16000)return send(res,400,{ok:false,error:'invalid_json'});
  if(clean(body.website))return send(res,200,{ok:true,ignored:true});
  const origin=String(req.headers.origin||'');
  if(origin){try{if(new URL(origin).host!==req.headers.host)return send(res,403,{ok:false,error:'invalid_origin'});}catch{return send(res,403,{ok:false,error:'invalid_origin'});}}
  const now=Date.now(),mode=body.capture_mode==='abandoned'?'abandoned':'order';
  const phone=phoneNumber(body.phone),offer=clean(body.offer_package,24);
  if(!phone)return send(res,400,{ok:false,error:'invalid_phone'});
  const requested=Array.isArray(body.items)?body.items:[{offer_package:offer,count:1}];
  if(!requested.length||requested.length>20)return send(res,400,{ok:false,error:'invalid_items'});
  const counts=new Map();
  for(const item of requested){
   if(!item||typeof item!=='object'||!Object.hasOwn(OFFERS,item.offer_package)||!Number.isSafeInteger(item.count??1)||(item.count??1)<1||(item.count??1)>20)return send(res,400,{ok:false,error:'invalid_offer'});
   counts.set(item.offer_package,(counts.get(item.offer_package)||0)+(item.count??1));
  }
  if([...counts.values()].some(n=>n>20))return send(res,400,{ok:false,error:'invalid_quantity'});
  const items=[...counts].sort(([a],[b])=>a.localeCompare(b)).map(([offer_package,count])=>({offer_package,count}));
  const orderTotal=items.reduce((sum,item)=>sum+OFFERS[item.offer_package]*item.count,0);
  const name=clean(body.name,100),city=clean(body.city,80);
  if(mode==='order'&&name.length<2)return send(res,400,{ok:false,error:'invalid_name'});
  if(mode==='order'&&city.length<2)return send(res,400,{ok:false,error:'invalid_city'});
  const elapsed=Number(body.client_elapsed_ms||0);
  if(!Number.isFinite(elapsed)||elapsed<0||(mode==='order'&&elapsed>0&&elapsed<2200))return send(res,400,{ok:false,error:'too_fast'});
  const ip=clean(String(req.headers['x-forwarded-for']||'').split(',')[0]||req.socket?.remoteAddress||'unknown',80),key=mode+':'+ip;
  for(const [k,v]of rates)if(now-v.start>=WINDOW)rates.delete(k);
  const rate=rates.get(key)||{start:now,count:0};
  if(rate.count>=(mode==='order'?10:60))return send(res,429,{ok:false,error:'too_many_requests'});
  rate.count++;rates.set(key,rate);
  const event=clean(body.event_id,80)||'legacy-'+randomUUID();
  if(!/^[A-Za-z0-9_-]{8,80}$/.test(event))return send(res,400,{ok:false,error:'invalid_event_id'});
  const revision=Number(body.cart_updated_at);
  const data={mode,event_id:event,updated_at:Number.isFinite(revision)&&revision>0&&revision<=now+60000?Math.min(revision,now):now,phone,offer_package:offer,name,city,address:clean(body.address,220),utm_campaign:clean(body.utm_campaign,160),utm_source:clean(body.utm_source,120)||'Vitamor site',utm_content:clean(body.utm_content,160)};
  data.items=items;
  for(const key of ['utm_medium','utm_term','campaign_id','adset_id','adset_name','ad_id','ad_name','video_name','landing_page','referrer'])data[key]=clean(body[key],key==='landing_page'||key==='referrer'?600:200);
  data.utm_source=clean(body.utm_source,120);
  const ua=String(req.headers['user-agent']||'');data.browser=/Edg\//.test(ua)?'Edge':/CriOS|Chrome/.test(ua)?'Chrome':/FxiOS|Firefox/.test(ua)?'Firefox':/Safari/.test(ua)?'Safari':'unknown';
  const visitor=resolveSubmitter(req);data.submitter=visitor.identity;data.turnstile_token=typeof body.turnstile_token==='string'?body.turnstile_token.slice(0,2048):'';
  const result=await saveCRM(data);
  if(!result.ok)return send(res,result.error==='duplicate_phone'?409:['submitter_blocked','challenge_required'].includes(result.error)?403:result.error==='submitter_rate_limited'?429:result.error==='service_not_configured'?503:502,{ok:false,error:result.error,...(result.sitekey?{sitekey:result.sitekey}:{})});
  if(mode==='abandoned')setVisitorCookies(res,visitor);
  if(mode==='abandoned')return send(res,200,{ok:true,status:result.status});
  // Only a durable CRM acknowledgement may hide the form or trigger a Lead.
  setVisitorCookies(res,visitor,'vitamor_b2c_order_pending_v2='+now+'; Path=/; Max-Age=259200; HttpOnly; Secure; SameSite=Lax');
  return send(res,200,{ok:true,order_id:result.order_id,duplicate:result.duplicate===true,test:result.test===true,offer_package:offer,order_total:result.order_total??orderTotal,shipping_fee:0});
}
