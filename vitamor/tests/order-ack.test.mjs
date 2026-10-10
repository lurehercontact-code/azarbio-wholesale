import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../api/consumer-lead.js', import.meta.url), 'utf8');
const { default: handler } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
process.env.MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/test-only-not-called';
let sequence = 0;
function request(phone) {
  return { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': 'test-' + (++sequence) },
    body: { name: 'Test only', phone, city: 'Test city', offer_package: '1KG', client_elapsed_ms: 10000 } };
}
async function submit(phone, response) {
  const original = globalThis.fetch;
  globalThis.fetch = async () => response;
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = JSON.parse(body); } };
  try { await handler(request(phone), res); return res; }
  finally { globalThis.fetch = original; }
}
test('queued HTTP 200 does not confirm, set pending cookie, or block retry', async () => {
  const failed = await submit('0600000001', new Response('Accepted', { status: 200 }));
  assert.equal(failed.statusCode, 502);
  assert.equal(failed.headers['Set-Cookie'], undefined);
  const retry = await submit('0600000001', Response.json({ ok: true }));
  assert.equal(retry.statusCode, 200);
  assert.match(retry.headers['Set-Cookie'], /vitamor_b2c_order_pending=/);
});
test('only a completed order acknowledgement is accepted', async () => {
  for (const body of [{ ok: false }, { ok: true, ignored: true }, { ok: true, status: 'Abandonné' }, null]) {
    const res = await submit('0600000002', Response.json(body));
    assert.equal(res.statusCode, 502);
    assert.equal(res.headers['Set-Cookie'], undefined);
  }
});
test('full webhook queue fails without marking pending', async () => {
  const res = await submit('0600000003', new Response('Queue is full', { status: 400 }));
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.error, 'upstream_error');
  assert.equal(res.headers['Set-Cookie'], undefined);
});
