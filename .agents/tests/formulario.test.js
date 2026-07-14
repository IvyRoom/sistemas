'use strict';

// Node harness for formulario/main.js's pure helpers. Run: node .agents/tests/formulario.test.js
// Loads the real main.js in a stubbed DOM so the logic under test is never duplicated.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fakeElement() {
  return {
    innerHTML: '',
    value: '',
    checked: false,
    disabled: false,
    hidden: false,
    dataset: {},
    firstElementChild: null,
    addEventListener() {},
    appendChild() {},
    querySelector: () => fakeElement(),
    querySelectorAll: () => [],
    setAttribute() {},
    getAttribute: () => '',
    setCustomValidity() {},
    classList: { add() {}, remove() {}, toggle() {} },
  };
}

const sandbox = {
  window: { innerWidth: 1920, addEventListener() {}, location: { href: '' } },
  location: { hostname: 'test' },
  document: {
    querySelector: () => fakeElement(),
    querySelectorAll: () => [],
    getElementById: () => fakeElement(),
    createElement: () => fakeElement(),
  },
  console,
};

const context = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'formulario', 'main.js'), 'utf8'), context);
const { isValidCpf, isValidCnpj, maskCpf, maskCnpj, maskCep, normalizeStreet, toTitleCase } = context;

const cases = [
  ['CPF valid 529.982.247-25', isValidCpf('529.982.247-25'), true],
  ['CPF valid 111.444.777-35', isValidCpf('111.444.777-35'), true],
  ['CPF invalid check digit', isValidCpf('529.982.247-26'), false],
  ['CPF repeated digits', isValidCpf('111.111.111-11'), false],
  ['CPF too short', isValidCpf('123'), false],
  ['CNPJ valid 11.222.333/0001-81', isValidCnpj('11.222.333/0001-81'), true],
  ['CNPJ valid 33.000.167/0001-01', isValidCnpj('33.000.167/0001-01'), true],
  ['CNPJ invalid check digit', isValidCnpj('11.222.333/0001-82'), false],
  ['CNPJ repeated digits', isValidCnpj('00.000.000/0000-00'), false],
  ['CNPJ alphanumeric valid (Receita example)', isValidCnpj('12.ABC.345/01DE-35'), true],
  ['CNPJ alphanumeric tampered', isValidCnpj('12.ABC.345/01DE-36'), false],
  ['CNPJ letters in check-digit slots', isValidCnpj('12.ABC.345/01DE-AB'), false],
  ['maskCpf', maskCpf('52998224725'), '529.982.247-25'],
  ['maskCnpj numeric', maskCnpj('11222333000181'), '11.222.333/0001-81'],
  ['maskCnpj alphanumeric lowercase', maskCnpj('12abc34501de35'), '12.ABC.345/01DE-35'],
  ['maskCnpj partial', maskCnpj('11222'), '11.222'],
  ['maskCep', maskCep('80010000'), '80010-000'],
  ['normalizeStreet abbreviates', normalizeStreet('rua xv de novembro'), 'R. Xv de Novembro'],
  ['normalizeStreet avenida', normalizeStreet('avenida sete de setembro'), 'Av. Sete de Setembro'],
  ['toTitleCase connectors', toTitleCase('joão da silva'), 'João da Silva'],
];

let failed = 0;
for (const [name, got, want] of cases) {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
}
console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exit(failed ? 1 : 0);
