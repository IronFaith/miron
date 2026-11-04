import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeLead } from '../dist/lead-summary.mjs';

const lead = {
  priority: 'Selling quickly', timeline: 'As soon as possible', propertyType: 'Single-family home',
  condition: 'Major repairs', size: '1,500–1,999 sq ft', occupancy: 'Tenants', relationship: 'I’m a co-owner',
  price: 'I’m not sure', address: '123 Example St, Austin, TX 78701',
  contact: { name: 'Demo Seller', method: 'email', email: 'seller@example.com', phone: '202-555-0123' }
};

test('priority follows timing and intent with explicit treatment of exploratory and unknown answers', () => {
  const cases = [
    ['As soon as possible', 'Selling quickly', 'hot'],
    ['Within 1–3 months', 'Getting the right price', 'hot'],
    ['Within 3–6 months', 'Avoiding repairs', 'warm'],
    ['I’m not sure yet', 'Choosing my move date', 'warm'],
    ['Later than 6 months', 'Selling quickly', 'cold'],
    ['As soon as possible', 'I’m just exploring', 'warm'],
    ['Within 1–3 months', 'I’m just exploring', 'warm'],
    ['Within 3–6 months', 'I’m just exploring', 'cold'],
    ['I’m not sure yet', 'I’m just exploring', 'cold']
  ];
  for (const [timeline, priority, expected] of cases) {
    const summary = summarizeLead({ ...lead, timeline, priority });
    assert.equal(summary.level, expected);
    assert.ok(summary.reasons.some(reason => reason.includes(timeline)));
    assert.ok(summary.reasons.some(reason => reason.includes(priority)));
  }
  assert.match(summarizeLead({ ...lead, priority: 'I’m just exploring' }).reasons.join(' '), /Confirm/);
});

test('property price, condition, occupancy, address, and seller identity do not inflate or reduce priority', () => {
  for (const level of [
    { timeline: 'As soon as possible', expected: 'hot' },
    { timeline: 'Within 3–6 months', expected: 'warm' },
    { timeline: 'Later than 6 months', expected: 'cold' }
  ]) {
    const baseline = summarizeLead({ ...lead, timeline: level.timeline });
    const changed = summarizeLead({ ...lead, timeline: level.timeline, price: '$750,000+', condition: 'Move-in ready', occupancy: 'It’s vacant', relationship: 'I represent an estate or trust', address: '456 Sample Rd, Boston, MA 02108', contact: { name: 'Another Seller', method: 'phone', phone: '202-555-0111' } });
    assert.equal(changed.level, level.expected);
    assert.deepEqual(changed.reasons, baseline.reasons);
  }
});

test('summary uses the selected contact, includes all quick answers, and gives answer-specific confirmation prompts', () => {
  const snapshot = structuredClone(lead);
  const summary = summarizeLead(lead);
  assert.deepEqual(summary.contact, { method: 'Email', value: 'seller@example.com' });
  assert.equal(summary.facts.length, 8);
  assert.equal(summary.address, lead.address);
  assert.match(summary.checks.find(check => check.id === 'authority').detail, /all owners/);
  const property = summary.checks.find(check => check.id === 'property').detail;
  assert.match(property, /repair scope/);
  assert.match(property, /lease details/);
  assert.match(property, /Discuss price expectations/);
  const ownerHelp = summarizeLead({ ...lead, relationship: 'I’m helping the owner', contact: { ...lead.contact, method: 'phone' } });
  assert.equal(ownerHelp.contact.value, lead.contact.phone);
  assert.match(ownerHelp.checks.find(check => check.id === 'authority').detail, /Speak with the owner/);
  assert.deepEqual(lead, snapshot);
});
