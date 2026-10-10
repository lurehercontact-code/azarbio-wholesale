import {createHmac} from 'node:crypto';

// Isolated acceptance test endpoint. The production consumer endpoint is unchanged.
export default async function handler(req,res) {
  const send=(status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));};
  if(req.method!=='POST')return send(405,{ok:false,error:'post_required'});
  if(!String(req.headers['content-type']||'').includes('application/json'))return send(415,{ok:false,error:'json_required'});
  const endpoint=String(process.env.DIRECT_SHEET_TEST_URL||''),secret=String(process.env.DIRECT_SHEET_TEST_SECRET||'');
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)||secret.length<32)return send(503,{ok:false,error:'test_not_configured'});
  let input;try{input=typeof req.body==='object'?req.body:JSON.parse(req.body);}catch{return send(400,{ok:false,error:'invalid_json'});}
  if(!input||!['0600000000','0700000000'].includes(input.phone))return send(400,{ok:false,error:'test_phone_only'});
  if(!['abandoned','order'].includes(input.mode)||!/^[A-Za-z0-9_-]{8,80}$/.test(input.event_id||'')||!['500G','1KG','2KG_PLUS_500G'].includes(input.offer_package))return send(400,{ok:false,error:'invalid_test'});
  const now=Date.now();if(!Number.isFinite(input.updated_at)||input.updated_at<=0||input.updated_at>now+60000)return send(400,{ok:false,error:'invalid_revision'});
  const clean=(v,n)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);
  const data={mode:input.mode,event_id:input.event_id,updated_at:input.updated_at,phone:input.phone,offer_package:input.offer_package,name:clean(input.name,100),city:clean(input.city,80),address:clean(input.address,220),utm_campaign:clean(input.utm_campaign,160),utm_source:clean(input.utm_source,120),utm_content:clean(input.utm_content,160)};
  if(data.mode==='order'&&(data.name.length<2||data.city.length<2))return send(400,{ok:false,error:'incomplete_order'});
  const payload=JSON.stringify(data),timestamp=now,signature=createHmac('sha256',secret).update(timestamp+'.'+payload).digest('hex');
  // Reuse the signed payload and event ID: a lost acknowledgement must not create another order.
  const body=JSON.stringify({timestamp,payload,signature});
  let failure='test_receiver_network_error';
  for(let attempt=0;attempt<2;attempt++) {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try {
      const upstream=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body,signal:controller.signal,redirect:'follow'});
      if(!upstream.ok) {
        failure='test_receiver_http_error';
        if(upstream.status>=500&&attempt===0)continue;
        return send(502,{ok:false,error:failure,upstream_status:upstream.status});
      }
      let result;try{result=await upstream.json();}catch{return send(502,{ok:false,error:'test_receiver_invalid_response'});}
      const expected=result&& (data.mode==='order'?result.status==='Order saved'&&typeof result.order_id==='string':['Abandonné','Envoyé'].includes(result.status));
      if(!result||result.ok!==true||!expected)return send(502,{ok:false,error:'test_write_not_confirmed'});
      return send(200,{ok:true,status:result.status,order_id:result.order_id,duplicate:result.duplicate===true});
    }catch(error){failure=controller.signal.aborted||error?.name==='AbortError'?'test_receiver_timeout':'test_receiver_network_error';}
    finally{clearTimeout(timer);}
  }
  return send(502,{ok:false,error:failure});
}
