import {createHmac} from 'node:crypto';

// Credentials remain server-side. Both attempts carry the same event and revision.
export async function saveDirect(data) {
  const endpoint=String(process.env.DIRECT_SHEET_URL||'').trim();
  const secret=String(process.env.DIRECT_SHEET_SECRET||process.env.DIRECT_SHEET_TEST_SECRET||'');
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)||secret.length<32)
    return {ok:false,error:'service_not_configured'};
  const timestamp=Date.now(),payload=JSON.stringify(data);
  const signature=createHmac('sha256',secret).update(timestamp+'.'+payload).digest('hex');
  const body=JSON.stringify({timestamp,payload,signature});
  let error='receiver_unavailable';
  for(let attempt=0;attempt<2;attempt++) {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try {
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body,signal:controller.signal,redirect:'follow'});
      if(!response.ok){error='receiver_http_error';if(response.status>=500)continue;return {ok:false,error};}
      let result;try{result=await response.json();}catch{return {ok:false,error:'receiver_invalid_response'};}
      if(result?.receiver_version!==2)return {ok:false,error:'receiver_update_required'};
      if(result.ok!==true){if(['busy','save_failed'].includes(result.error)){error='write_not_confirmed';continue;}return {ok:false,error:result.error==='duplicate_phone'?'duplicate_phone':'write_not_confirmed'};}
      const confirmed=data.mode==='order'?result.status==='Order saved'&&typeof result.order_id==='string':['Abandonné','Envoyé'].includes(result.status);
      if(!confirmed)return {ok:false,error:'write_not_confirmed'};
      return result;
    }catch(e){error=controller.signal.aborted||e?.name==='AbortError'?'receiver_timeout':'receiver_network_error';}
    finally{clearTimeout(timer);}
  }
  return {ok:false,error};
}
