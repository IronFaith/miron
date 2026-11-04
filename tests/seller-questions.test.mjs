import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, validateQuestion, answerText, leadPayload, deliverLead } from '../dist/seller-questions.mjs';
const question = id => questions.find(item => item.id === id);

test('quick choices accept listed ranges and unsure answers without written explanations', () => {
  assert.ok(validateQuestion(question('address'), { address: '123' }));
  assert.equal(validateQuestion(question('address'), { address: '123 Example St, Austin, TX 78701' }), '');
  for (const item of questions.filter(item => item.type === 'choice')) {
    assert.ok(validateQuestion(item, {}));
    assert.ok(validateQuestion(item, { [item.id]: 'unlisted value' }));
    for (const option of item.options) {
      const answers = { [item.id]: option };
      assert.equal(validateQuestion(item, answers), '');
      assert.equal(answerText(item, answers), option);
      assert.equal(leadPayload(answers)[item.id], option);
    }
  }
  assert.equal(validateQuestion(question('size'), { size: 'I’m not sure' }), '');
  assert.equal(validateQuestion(question('price'), { price: 'I’m not sure' }), '');
  assert.equal(answerText(question('price'), { price: '$150,000–$299,999' }), '$150,000–$299,999');
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
