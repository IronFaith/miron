import { questions, questionHelp, validateQuestion, answerText, leadPayload, deliverLead } from './seller-questions.mjs?v=seller-update-1';
import { summarizeLead, priorityGuide } from './lead-summary.mjs';

const dialog = document.querySelector('#sell');
const form = document.querySelector('#seller-form');
const fields = document.querySelector('#seller-fields');
const title = document.querySelector('#seller-title');
const description = document.querySelector('#seller-description');
const error = document.querySelector('#seller-error');
const next = document.querySelector('#seller-next');
const back = document.querySelector('#seller-back');
const count = document.querySelector('#seller-count');
const progress = document.querySelector('#seller-progress');
const phase = document.querySelector('#seller-phase');
const mode = document.querySelector('#seller-mode');
const footnote = document.querySelector('#seller-footnote');
const endpoint = String(window.MIRON_CONFIG?.leadEndpoint || '').trim();
const connected = /^(https:\/\/[^\s]+|\/(?!\/)[^\s]*)$/.test(endpoint);
let answers = {};
let index = 0;
let editing = false;
let editSnapshot = null;
let sending = false;
let delivered = false;
let lastRequest = null;
let previewing = false;
const buyerChecks = new Set();
let checkedAnswersSnapshot = null;

const element = (tag, className, content) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
};

function inputField(label, key, { value = '', type = 'text', autocomplete = 'off', inputmode, maxLength = 240, placeholder, help, update } = {}) {
  const wrap = element('div', 'seller-input-wrap');
  const caption = element('label', 'seller-label', label);
  const input = document.createElement('input');
  input.id = `seller-${key}`;
  caption.htmlFor = input.id;
  input.name = key;
  input.type = type;
  input.autocomplete = autocomplete;
  input.value = value;
  input.maxLength = maxLength;
  input.setAttribute('aria-describedby', 'seller-error');
  if (inputmode) input.inputMode = inputmode;
  if (placeholder) input.placeholder = placeholder;
  input.addEventListener('input', () => { update(input.value); clearError(); });
  wrap.append(caption, input);
  if (help) wrap.append(element('p', 'seller-input-help', help));
  return wrap;
}

function choiceGroup(question) {
  const group = element('fieldset', 'seller-choices');
  const legend = element('legend', 'visually-hidden', question.title);
  group.append(legend);
  question.options.forEach((option, i) => {
    const label = element('label', 'seller-option');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = question.id;
    input.id = `seller-option-${i}`;
    input.value = option;
    input.checked = answers[question.id] === option;
    input.addEventListener('change', () => { answers[question.id] = option; clearError(); });
    label.append(input, element('span', '', option));
    group.append(label);
  });
  return group;
}

function renderQuestion(question) {
  if (question.options) fields.append(choiceGroup(question));
  if (question.type === 'address') {
    fields.append(inputField('Property address', 'address', { value: answers.address, autocomplete: 'street-address', placeholder: 'Street address, city, state, ZIP', update: value => { answers.address = value; } }));
    fields.append(element('p', 'seller-input-help', 'Include the unit number, if there is one.'));
  }
  if (question.type === 'contact') {
    answers.contact ||= { name: '', method: 'email', email: '', phone: '' };
    const contact = answers.contact;
    fields.append(inputField('Your name', 'name', { value: contact.name, autocomplete: 'name', maxLength: 100, update: value => { contact.name = value; } }));
    const methods = element('fieldset', 'seller-methods');
    methods.append(element('legend', 'seller-label', 'Preferred contact method'));
    ['email', 'phone'].forEach(method => {
      const label = element('label', 'seller-option');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'contactMethod';
      input.value = method;
      input.checked = contact.method === method;
      input.addEventListener('change', () => {
        contact.method = method;
        renderContactField();
        clearError();
      });
      label.append(input, element('span', '', method === 'email' ? 'Email' : 'Phone call'));
      methods.append(label);
    });
    fields.append(methods, element('div', 'seller-contact-field'));
    renderContactField();
  }
}

