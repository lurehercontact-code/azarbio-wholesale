// Server-only credentials. Every retry uses exactly the same event and payload.
export async function saveCRM(data){
 const endpoint=String(process.env.THANNATECH_CRM_URL||'').trim();
 const token=String(process.env.THANNATECH_CRM_TOKEN||'');
 const source=String(process.env.THANNATECH_CRM_SOURCE||'');
 if(endpoint!=='https://vitamor-azarbio-crm.vitamor-azarbio.workers.dev/api/intake'||token.length<32||!/^site-vitamor-vercel$/.test(source))return {ok:false,error:'service_not_configured'};
 const payload=JSON.stringify({...data,capture_mode:data.mode==='abandoned'?'abandoned':'order',cart_updated_at:data.updated_at,shipping_centimes:0});
 let error='receiver_unavailable';
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-CRM-Source':source},body:payload,signal:AbortSignal.timeout(8000),redirect:'error'});
   if(!response.ok){if(response.status>=500||response.status===429)continue;let result={};try{result=await response.json()}catch{}return {ok:false,error:response.status===409?(result.error==='duplicate_phone'?'duplicate_phone':'order_changed'):'receiver_rejected'};}
   let result;try{result=await response.json()}catch{return {ok:false,error:'receiver_invalid_response'}};
   if(result?.deleted)return {ok:false,error:'order_deleted'};
   if(result?.ok!==true||typeof result.order_id!=='string'||!result.order_id||!['Abandonné','Envoyé'].includes(result.status)||(data.mode==='order'&&(result.status!=='Envoyé'||!Number.isFinite(result.order_total))))return {ok:false,error:'write_not_confirmed'};
   return {...result,test:[data.name,data.city,data.address,data.notes].some(v=>/(?:^|[^\p{L}\p{N}_])test(?=$|[^\p{L}\p{N}_])/iu.test(String(v||'')))};
  }catch(e){error=e?.name==='TimeoutError'||e?.name==='AbortError'?'receiver_timeout':'receiver_network_error';}
 }
 return {ok:false,error};
}
