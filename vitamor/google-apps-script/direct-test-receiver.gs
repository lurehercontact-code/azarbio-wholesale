// TEST DESTINATION ONLY. No reads or writes to the production CRM.
const DIRECT_TEST_SHEET_ID = '1AsnEnuC38D3izEwHxuaRp4tV4zAufOGwKN_XtI9tBVI';
const DIRECT_HEADERS = ['ID','Date de création','Statut','Nom','Téléphone','Ville','Adresse','Offre','Total (DH)','Campagne','Source','Annonce','Dernière saisie','Notes','Clé téléphone','Version auto','Snapshot auto','ID événement'];
const DIRECT_OFFERS = {'500G':{label:'500 غرام',total:199},'1KG':{label:'1 كيلو',total:299},'2KG_PLUS_500G':{label:'2 كيلو + 500غ مجاناً',total:499}};

function initializeDirectTest() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('DIRECT_SHEET_SECRET')) props.setProperty('DIRECT_SHEET_SECRET', Utilities.getUuid() + Utilities.getUuid());
  const book = SpreadsheetApp.openById(DIRECT_TEST_SHEET_ID);
  for (const name of ['Commandes','Abandonnés']) {
    const sheet = book.getSheetByName(name);
    if (!sheet || JSON.stringify(sheet.getRange(1,1,1,18).getValues()[0]) !== JSON.stringify(DIRECT_HEADERS)) throw new Error('schema_mismatch');
    sheet.hideColumns(15,4);
  }
  book.getSheetByName('Guide').getRange('B2').setValue('Initialisé ; déploiement et test HTTP encore nécessaires');
  // Read the secret ONLY in Apps Script Project settings, and copy it directly
  // to Vercel's encrypted environment variable. Never paste it in chat or Git.
}

