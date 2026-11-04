import { summarizeLead } from '../dist/lead-summary.mjs';

const sample = {
  propertyType: 'Single-family home', condition: 'A few updates', size: '1,500–1,999 sq ft',
  occupancy: 'I live there', relationship: 'I’m the owner', price: '$300,000–$499,999',
  address: '123 Example St, Austin, TX 78701',
  contact: { name: 'Alex Sample', method: 'email', email: 'alex@example.com' }
};
const scenarios = [
  { level: 'hot', timeline: 'As soon as possible', priority: 'Selling quickly', explanation: 'Ready for a conversation soon.', caption: 'Hot: clear selling intent and a timeline within 3 months. Contact first.' },
  { level: 'warm', timeline: 'Within 3–6 months', priority: 'Choosing my move date', explanation: 'Interested, with more time to plan.', caption: 'Warm: interested in selling, but 3–6 months away. Agree on a follow-up date.' },
  { level: 'cold', timeline: 'Later than 6 months', priority: 'I’m just exploring', explanation: 'Early interest, without a near-term plan.', caption: 'Cold: more than 6 months away, or exploring without near-term plans. Ask when to reconnect.' }
].map(scenario => {
  const summary = summarizeLead({ ...sample, timeline: scenario.timeline, priority: scenario.priority });
  if (summary.level !== scenario.level) throw new Error('Video example no longer matches the site’s lead rules.');
  return { ...scenario, summary };
});
console.log(JSON.stringify({ scenarios }));
