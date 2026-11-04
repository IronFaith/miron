import { questions, validateQuestion, answerText, leadPayload, deliverLead } from './seller-questions.mjs';

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
    fields.append(element('p', 'seller-demo-summary', 'Preview complete. Your answers have not been sent to Miron. You can download a copy; delivery will be enabled once the business contact is connected.'));
  }
}

function clearError() {
  error.textContent = '';
  fields.classList.remove('has-error');
}

function render() {
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
  description.textContent = review ? 'Take a quick look. You can change any answer below.' : question.help;
  mode.hidden = connected;
  footnote.textContent = connected ? 'Your answers are only sent when you review and submit.' : 'Answers stay in this tab. Closing the tab or refreshing clears them.';
  if (review) {
    renderReview();
    next.textContent = connected ? 'Send my details' : 'Download my summary';
  } else {
    renderQuestion(question);
    next.textContent = editing ? 'Update summary' : index === questions.length - 1 ? 'Review my answers' : 'Continue';
  }
  title.focus({ preventScroll: true });
  dialog.scrollTop = 0;
}

function downloadSummary() {
  const text = ['Miron — seller questionnaire', 'Preview summary. Not submitted to Miron.', '', ...questions.map(question => `${question.label}\n${answerText(question, answers)}\n`)].join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'miron-home-summary.txt';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  footnote.textContent = 'Your download was requested. Nothing has been sent to Miron.';
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
  if (!connected) { downloadSummary(); return; }
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
  if (editing && editSnapshot) answers = editSnapshot;
  index = editing ? questions.length : Math.max(0, index - 1);
  editing = false;
  editSnapshot = null;
  render();
});
dialog.querySelector('.seller-close').addEventListener('click', () => { if (!sending) dialog.close(); });
dialog.addEventListener('cancel', event => { if (sending) event.preventDefault(); });
document.querySelectorAll('[data-sell]').forEach(link => {
  link.setAttribute('aria-haspopup', 'dialog');
  link.addEventListener('click', event => {
    event.preventDefault();
    document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
    document.querySelector('#navigation').classList.remove('is-open');
    dialog.showModal();
    if (delivered) showDelivered(); else render();
  });
});
