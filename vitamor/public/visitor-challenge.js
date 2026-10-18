(()=>{
 let loading;
 function load(){if(window.turnstile)return Promise.resolve();if(loading)return loading;loading=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.onload=resolve;s.onerror=()=>{loading=null;reject(Error('challenge_unavailable'));};document.head.append(s);});return loading;}
 async function challenge(sitekey){
  await load();return new Promise((resolve,reject)=>{
   const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;background:#0008;display:grid;place-items:center;z-index:10000';
   const box=document.createElement('div');box.style.cssText='background:white;border-radius:16px;padding:24px;max-width:95vw';box.dir='rtl';box.innerHTML='<p>تأكيد بسيط قبل تسجيل الطلب</p><div id="thanna-check"></div><button type="button">إلغاء</button>';overlay.append(box);document.body.append(overlay);
   let widget;const finish=(token,error)=>{if(widget!==undefined)window.turnstile.remove(widget);overlay.remove();error?reject(Error(error)):resolve(token);};
   box.querySelector('button').onclick=()=>finish(null,'challenge_cancelled');
   widget=window.turnstile.render(box.querySelector('#thanna-check'),{sitekey,action:'order',callback:token=>finish(token),'error-callback':()=>finish(null,'challenge_unavailable'),'expired-callback':()=>finish(null,'challenge_expired')});
  });
 }
 window.thannaSubmit=async data=>{
  const send=body=>fetch('/api/consumer-lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  let response=await send(data);
  if(response.status===403){const result=await response.clone().json();if(result.error==='challenge_required'&&typeof result.sitekey==='string'){const token=await challenge(result.sitekey);response=await send({...data,turnstile_token:token});}}
  return response;
 };
})();