function renderContactField() {
  const contact = answers.contact;
  const phone = contact.method === 'phone';
  fields.querySelector('.seller-contact-field').replaceChildren(inputField(phone ? 'Phone number' : 'Email address', phone ? 'phone' : 'email', {
    value: phone ? contact.phone : contact.email,
    type: phone ? 'tel' : 'email',
    autocomplete: phone ? 'tel' : 'email',
    inputmode: phone ? 'tel' : 'email',
    maxLength: phone ? 30 : 254,
    placeholder: phone ? 'Include your area code' : 'you@example.com',
    update: value => { contact[phone ? 'phone' : 'email'] = value; }
  }));
}

function renderReview() {
  const list = element('dl', 'seller-review');
  questions.forEach((question, i) => {
    const row = element('div', 'seller-review-row');
    const content = element('div');
    content.append(element('dt', '', question.label), element('dd', '', answerText(question, answers)));
    const edit = element('button', 'seller-edit', 'Edit');
    edit.type = 'button';
    edit.setAttribute('aria-label', `Edit ${question.label.toLowerCase()}`);
    edit.addEventListener('click', () => { editSnapshot = structuredClone(answers); index = i; editing = true; render(); });
    row.append(content, edit);
    list.append(row);
  });
  fields.append(list);
  if (connected) {
    const label = element('label', 'seller-consent');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.id = 'seller-consent';
    check.addEventListener('change', clearError);
    label.append(check, element('span', '', 'I agree to share these answers with Miron and be contacted by my selected method about this property.'));
    fields.append(label);
  } else {
    fields.append(element('p', 'seller-demo-summary', 'See how these answers become a lead for the buyer: a summary, follow-up priority, and checks to confirm. Nothing is sent.'));
  }
}

function clearError() {
  error.textContent = '';
  fields.classList.remove('has-error');
}

function render() {
  if (previewing) { renderLeadPreview(); return; }
  dialog.classList.remove('is-lead-preview');
  clearError();
  fields.replaceChildren();
  next.disabled = false;
  back.disabled = false;
  next.hidden = false;
  const review = index === questions.length;
  const question = questions[index];
  count.textContent = review ? 'Ready to review' : `${index + 1} of ${questions.length}`;
  phase.textContent = review ? 'Your home, at a glance' : question.phase;
  const completed = editing ? questions.length : index;
  progress.value = completed;
  progress.textContent = `${completed} of ${questions.length} complete`;
  back.hidden = index === 0 && !editing;
  back.textContent = editing ? 'Cancel edit' : 'Back';
  title.textContent = review ? 'Does everything look right?' : question.title;
  description.textContent = review ? 'Take a quick look. You can change any answer below.' : questionHelp(question, answers);
  mode.hidden = connected;
  mode.textContent = 'Preview: use sample details. Nothing is sent.';
  footnote.textContent = connected ? 'Your answers are only sent when you review and submit.' : 'Answers stay in this tab. Closing the tab or refreshing clears them.';
  if (review) {
    renderReview();
    next.textContent = connected ? 'Send my details' : 'Preview this lead';
  } else {
    renderQuestion(question);
    next.textContent = editing ? 'Update summary' : index === questions.length - 1 ? 'Review my answers' : 'Continue';
  }
  title.focus({ preventScroll: true });
  dialog.scrollTop = 0;
}

