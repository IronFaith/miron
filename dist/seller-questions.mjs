export const questions = [
  { id: 'priority', title: 'What would make selling easier?', help: 'Start with what matters most to you.', phase: 'Your priorities', type: 'choice', label: 'Selling priority', options: ['Avoiding repairs', 'Selling quickly', 'Getting the right price', 'Choosing my move date', 'I’m just exploring'] },
  { id: 'timeline', title: 'When would you like to sell?', help: 'Your ideal timing. No commitment.', phase: 'Your priorities', type: 'choice', label: 'Preferred timing', options: ['As soon as possible', 'Within 1–3 months', 'Within 3–6 months', 'Later than 6 months', 'I’m not sure yet'] },
  { id: 'propertyType', title: 'What kind of home is it?', help: 'Now, a few quick details about your home.', phase: 'Your home', type: 'choice', label: 'Property type', options: ['Single-family home', 'Townhouse', 'Condo', '2–4 unit property', 'Manufactured home', 'Something else'] },
  { id: 'condition', title: 'Does it need any work?', help: 'Just pick the closest match.', phase: 'Your home', type: 'choice', label: 'Condition', options: ['Move-in ready', 'A few updates', 'Major repairs', 'I’m not sure'] },
  { id: 'size', title: 'About how big is the home?', help: 'A rough range is enough.', phase: 'Your home', type: 'choice', label: 'Approximate size', options: ['Under 1,000 sq ft', '1,000–1,499 sq ft', '1,500–1,999 sq ft', '2,000–2,999 sq ft', '3,000+ sq ft', 'I’m not sure'] },
  { id: 'occupancy', title: 'Who lives there now?', help: 'You’re halfway there.', phase: 'Your home', type: 'choice', label: 'Occupancy', options: ['I live there', 'Tenants', 'It’s vacant', 'Family or someone else', 'Short-term guests'] },
  { id: 'relationship', title: 'Is this your property?', help: 'So we know who to speak with.', phase: 'Your home', type: 'choice', label: 'Connection to the property', options: ['I’m the owner', 'I’m a co-owner', 'I represent an estate or trust', 'I’m helping the owner', 'I’m the listing agent', 'Something else'] },
  { id: 'price', title: 'What price do you have in mind?', help: 'An estimate is fine. Unsure is fine, too.', phase: 'Final details', type: 'choice', label: 'Price expectation', options: ['Under $150,000', '$150,000–$299,999', '$300,000–$499,999', '$500,000–$749,999', '$750,000+', 'I’m not sure'] },
  { id: 'address', title: 'Where’s the property?', help: 'Almost done. Add the street, city, state and ZIP.', phase: 'Final details', type: 'address', label: 'Property address' },
  { id: 'contact', title: 'How can we reach you?', help: 'Last step. Your name and one way to reach you.', phase: 'Final details', type: 'contact', label: 'Contact details' }
];

const text = value => String(value ?? '').trim();

export function validateQuestion(question, answers) {
  const value = answers[question.id];
  if (question.type === 'address') return text(value).length >= 10 && text(value).length <= 240 ? '' : 'Please enter the street address, city, state, and ZIP code.';
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
  return '';
}

export function answerText(question, answers) {
  const value = answers[question.id];
  if (question.type === 'contact') return `${text(value?.name)} · ${value?.method === 'phone' ? text(value?.phone) : text(value?.email)}`;
  return text(value);
}

export function leadPayload(answers) {
  const result = Object.fromEntries(questions.map(question => [question.id, answers[question.id] ?? '']));
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
