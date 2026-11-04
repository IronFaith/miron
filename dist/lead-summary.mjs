import { questions, answerText, leadPayload } from './seller-questions.mjs';

const priorities = {
  hot: { label: 'Hot lead', action: 'Contact first', next: 'Confirm the selling timeline and arrange a property review.' },
  warm: { label: 'Warm lead', action: 'Follow up', next: 'Clarify the next step and agree on a follow-up date.' },
  cold: { label: 'Cold lead', action: 'Keep in touch', next: 'Ask when they would welcome another conversation.' }
};

export const priorityGuide = [
  { level: 'hot', text: 'Wants to sell within 3 months and is beyond exploring.' },
  { level: 'warm', text: 'Beyond exploring but 3–6 months away or timing is uncertain; also covers exploratory near-term interest.' },
  { level: 'cold', text: 'More than 6 months away, or exploring without a near-term timeline.' }
];

export function summarizeLead(answers) {
  const clean = leadPayload(answers);
  const nearTerm = ['As soon as possible', 'Within 1–3 months'].includes(clean.timeline);
  const exploring = clean.priority === 'I’m just exploring';
  const later = clean.timeline === 'Later than 6 months';
  const level = later || (exploring && !nearTerm) ? 'cold' : nearTerm && !exploring ? 'hot' : 'warm';
  const reasons = [
    `Preferred timing: ${clean.timeline || 'Not provided'}.`,
    `Selling priority: ${clean.priority || 'Not provided'}.`
  ];
  if (nearTerm && exploring) reasons.push('Near-term timing and exploring do not yet show firm intent. Confirm which best reflects their plans.');
  if (clean.timeline === 'I’m not sure yet') reasons.push('A selling date has not been chosen.');

  const authority = {
    'I’m the owner': 'Confirm ownership and anyone else who must approve the sale.',
    'I’m a co-owner': 'Confirm all owners are involved and who must approve the sale.',
    'I represent an estate or trust': 'Confirm who is authorized to act for the estate or trust.',
    'I’m helping the owner': 'Speak with the owner and confirm who can authorize a sale.',
    'I’m the listing agent': 'Confirm the seller’s authorization and the agent’s role.'
  }[clean.relationship] || 'Clarify their connection to the property and who can authorize a sale.';
  const propertyChecks = [
    clean.condition === 'Major repairs' ? 'Review the repair scope in person.' : clean.condition === 'I’m not sure' ? 'Confirm the property’s condition.' : 'Confirm the condition during a property review.',
    clean.occupancy === 'Tenants' ? 'Confirm occupancy, lease details, and access arrangements.' : 'Agree on access and move-out timing.',
    clean.price === 'I’m not sure' ? 'Discuss price expectations.' : 'Discuss the asking range after reviewing the property.'
  ];

  return {
    ...priorities[level], level, reasons,
    name: clean.contact.name || 'Seller',
    address: clean.address,
    contact: { method: clean.contact.method === 'phone' ? 'Phone call' : 'Email', value: clean.contact.phone || clean.contact.email || '' },
    facts: questions.filter(question => question.type === 'choice').map(question => ({ label: question.label, value: answerText(question, clean) })),
    checks: [
      { id: 'contact', label: 'Contact and intent confirmed', detail: 'Reach the seller using their chosen method; confirm their plans and timing.' },
      { id: 'authority', label: 'Authority to sell confirmed', detail: authority },
      { id: 'property', label: 'Property details reviewed', detail: propertyChecks.join(' ') }
    ]
  };
}