function renderLeadPreview() {
  const snapshotKey = JSON.stringify(leadPayload(answers));
  if (checkedAnswersSnapshot !== snapshotKey) buyerChecks.clear();
  checkedAnswersSnapshot = snapshotKey;
  const lead = summarizeLead(answers);
  clearError();
  fields.replaceChildren();
  dialog.classList.add('is-lead-preview');
  count.textContent = 'Lead preview';
  phase.textContent = 'Buyer view';
  title.textContent = lead.name;
  description.textContent = lead.address;
  progress.value = questions.length;
  progress.textContent = 'All answers complete';
  mode.hidden = false;
  mode.textContent = 'Demo buyer view. Nothing has been sent or independently verified.';
  back.hidden = false;
  back.disabled = false;
  back.textContent = 'Edit answers';
  next.hidden = false;
  next.disabled = false;
  next.textContent = 'Back to site';
  footnote.textContent = 'Answers and checklist marks stay in this tab and clear on refresh.';

  const hero = element('section', `lead-priority lead-priority-${lead.level}`);
  hero.setAttribute('aria-label', 'Follow-up priority');
  const heading = element('div', 'lead-priority-heading');
  heading.append(element('span', `lead-badge lead-badge-${lead.level}`, lead.label), element('span', 'lead-action', lead.action));
  hero.append(heading, element('p', 'lead-next-step', lead.next));
  const reasons = element('ul', 'lead-reasons');
  lead.reasons.forEach(reason => reasons.append(element('li', '', reason)));
  hero.append(reasons, element('p', 'lead-priority-note', 'Priority reflects selling intent and timing. It is not a verified offer or an assessment of property value.'));
  const demoLink = element('a', 'lead-demo-link', 'Watch lead demo (30 sec)');
  demoLink.href = 'demo/';
  demoLink.target = '_blank';
  demoLink.rel = 'noopener';
  demoLink.setAttribute('aria-label', 'Watch lead demo, 30 seconds, opens in a new tab');
  hero.append(demoLink);
  fields.append(hero);

  const contact = element('div', 'lead-contact');
  contact.append(element('span', 'lead-contact-label', `Preferred contact · ${lead.contact.method}`), element('strong', '', lead.contact.value));
  fields.append(contact);

  const snapshot = element('section', 'lead-section');
  snapshot.append(element('h3', '', 'Property & selling plans'));
  const facts = element('dl', 'lead-facts');
  lead.facts.forEach(fact => {
    const item = element('div');
    item.append(element('dt', '', fact.label), element('dd', '', fact.value));
    facts.append(item);
  });
  snapshot.append(facts);
  fields.append(snapshot);

  const review = element('section', 'lead-section');
  const reviewHeading = element('div', 'lead-check-heading');
  const checkCount = element('span', 'lead-check-count');
  checkCount.setAttribute('role', 'status');
  const updateCount = () => { checkCount.textContent = `${buyerChecks.size} of ${lead.checks.length} checked`; };
  updateCount();
  reviewHeading.append(element('h3', '', 'Buyer checklist'), checkCount);
  review.append(reviewHeading, element('p', 'lead-section-note', 'Mark a check only after the buyer confirms it. These marks are a preview, not a saved verification.'));
  lead.checks.forEach(check => {
    const label = element('label', 'lead-check');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = buyerChecks.has(check.id);
    input.addEventListener('change', () => {
      if (input.checked) buyerChecks.add(check.id); else buyerChecks.delete(check.id);
      updateCount();
    });
    const content = element('span');
    content.append(element('strong', '', check.label), element('span', 'lead-check-detail', check.detail));
    label.append(input, content);
    review.append(label);
  });
  fields.append(review);

  const guide = element('details', 'lead-guide');
  guide.append(element('summary', '', 'How lead priority works'));
  priorityGuide.forEach(item => {
    const row = element('p');
    row.append(element('span', `lead-badge lead-badge-${item.level}`, `${item.level[0].toUpperCase()}${item.level.slice(1)}`), element('span', '', item.text));
    guide.append(row);
  });
  fields.append(guide);
  title.focus({ preventScroll: true });
  dialog.scrollTop = 0;
}

