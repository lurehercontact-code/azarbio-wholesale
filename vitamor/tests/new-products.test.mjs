import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/consumer-page.js';
import {NEW_PRODUCT_DRAFTS,renderNewProductsPreview} from '../lib/new-products.js';
function page(url){let result;handler({url,headers:{host:'local.test'}},{setHeader(){},end(value){result=value}});return result}
test('new catalogue is preview-only and cannot submit unpriced products',()=>{
 assert.ok(!page('/').includes('id="new-products"'));
 for(const lang of ['ar','fr']){
  const html=page('/?lang='+lang+'&catalog=preview');
  assert.ok(html.includes('id="new-products"'));
  const section=renderNewProductsPreview(lang);
  assert.equal((section.match(/data-draft-product=/g)||[]).length,3);
  assert.ok(!section.includes('data-buy')&&!section.includes('data-offer')&&!section.includes('<button'));
  assert.ok(!section.includes('50g')&&!section.includes('100g'));
 }
 assert.ok(page('/?catalog=preview').includes('باك ثلاثي القرمشة'));
 assert.ok(page('/?lang=fr&catalog=preview').includes('Pack Trio Croquant'));
});
test('draft recipe counts packaged sweets once and fruits in grams without guessing prices',()=>{
 const pack=NEW_PRODUCT_DRAFTS.find(p=>p.code==='TRIO_CROQUANT');
 assert.deepEqual(pack.components,[{sku:'fruits-mix',quantity:500},{sku:'marchmilo-50g',quantity:1},{sku:'noga-100g',quantity:1}]);
 assert.ok(NEW_PRODUCT_DRAFTS.every(p=>p.price===null&&p.status==='draft'));
});
