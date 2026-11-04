import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, validateQuestion, answerText, leadPayload, deliverLead } from '../dist/seller-questions.mjs';
const question = id => questions.find(item => item.id === id);

test('property answers require a real selection while unknown size and price can be skipped', () => {
  assert.ok(validateQuestion(question('address'), { address: '123' }));
  assert.equal(validateQuestion(question('address'), { address: '123 Example St, Austin, TX 78701' }), '');
  assert.ok(validateQuestion(question('propertyType'), { propertyType: 'unlisted value' }));
  assert.equal(validateQuestion(question('propertyType'), { propertyType: 'Single-family home' }), '');
  assert.equal(validateQuestion(question('layout'), { layout: {} }), '');
  assert.equal(validateQuestion(question('layout'), { layout: { beds: '3', baths: '2.5', sqft: '1600' } }), '');
  assert.ok(validateQuestion(question('layout'), { layout: { beds: '-1' } }));
  assert.ok(validateQuestion(question('layout'), { layout: { baths: '2.3' } }));
  assert.equal(validateQuestion(question('price'), { price: '' }), '');
  assert.ok(validateQuestion(question('price'), { price: '-200000' }));
  assert.equal(answerText(question('price'), { price: '250,000' }), '$250,000');
});

test('contact validation follows the selected method and excludes an abandoned contact value', () => {
  const contact = { name: 'Demo Seller', method: 'email', email: 'seller@example.com', phone: 'invalid' };
  assert.equal(validateQuestion(question('contact'), { contact }), '');
  assert.deepEqual(leadPayload({ contact }).contact, { name: 'Demo Seller', method: 'email', email: 'seller@example.com' });
  assert.ok(validateQuestion(question('contact'), { contact: { ...contact, email: 'bad@' } }));
  assert.ok(validateQuestion(question('contact'), { contact: { ...contact, method: 'phone' } }));
  assert.equal(validateQuestion(question('contact'), { contact: { ...contact, method: 'phone', phone: '(202) 555-0123' } }), '');
  assert.ok(validateQuestion(question('contact'), { contact: { ...contact, name: '' } }));
});

test('delivery only succeeds with explicit acceptance and preserves the request ID for retries', async () => {
  let calls = 0;
  const payload = { requestId: 'same-request', answers: { address: 'Demo property' }, contactConsent: true };
  const accepted = async (url, options) => {
    calls++;
    assert.equal(url, '/api/leads');
    assert.equal(options.method, 'POST');
    assert.equal(options.credentials, 'omit');
    assert.deepEqual(JSON.parse(options.body), payload);
    return { ok: true, json: async () => ({ accepted: true }) };
  };
  await assert.rejects(deliverLead('', payload, accepted));
  await assert.rejects(deliverLead('http://example.com/leads', payload, accepted));
  assert.equal(calls, 0);
  await assert.rejects(deliverLead('/api/leads', payload, async () => ({ ok: false })));
  await assert.rejects(deliverLead('/api/leads', payload, async () => ({ ok: true, json: async () => ({}) })));
  await assert.rejects(deliverLead('/api/leads', payload, async () => { throw new TypeError('network'); }));
  assert.deepEqual(await deliverLead('/api/leads', payload, accepted), { accepted: true });
  await deliverLead('/api/leads', payload, accepted);
  assert.equal(calls, 2);
});