function directJson_(body) { return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON); }
function directHmac_(text, secret) {
  return Utilities.computeHmacSha256Signature(text, secret, Utilities.Charset.UTF_8).map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
}
function directSame_(a,b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0; for (let i=0;i<a.length;i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function doGet() { return directJson_({ok:false,error:'post_required',service:'vitamor-direct-test'}); }
function doPost(e) {
  try {
    if (!e || !e.postData || e.postData.contents.length > 20000) return directJson_({ok:false,error:'invalid_request'});
    const envelope = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('DIRECT_SHEET_SECRET');
    const timestamp = Number(envelope.timestamp);
    if (!secret || !Number.isFinite(timestamp) || Math.abs(Date.now()-timestamp)>300000 || typeof envelope.payload !== 'string') return directJson_({ok:false,error:'unauthorized'});
    if (!directSame_(directHmac_(String(timestamp)+'.'+envelope.payload,secret),envelope.signature)) return directJson_({ok:false,error:'unauthorized'});
    const data = directValidate_(JSON.parse(envelope.payload));
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return directJson_({ok:false,error:'busy'});
    try { return directJson_(directSave_(SpreadsheetApp.openById(DIRECT_TEST_SHEET_ID),data)); }
    finally { lock.releaseLock(); }
  } catch (_) { return directJson_({ok:false,error:'save_failed'}); }
}
function directText_(v,max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max); }
function directValidate_(input) {
  // This first deployment accepts fictional test contacts only.
  const phone = directText_(input.phone,20);
  if (!['0600000000','0700000000'].includes(phone)) throw new Error('test_phone_only');
  if (!['abandoned','order'].includes(input.mode)) throw new Error('invalid_mode');
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(input.event_id || '')) throw new Error('invalid_event_id');
  const offer = DIRECT_OFFERS[input.offer_package]; if (!offer) throw new Error('invalid_offer');
  const name = directText_(input.name,100), city = directText_(input.city,80);
  if (input.mode === 'order' && (name.length < 2 || city.length < 2)) throw new Error('incomplete_order');
  const revision = Number(input.updated_at), now = Date.now();
  if (!Number.isFinite(revision) || revision <= 0 || revision > now+60000) throw new Error('invalid_revision');
  return {mode:input.mode,event_id:input.event_id,revision:revision,name:name,phone:phone,city:city,
    address:directText_(input.address,220),offer:offer.label,total:offer.total,
    campaign:directText_(input.utm_campaign,160),source:directText_(input.utm_source,120),ad:directText_(input.utm_content,160)};
}
function directRows_(sheet) {
  if (JSON.stringify(sheet.getRange(1,1,1,18).getValues()[0]) !== JSON.stringify(DIRECT_HEADERS)) throw new Error('schema_mismatch');
  const last = sheet.getLastRow(); return last > 1 ? sheet.getRange(2,1,last-1,18).getValues() : [];
}
function directFind_(rows,col,value) { return rows.findIndex(r=>String(r[col]) === value); }
function directSnapshot_(data) { return {name:data.name,phone:data.phone,city:data.city,address:data.address,offer:data.offer,total:data.total}; }
function directNewRow_(data,status) {
  const now = new Date();
  return [(data.mode==='order'?'TEST-ORDER-':'TEST-CART-')+data.event_id,now,status,data.name,data.phone,data.city,data.address,data.offer,data.total,data.campaign,data.source,data.ad,new Date(data.revision),'TEST — aucune expédition',data.phone,data.revision,JSON.stringify(directSnapshot_(data)),data.event_id];
}
function directLiteral_(v) { return typeof v==='string' && /^[=+\-@]/.test(v) ? "'"+v : v; }
function directWrite_(sheet,index,row) {
  const rowNumber = index+2;
  if (rowNumber > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(),100);
  sheet.getRange(rowNumber,5).setNumberFormat('@');
  sheet.getRange(rowNumber,15).setNumberFormat('@');
  sheet.getRange(rowNumber,1,1,18).setValues([row.map(directLiteral_)]);
  sheet.getRange(rowNumber,2).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(rowNumber,13).setNumberFormat('dd/MM/yyyy HH:mm:ss');
}
function directUpdateCart_(sheet,rows,index,data,completed) {
  const row=rows[index].slice(); while(row.length<18)row.push('');
  if (!completed && Number(row[15])>=data.revision) return;
  let before={}; try { before=JSON.parse(row[16]||'{}'); } catch (_) {}
  const snapshot=directSnapshot_(data), fields={name:3,phone:4,city:5,address:6,offer:7,total:8};
  for (const key of Object.keys(fields)) { const c=fields[key]; if(row[c] === before[key])row[c]=snapshot[key]; }
  if(completed && ['Abandonné','Nouveau','En attente',''].includes(row[2]))row[2]='Envoyé';
  row[12]=new Date(Math.max(data.revision,Number(row[15])||0));row[15]=Math.max(data.revision,Number(row[15])||0);row[16]=JSON.stringify(snapshot);
  directWrite_(sheet,index,row);
}
function directSave_(book,data) {
  const orders=book.getSheetByName('Commandes'),carts=book.getSheetByName('Abandonnés');
  const orderRows=directRows_(orders),cartRows=directRows_(carts);
  const cartIndex=directFind_(cartRows,14,data.phone);
  if(data.mode==='abandoned') {
    // A delayed pagehide snapshot cannot reopen a completed contact.
    const saved=orderRows.some(r=>String(r[14])===data.phone);
    if(cartIndex>=0)directUpdateCart_(carts,cartRows,cartIndex,data,saved);
    else if(!saved)directWrite_(carts,cartRows.length,directNewRow_(data,'Abandonné'));
    SpreadsheetApp.flush();
    return {ok:true,status:saved?'Envoyé':'Abandonné',duplicate:cartIndex>=0};
  }
  const orderIndex=directFind_(orderRows,17,data.event_id);
  if(orderIndex>=0 && String(orderRows[orderIndex][14])!==data.phone)throw new Error('event_conflict');
  const row=orderIndex>=0?orderRows[orderIndex]:directNewRow_(data,'Nouveau');
  if(orderIndex<0)directWrite_(orders,orderRows.length,row);
  if(cartIndex>=0)directUpdateCart_(carts,cartRows,cartIndex,data,true);
  SpreadsheetApp.flush();
  return {ok:true,status:'Order saved',order_id:String(row[0]),duplicate:orderIndex>=0};
}
