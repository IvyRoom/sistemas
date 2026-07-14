'use strict';

// Node harness for conecta/main.js's pure helpers. Run: node .agents/tests/conecta.test.js
// Loads the real main.js in a stubbed DOM so the logic under test is never duplicated.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fakeElement() {
  const classes = new Set();
  return {
    value: '',
    hidden: false,
    disabled: false,
    textContent: '',
    addEventListener() {},
    setAttribute() {},
    setCustomValidity() {},
    focus() {},
    querySelector: () => fakeElement(),
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      toggle: (name, force) => force ? classes.add(name) : classes.delete(name),
      contains: (name) => classes.has(name),
    },
  };
}

const copyStatus = fakeElement();
const clipboardWrites = [];
let promptArguments;
let scheduledCallback;
const sandbox = {
  location: { hostname: 'test', search: '' },
  localStorage: { getItem: () => null, setItem() {} },
  URLSearchParams,
  navigator: { clipboard: { writeText: async (value) => clipboardWrites.push(value) } },
  window: { prompt: (...args) => { promptArguments = args; } },
  setTimeout: (callback) => { scheduledCallback = callback; return 1; },
  clearTimeout() {},
  document: {
    querySelector: (selector) => selector === '.copy-status' ? copyStatus : fakeElement(),
    querySelectorAll: () => [],
    getElementById: () => fakeElement(),
  },
  console: { error() {} },
};

const context = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'conecta', 'main.js'), 'utf8'), context);
const { maskWhatsapp, isCompleteWhatsapp, copyLink } = context;

const cases = [
  ['mask full number', maskWhatsapp('5541996799092'), '+55 41 99679-9092'],
  ['mask is idempotent', maskWhatsapp('+55 41 99679-9092'), '+55 41 99679-9092'],
  ['mask country code only', maskWhatsapp('55'), '+55'],
  ['mask up to area code', maskWhatsapp('5541'), '+55 41'],
  ['mask partial subscriber', maskWhatsapp('554199679'), '+55 41 99679'],
  ['mask caps overflow digits', maskWhatsapp('55419967990921111'), '+55 41 99679-9092'],
  ['mask strips non-digits', maskWhatsapp('ab(55)41 c'), '+55 41'],
  ['mask empty stays empty', maskWhatsapp(''), ''],
  ['complete number is valid', isCompleteWhatsapp('+55 41 99679-9092'), true],
  ['8-digit subscriber is invalid', isCompleteWhatsapp('+55 41 9967-9092'), false],
  ['missing plus sign is invalid', isCompleteWhatsapp('55 41 99679-9092'), false],
  ['missing area code is invalid', isCompleteWhatsapp('+55 99679-9092'), false],
  ['empty is invalid', isCompleteWhatsapp(''), false],
];

function recordResult(name, got, want) {
  const ok = got === want;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
  return ok ? 0 : 1;
}

(async () => {
  let failed = 0;
  for (const [name, got, want] of cases) failed += recordResult(name, got, want);

  const copiedButton = fakeElement();
  copiedButton.closest = () => ({ querySelector: () => ({ href: 'https://machadogestao.com/' }) });
  await copyLink(copiedButton);
  failed += recordResult('copy writes exact URL', clipboardWrites[0], 'https://machadogestao.com/');
  failed += recordResult('copy shows success icon', copiedButton.classList.contains('is-copied'), true);
  failed += recordResult('copy announces success', copyStatus.textContent, 'Link copiado!');
  scheduledCallback();
  failed += recordResult('copy feedback resets', copiedButton.classList.contains('is-copied'), false);

  sandbox.navigator.clipboard.writeText = async () => { throw new Error('denied'); };
  const fallbackButton = fakeElement();
  fallbackButton.closest = () => ({ querySelector: () => ({ href: 'https://www.instagram.com/machado.gestao/' }) });
  await copyLink(fallbackButton);
  failed += recordResult('copy failure opens manual fallback', promptArguments[1], 'https://www.instagram.com/machado.gestao/');
  failed += recordResult('copy failure does not show success', fallbackButton.classList.contains('is-copied'), false);

  console.log(failed ? `\n${failed} FAILED` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();
