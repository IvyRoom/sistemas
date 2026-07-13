'use strict';

// Node harness for conecta/main.js's pure helpers. Run: node .claude/tests/conecta.test.js
// Loads the real main.js in a stubbed DOM so the logic under test is never duplicated.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fakeElement() {
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
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  };
}

const sandbox = {
  location: { hostname: 'test', search: '' },
  localStorage: { getItem: () => null, setItem() {} },
  URLSearchParams,
  document: {
    querySelector: () => fakeElement(),
    querySelectorAll: () => [],
    getElementById: () => fakeElement(),
  },
  console,
};

const context = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'conecta', 'main.js'), 'utf8'), context);
const { maskWhatsapp, isCompleteWhatsapp } = context;

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

let failed = 0;
for (const [name, got, want] of cases) {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
}
console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
