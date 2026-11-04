export const questions = [
  { id: 'address', title: 'Where’s the home you’d like to sell?', help: 'Start with the property address, including city, state, and ZIP code.', phase: 'Your home', type: 'address', label: 'Property address' },
  { id: 'propertyType', title: 'What kind of property is it?', help: 'Choose the closest match. We’ll talk through the details later.', phase: 'Your home', type: 'choice', label: 'Property type', options: ['Single-family home', 'Townhouse', 'Condo', '2–4 unit property', 'Manufactured home', 'Something else'] },
  { id: 'layout', title: 'Tell us a little about the space.', help: 'Approximate is fine. Leave anything you’re unsure about blank.', phase: 'Your home', type: 'layout', label: 'Size and layout', optional: true },
  { id: 'condition', title: 'How would you describe its condition?', help: 'An honest starting point helps us understand the work a home may need.', phase: 'A few details', type: 'condition', label: 'Condition', options: ['Ready to move into', 'Mostly cosmetic updates', 'Needs significant repairs', 'I’m not sure yet'] },
  { id: 'occupancy', title: 'Who’s living there right now?', help: 'This helps us plan access and discuss a realistic handover.', phase: 'A few details', type: 'choice', label: 'Occupancy', options: ['I live there', 'Tenants live there', 'It’s vacant', 'Family or someone else', 'It’s a short-term rental'] },
  { id: 'relationship', title: 'What’s your connection to the home?', help: 'So we know who to include in the conversation. No documents needed here.', phase: 'A few details', type: 'choice', label: 'Connection to the property', options: ['I’m the owner', 'I’m a co-owner', 'I represent an estate or trust', 'I’m helping the owner', 'I’m the listing agent', 'Something else'] },
  { id: 'timeline', title: 'When would you like to sell?', help: 'This is your preferred timing, not a commitment to a closing date.', phase: 'Your plans', type: 'choice', label: 'Preferred timing', options: ['As soon as practical', 'Within 1–3 months', 'Within 3–6 months', 'Later than 6 months', 'I’m just exploring'] },
  { id: 'priority', title: 'What matters most to you?', help: 'Choose the one thing that would make this sale easier.', phase: 'Your plans', type: 'choice', label: 'Selling priority', options: ['Moving on quickly', 'Avoiding repairs', 'A clear, predictable process', 'Getting the right price', 'Coordinating a move', 'Still figuring it out'] },
  { id: 'price', title: 'Do you have a price in mind?', help: 'Optional. A rough target is helpful, but you don’t need to know your home’s value to start.', phase: 'Your plans', type: 'price', label: 'Price expectation', optional: true },
  { id: 'contact', title: 'How can we get in touch?', help: 'One contact method is enough. You’ll review everything before the next step.', phase: 'The last detail', type: 'contact', label: 'Contact details' }
];

const text = value => String(value ?? '').trim();
const optionalNumber = (value, max, step = 1) => {
  if (!text(value)) return true;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= max && Math.abs(number / step - Math.round(number / step)) < 0.00001;
};

export function validateQuestion(question, answers) {
  const value = answers[question.id];
  if (question.type === 'address') return text(value).length >= 10 && text(value).length <= 240 ? '' : 'Please enter the street address, city, state, and ZIP code.';
  if (question.type === 'layout') {
    const layout = value || {};
    return optionalNumber(layout.beds, 50) && optionalNumber(layout.baths, 50, .5) && optionalNumber(layout.sqft, 1000000) ? '' : 'Use whole numbers for bedrooms and square feet, and whole or half numbers for bathrooms.';
  }
  if (question.type === 'price') return !text(value) || (/^[\d,]+$/.test(text(value)) && Number(text(value).replaceAll(',', '')) > 0 && Number(text(value).replaceAll(',', '')) <= 1000000000) ? '' : 'Enter a positive dollar amount, or leave this blank if you’re unsure.';
  if (question.type === 'contact') {
    const contact = value || {};
    if (text(contact.name).length < 2 || text(contact.name).length > 100) return 'Please enter your name.';
    if (contact.method === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(contact.email)) && text(contact.email).length <= 254 ? '' : 'Please enter a valid email address.';
    if (contact.method === 'phone') {
      const number = text(contact.phone);
      const digits = number.replace(/\D/g, '');
      return /^[+\d\s().-]+$/.test(number) && digits.length >= 10 && digits.length <= 15 ? '' : 'Please enter a phone number with area code.';
    }
    return 'Choose email or phone so we know how to reach you.';
  }
  if (!question.options.includes(value)) return 'Please choose an option to continue.';
  if (question.type === 'condition' && text(answers.repairNotes).length > 600) return 'Please keep repair details to 600 characters.';
  return '';
}

export function answerText(question, answers) {
  const value = answers[question.id];
  if (question.type === 'layout') {
    return [[value?.beds, 'bedrooms'], [value?.baths, 'bathrooms'], [value?.sqft, 'sq ft']].filter(([v]) => text(v)).map(([v, label]) => `${v} ${label}`).join(' · ') || 'Not sure yet';
  }
  if (question.type === 'contact') return `${text(value?.name)} · ${value?.method === 'phone' ? text(value?.phone) : text(value?.email)}`;
  if (question.type === 'price') return text(value) ? `$${Number(text(value).replaceAll(',', '')).toLocaleString('en-US')}` : 'Open to discussing';
  if (question.type === 'condition') return [text(value), text(answers.repairNotes)].filter(Boolean).join(' — ');
  return text(value);
}

export function leadPayload(answers) {
  const result = Object.fromEntries(questions.map(question => [question.id, answers[question.id] ?? '']));
  result.repairNotes = text(answers.repairNotes);
  const contact = answers.contact || {};
  result.contact = { name: text(contact.name), method: contact.method, [contact.method === 'phone' ? 'phone' : 'email']: text(contact.method === 'phone' ? contact.phone : contact.email) };
  return result;
}

export async function deliverLead(endpoint, payload, fetcher = fetch) {
  const target = text(endpoint);
  if (!(target.startsWith('/') && !target.startsWith('//')) && !/^https:\/\/[^\s]+$/.test(target)) throw new Error('Lead delivery is not connected yet. Your answers have not been sent.');
  const response = await fetcher(target, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('We couldn’t confirm delivery. Your answers are still here; please try again.');
  const result = await response.json();
  if (result.accepted !== true) throw new Error('We couldn’t confirm delivery. Your answers are still here; please try again.');
  return result;
}
