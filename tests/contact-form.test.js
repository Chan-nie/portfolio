'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const {
  validateContactForm,
  isNonEmptyTrimmed,
  isValidEmail,
  isValidMessage,
  bindContactForm
} = require('../contact-form.js');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  PASS: ${message}`);
  } else {
    failed += 1;
    console.log(`  FAIL: ${message}`);
  }
}

function createDom() {
  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    url: 'http://localhost/'
  });
  const { window } = dom;
  const { document } = window;

  const script = fs.readFileSync(path.join(root, 'contact-form.js'), 'utf8');
  window.eval(script);

  return { dom, window, document };
}

console.log('Unit tests (validateContactForm)\n');

console.log('Empty submit');
{
  const result = validateContactForm({ name: '', email: '', message: '' });
  assert(result.valid === false, 'empty submit is invalid');
  assert(result.errors.name === 'Name is required.', 'name error shown');
  assert(result.errors.email === 'Email is required.', 'email error shown');
  assert(result.errors.message === 'Message is required.', 'message error shown');
}

console.log('\nInvalid email formats');
{
  const invalidEmails = ['not-an-email', 'missing@domain', '@nodomain.com', 'spaces @test.com'];
  invalidEmails.forEach((email) => {
    const result = validateContactForm({
      name: 'Sinchan',
      email,
      message: 'Hello there!'
    });
    assert(result.valid === false, `"${email}" is rejected`);
    assert(result.errors.email === 'Please enter a valid email address.', `"${email}" gets format error`);
  });
}

console.log('\nWhitespace-only name');
{
  const result = validateContactForm({
    name: '   ',
    email: 'sinchan@example.com',
    message: 'Valid message here.'
  });
  assert(result.valid === false, 'whitespace-only name is invalid');
  assert(result.errors.name === 'Name is required.', 'name required error for whitespace');
  assert(isNonEmptyTrimmed('   ') === false, 'isNonEmptyTrimmed rejects whitespace');
}

console.log('\nWhitespace-only message');
{
  const result = validateContactForm({
    name: 'Sinchan',
    email: 'sinchan@example.com',
    message: '          '
  });
  assert(result.valid === false, 'whitespace-only message is invalid');
  assert(result.errors.message === 'Message is required.', 'message required error for whitespace');
}

console.log('\nMessage too short (non-whitespace)');
{
  const result = validateContactForm({
    name: 'Sinchan',
    email: 'sinchan@example.com',
    message: '123456789'
  });
  assert(result.valid === false, '9-char message is invalid');
  assert(
    result.errors.message === 'Message must be at least 10 characters.',
    'short message error text'
  );
  assert(isValidMessage('123456789') === false, 'isValidMessage rejects 9 chars');
}

console.log('\nValid submit');
{
  const payload = {
    name: 'Sinchan Suvarna',
    email: 'sinchan@example.com',
    message: 'Hello, I would love to connect!'
  };
  const result = validateContactForm(payload);
  assert(result.valid === true, 'valid payload passes validation');
  assert(Object.keys(result.errors).length === 0, 'no errors on valid payload');
  assert(isValidEmail('sinchan@example.com') === true, 'isValidEmail accepts valid address');
  assert(isValidMessage(payload.message) === true, 'isValidMessage accepts long enough text');
}

console.log('\nDOM integration (jsdom + bindContactForm)\n');

function setupForm(document) {
  const form = document.getElementById('contact-form');
  bindContactForm(form);
  return {
    form,
    nameInput: document.getElementById('contact-name'),
    emailInput: document.getElementById('contact-email'),
    messageInput: document.getElementById('contact-message'),
    nameError: document.getElementById('contact-name-error'),
    emailError: document.getElementById('contact-email-error'),
    messageError: document.getElementById('contact-message-error'),
    successEl: document.getElementById('contact-form-success')
  };
}

function submitForm(form) {
  form.dispatchEvent(new form.ownerDocument.defaultView.Event('submit', { bubbles: true, cancelable: true }));
}

console.log('Empty submit (DOM)');
{
  const { document } = createDom();
  const fields = setupForm(document);
  submitForm(fields.form);

  assert(fields.nameError.textContent === 'Name is required.', 'inline name error rendered');
  assert(fields.emailError.textContent === 'Email is required.', 'inline email error rendered');
  assert(fields.messageError.textContent === 'Message is required.', 'inline message error rendered');
  assert(fields.nameInput.getAttribute('aria-invalid') === 'true', 'name input aria-invalid set');
  assert(document.activeElement === fields.nameInput, 'focus moves to first invalid field');
  assert(fields.successEl.textContent === '', 'no success message on invalid submit');
}

console.log('\nInvalid email (DOM)');
{
  const { document } = createDom();
  const fields = setupForm(document);
  fields.nameInput.value = 'Sinchan';
  fields.emailInput.value = 'bad-email';
  fields.messageInput.value = 'This is a long enough message.';
  submitForm(fields.form);

  assert(fields.emailError.textContent === 'Please enter a valid email address.', 'email format error shown');
  assert(fields.emailInput.getAttribute('aria-invalid') === 'true', 'email aria-invalid set');
  assert(document.activeElement === fields.emailInput, 'focus moves to email field');
}

console.log('\nWhitespace-only name (DOM)');
{
  const { document } = createDom();
  const fields = setupForm(document);
  fields.nameInput.value = '   ';
  fields.emailInput.value = 'sinchan@example.com';
  fields.messageInput.value = 'Valid message content.';
  submitForm(fields.form);

  assert(fields.nameError.textContent === 'Name is required.', 'whitespace name error shown');
  assert(document.activeElement === fields.nameInput, 'focus on name after whitespace submit');
}

console.log('\nValid submit (DOM)');
{
  const { document } = createDom();
  const fields = setupForm(document);
  fields.nameInput.value = 'Sinchan Suvarna';
  fields.emailInput.value = 'sinchan@example.com';
  fields.messageInput.value = 'Hello, I would love to connect!';
  submitForm(fields.form);

  assert(fields.nameError.textContent === '', 'no name error after valid submit');
  assert(fields.emailError.textContent === '', 'no email error after valid submit');
  assert(fields.messageError.textContent === '', 'no message error after valid submit');
  assert(
    fields.successEl.textContent === 'Thank you! Your message is ready to send.',
    'success message shown'
  );
  assert(fields.nameInput.value === '', 'form reset after valid submit');
}

console.log(`\n${'='.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(40));

if (failed > 0) {
  process.exit(1);
}
