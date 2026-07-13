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
  ['mask number without country code', maskWhatsapp('41996799092'), '+55 41 99679-9092'],
  ['mask number with country code', maskWhatsapp('5541996799092'), '+55 41 99679-9092'],
  ['mask is idempotent', maskWhatsapp('+55 41 99679-9092'), '+55 41 99679-9092'],
  ['mask keeps DDD 55 without country code', maskWhatsapp('55996799092'), '+55 55 99679-9092'],
  ['mask keeps DDD 55 when re-masking', maskWhatsapp('+55 55 99679-9092'), '+55 55 99679-9092'],
  ['mask partial DDD', maskWhatsapp('4'), '+55 4'],
  ['mask partial subscriber', maskWhatsapp('4199679'), '+55 41 99679'],
  ['mask re-masks partial input', maskWhatsapp('+55 41 996'), '+55 41 996'],
  ['mask caps overflow digits', maskWhatsapp('419967990925555'), '+55 41 99679-9092'],
  ['mask strips non-digits', maskWhatsapp('(41) 99679-9092'), '+55 41 99679-9092'],
  ['mask empty stays empty', maskWhatsapp(''), ''],
  ['mask clears when only prefix remains', maskWhatsapp('+55 '), ''],
  ['complete number is valid', isCompleteWhatsapp('+55 41 99679-9092'), true],
  ['foreign country code is invalid', isCompleteWhatsapp('+56 41 99679-9092'), false],
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