function showDelivered() {
  delivered = true;
  title.textContent = 'Your details are with Miron.';
  description.textContent = 'Thank you. Miron can review your property and contact you using the method you selected.';
  fields.replaceChildren(element('p', 'seller-success', 'This is a request to start a conversation, not an offer or an agreement to sell.'));
  count.textContent = 'Complete';
  phase.textContent = 'The next step';
  back.hidden = true;
  next.textContent = 'Back to the site';
  next.disabled = false;
  footnote.textContent = '';
  title.focus({ preventScroll: true });
  dialog.scrollTop = 0;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending) return;
  if (previewing) { dialog.close(); return; }
  if (delivered) { dialog.close(); return; }
  if (index < questions.length) {
    const message = validateQuestion(questions[index], answers);
    if (message) {
      error.textContent = message;
      fields.classList.add('has-error');
      fields.querySelector('input')?.focus();
      return;
    }
    index = editing ? questions.length : index + 1;
    editing = false;
    editSnapshot = null;
    render();
    return;
  }
  // Revalidate the entire snapshot before any transmission.
  const invalidIndex = questions.findIndex(question => validateQuestion(question, answers));
  if (invalidIndex !== -1) { index = invalidIndex; editing = true; render(); return; }
  if (!connected) { previewing = true; render(); return; }
  if (!document.querySelector('#seller-consent').checked) {
    error.textContent = 'Please confirm that Miron may receive these answers and contact you about the property.';
    document.querySelector('#seller-consent').focus();
    return;
  }
  sending = true;
  next.disabled = true;
  back.disabled = true;
  fields.querySelectorAll('button,input').forEach(control => { control.disabled = true; });
  next.textContent = 'Sending…';
  clearError();
  const snapshot = JSON.stringify(leadPayload(answers));
  if (!lastRequest || lastRequest.snapshot !== snapshot) lastRequest = { snapshot, id: crypto.randomUUID() };
  try {
    await deliverLead(endpoint, { requestId: lastRequest.id, source: 'miron-seller-flow', answers: JSON.parse(snapshot), contactConsent: true });
    showDelivered();
  } catch (failure) {
    error.textContent = failure.name === 'TimeoutError' ? 'Delivery is taking longer than expected. Your answers are still here. Please retry; the same request ID will be reused.' : 'We couldn’t confirm delivery. Your answers are still here. Please try again.';
    next.textContent = 'Try sending again';
  } finally {
    sending = false;
    next.disabled = false;
    back.disabled = false;
    fields.querySelectorAll('button,input').forEach(control => { control.disabled = false; });
  }
});

back.addEventListener('click', () => {
  if (sending) return;
  if (previewing) { previewing = false; render(); return; }
  if (editing && editSnapshot) answers = editSnapshot;
  index = editing ? questions.length : Math.max(0, index - 1);
  editing = false;
  editSnapshot = null;
  render();
});
dialog.querySelector('.seller-close').addEventListener('click', () => { if (!sending) dialog.close(); });
dialog.addEventListener('cancel', event => { if (sending) event.preventDefault(); });

function openSeller() {
  document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
  document.querySelector('#navigation').classList.remove('is-open');
  dialog.showModal();
  if (delivered) showDelivered(); else render();
}

document.querySelectorAll('[data-sell]').forEach(link => {
  link.setAttribute('aria-haspopup', 'dialog');
  link.addEventListener('click', event => {
    event.preventDefault();
    openSeller();
  });
});

// The homepage choice is question one, so the dialog continues at question two.
const offerStart = document.querySelector('.offer-start');
const offerPriorities = document.querySelector('#offer-priorities');
if (offerStart && offerPriorities) {
  const firstQuestion = questions[0];
  document.querySelector('#offer-start-title').textContent = firstQuestion.title;
  firstQuestion.options.forEach(option => {
    const button = element('button', 'offer-priority');
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'sell');
    button.textContent = option;
    button.addEventListener('click', () => {
      if (sending) return;
      if (!delivered) {
        answers[firstQuestion.id] = option;
        index = 1;
        editing = false;
        editSnapshot = null;
        previewing = false;
      }
      openSeller();
    });
    offerPriorities.append(button);
  });
  offerStart.hidden = false;
  if (!connected) document.querySelector('.offer-start-note').textContent = 'Website preview. Your answers are not sent.';
}
// The seller video links straight back into the same questionnaire.
if (window.location.hash === '#sell') {
  openSeller();
}
