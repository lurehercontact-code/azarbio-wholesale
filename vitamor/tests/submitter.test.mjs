import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveSubmitter} from '../lib/submitter.js';
const key='synthetic-source-key-at-least-32-characters',now=Date.now();
const req=(ip='192.0.2.12',cookie='')=>({headers:{'x-vercel-forwarded-for':ip,'x-forwarded-for':'198.51.100.99',cookie}});
test('signed HttpOnly browser ID persists across phone changes and IP changes without reading submitted fields',()=>{
 const a=resolveSubmitter(req(),{key,now});assert.match(a.cookie,/Secure; HttpOnly; SameSite=Lax/);
 const b=resolveSubmitter({...req('192.0.2.12',a.cookie.split(';')[0]),body:{phone:'other',submitter:{device_hash:'spoof'}}},{key,now:now+1});
 assert.deepEqual(a.identity,b.identity);assert.equal(b.cookie,null);
 const changed=resolveSubmitter(req('192.0.2.13',a.cookie.split(';')[0]),{key,now:now+1});
 assert.equal(changed.identity.device_hash,a.identity.device_hash);assert.notEqual(changed.identity.ip_hash,a.identity.ip_hash);
 const other=resolveSubmitter(req(),{key,now});assert.notEqual(other.identity.device_hash,a.identity.device_hash);assert.equal(other.identity.ip_hash,a.identity.ip_hash);
 assert.equal(JSON.stringify(a.identity).includes('192.0.2'),false);
});
test('tampered and expired cookies rotate identity; forwarded IP body values cannot override the trusted header',()=>{
 const a=resolveSubmitter(req(),{key,now}),cookie=a.cookie.split(';')[0];
 const tampered=cookie.slice(0,-1)+(cookie.endsWith('0')?'1':'0');
 assert.notEqual(resolveSubmitter(req('192.0.2.12',tampered),{key,now:now+1}).identity.device_hash,a.identity.device_hash);
 assert.notEqual(resolveSubmitter(req('192.0.2.12',cookie),{key,now:now+181*86400000}).identity.device_hash,a.identity.device_hash);
 assert.equal(resolveSubmitter(req('not-an-ip'),{key,now}).identity.ip_hash,'');
});
