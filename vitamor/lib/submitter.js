import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {isIP} from 'node:net';
const COOKIE='__Host-thanna_visitor';
function mac(key,v){return createHmac('sha256',key).update(v).digest('hex');}
export function resolveSubmitter(req,{key=process.env.THANNATECH_CRM_TOKEN||'',now=Date.now()}={}){
 if(key.length<32)return {identity:null,cookie:null};
 const raw=String(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';
 let [device,expires,signature]=raw.split('.'),valid=false;
 if(/^[a-f0-9]{64}$/.test(device||'')&&/^\d{13}$/.test(expires||'')&&Number(expires)>now&&Number(expires)<=now+181*86400000&&/^[a-f0-9]{64}$/.test(signature||'')){
  valid=timingSafeEqual(Buffer.from(signature,'hex'),Buffer.from(mac(key,'visitor-cookie:'+device+'.'+expires),'hex'));
 }
 if(!valid){device=randomBytes(32).toString('hex');expires=String(now+180*86400000);signature=mac(key,'visitor-cookie:'+device+'.'+expires);}
 let ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'').split(',')[0].trim();
 if(!isIP(ip))ip='';else if(isIP(ip)===6){try{ip=new URL('http://['+ip+']/').hostname.toLowerCase();}catch{ip='';}}
 return {identity:{device_hash:mac(key,'visitor-device:'+device),ip_hash:ip?mac(key,'visitor-ip:'+ip):''},cookie:valid?null:COOKIE+'='+device+'.'+expires+'.'+signature+'; Path=/; Max-Age=15552000; Secure; HttpOnly; SameSite=Lax'};
}
export function setVisitorCookies(res,visitor,pending){
 const cookies=[visitor?.cookie,pending].filter(Boolean);if(cookies.length)res.setHeader('Set-Cookie',cookies.length===1?cookies[0]:cookies);
}
