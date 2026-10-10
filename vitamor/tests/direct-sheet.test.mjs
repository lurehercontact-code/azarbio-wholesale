import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHmac} from 'node:crypto';
const code=readFileSync(new URL('../google-apps-script/direct-test-receiver.gs',import.meta.url),'utf8');
function fixture(){
 const heads=['ID','Date de création','Statut','Nom','Téléphone','Ville','Adresse','Offre','Total (DH)','Campagne','Source','Annonce','Dernière saisie','Notes','Clé téléphone','Version auto','Snapshot auto','ID événement'];
 class Sheet{constructor(){this.rows=[heads.slice()];}getLastRow(){return this.rows.length;}getMaxRows(){return 1000;}
  getRange(r,c,h=1,w=1){const self=this;return{getValues(){return Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>self.rows[r-1+i]?.[c-1+j]??''));},setValues(v){v.forEach((row,i)=>{self.rows[r-1+i]??=Array(18).fill('');row.forEach((x,j)=>{self.rows[r-1+i][c-1+j]=typeof x==='string'&&x.startsWith("'")?x.slice(1):x;});});},setNumberFormat(){}};}}
 const sheets={'Commandes':new Sheet(),'Abandonnés':new Sheet()};const book={getSheetByName:n=>sheets[n]};let held=false;
 const ctx=vm.createContext({console,Date,JSON,SpreadsheetApp:{openById(){return book;},flush(){}},PropertiesService:{getScriptProperties(){return{getProperty(){return 'unit-test-only-key-not-used-in-production';}};}},LockService:{getScriptLock(){return{tryLock(){held=true;return true;},releaseLock(){held=false;}};}},Utilities:{Charset:{UTF_8:'UTF-8'},computeHmacSha256Signature(s,k){return Array.from(createHmac('sha256',k).update(s).digest());}},ContentService:{MimeType:{JSON:'json'},createTextOutput(s){return{setMimeType(){return JSON.parse(s);}};}}});
 vm.runInContext(code,ctx);
 function send(data,signature){const payload=JSON.stringify(data),timestamp=Date.now();return ctx.doPost({postData:{contents:JSON.stringify({payload,timestamp,signature:signature??createHmac('sha256','unit-test-only-key-not-used-in-production').update(timestamp+'.'+payload).digest('hex')})}});}
 return{ctx,sheets,send,held:()=>held};
}
const base=()=>({mode:'abandoned',event_id:'test-event-0001',updated_at:Date.now()-1000,phone:'0600000000',offer_package:'1KG',name:'',city:'',address:''});
test('phone-only capture updates one literal row and preserves manual name/address/status',()=>{
 const f=fixture(),d=base();assert.equal(f.send(d).status,'Abandonné');assert.equal(f.sheets['Abandonnés'].rows.length,2);
 const r=f.sheets['Abandonnés'].rows[1];r[3]='Nom modifié';r[6]='Adresse au téléphone';r[2]='À rappeler';
 assert.equal(f.send({...d,updated_at:d.updated_at+1,name:'Automatic name',city:'Casablanca',address:'Automatic address'}).ok,true);
 assert.equal(f.sheets['Abandonnés'].rows.length,2);assert.equal(r[4],'0600000000');
 const after=f.sheets['Abandonnés'].rows[1];assert.equal(after[3],'Nom modifié');assert.equal(after[5],'Casablanca');assert.equal(after[6],'Adresse au téléphone');assert.equal(after[2],'À rappeler');assert.equal(f.held(),false);
});
test('order retry is idempotent and late abandoned snapshots cannot reopen order',()=>{
 const f=fixture(),d=base();f.send(d);const order={...d,mode:'order',name:'Test client',city:'Rabat',updated_at:d.updated_at+10};
 const first=f.send(order),retry=f.send(order);assert.equal(first.status,'Order saved');assert.equal(retry.duplicate,true);assert.equal(first.order_id,retry.order_id);assert.equal(f.sheets.Commandes.rows.length,2);
 assert.equal(f.sheets['Abandonnés'].rows[1][2],'Envoyé');assert.equal(f.send({...d,updated_at:d.updated_at+20}).status,'Envoyé');assert.equal(f.sheets['Abandonnés'].rows[1][2],'Envoyé');
});
test('invalid signatures, live phone numbers and incomplete orders write nothing',()=>{
 const f=fixture(),d=base();assert.equal(f.send(d,'wrong-signature').ok,false);assert.equal(f.send({...d,phone:'0612345678'}).ok,false);assert.equal(f.send({...d,mode:'order'}).ok,false);assert.equal(f.sheets.Commandes.rows.length,1);assert.equal(f.sheets['Abandonnés'].rows.length,1);
});
test('stale revisions and duplicate pagehide events do not replace newest values',()=>{
 const f=fixture(),d=base();f.send({...d,name:'Newest',updated_at:d.updated_at+20});f.send({...d,name:'Old',updated_at:d.updated_at+1});f.send({...d,name:'Duplicate',updated_at:d.updated_at+20});assert.equal(f.sheets['Abandonnés'].rows[1][3],'Newest');assert.equal(f.sheets['Abandonnés'].rows.length,2);
});
test('formula-like customer text is written as a literal',()=>{
 const f=fixture(),d=base();assert.equal(f.ctx.directLiteral_('=1+1'),"'=1+1");f.send({...d,name:'=1+1',city:'"City"'});assert.equal(f.sheets['Abandonnés'].rows[1][3],'=1+1');
});
