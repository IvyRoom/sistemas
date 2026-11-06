'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../apps/support-management/modules/card-fields.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(source.replace(/^export /gmu, '') + '\nglobalThis.fields = {getCardDetails,formatCardNumber,normalizeText,formatCardholder,formatPostalCode,formatSecurityCode,formatStreetNumber,validateCardFields};', context);
const fields = context.fields;
const date = new Date(2030, 4, 15);
const visa = { number: '4000000000000010', holderName: 'TEST HOLDER', expMonth: '5', expYear: '2030', cvv: '123' };

test('recognizes modern card prefixes and resolves Brazilian brand overlaps by specificity', () => {
  for (const [prefix, brand] of [
    ['4','visa'],['51','mastercard'],['55','mastercard'],['2221','mastercard'],['2720','mastercard'],
    ['34','american-express'],['37','american-express'],['305','diners-club'],['36','diners-club'],
    ['6011','discover'],['644','discover'],['65','discover'],['3528','jcb'],['3589','jcb'],
    ['606282','hipercard'],['401178','elo'],['509999','elo'],['650031','elo'],['655058','elo'],
    ['620','unionpay'],['62197','unionpay'],['622999','unionpay'],['627779','unionpay'],['627780','elo'],['8171','unionpay'],
    ['2220','unknown'],['2721','unknown'],['8172','unknown'],['','unknown'],
  ]) assert.equal(fields.getCardDetails(prefix).brand, brand, prefix);
  assert.equal(fields.getCardDetails('40117').brand, 'visa');
  assert.equal(fields.getCardDetails('401178').brand, 'elo');
  assert.equal(fields.getCardDetails('650030').brand, 'discover');
  assert.equal(fields.getCardDetails('650031').brand, 'elo');
  const details = fields.getCardDetails('4');
  details.lengths.push(2);
  assert.equal(fields.getCardDetails('4').lengths.includes(2), false);
});

test('formats pasted PANs and respects Amex and Diners spacing without preserving extra characters', () => {
  assert.equal(fields.formatCardNumber('4000-0000 0000x0010'), '4000 0000 0000 0010');
  assert.equal(fields.formatCardNumber('378282246310005'), '3782 822463 10005');
  assert.equal(fields.formatCardNumber('30569309025904'), '3056 930902 5904');
  assert.equal(fields.formatCardNumber('999999999999999999999999'), '9999 9999 9999 9999');
  assert.equal(fields.formatCardNumber('5555555555554444999'), '5555 5555 5555 4444');
  assert.equal(fields.formatCardNumber('3782822463100059999'), '3782 822463 10005');
  assert.equal(fields.formatCardNumber('40000'), '4000 0');
  assert.equal(fields.formatCardNumber(''), '');
});

test('holder names preserve case and accents while rejecting numbers and special characters', () => {
  assert.equal(fields.formatCardholder('  João  D’Ávila-3M.  '), 'João DÁvilaM ');
  assert.equal(fields.formatCardholder('Ana\nO\'Brien 🦊 @'), 'Ana OBrien ');
  assert.equal(fields.normalizeText(fields.formatCardholder('  Ana   Maria  ')), 'Ana Maria');
  assert.equal(fields.formatCardholder('Jose\u0301'), 'José');
  assert.equal(fields.formatCardholder('123456'), '');
});

test('formats postal, security and street-number fields without discarding valid address notation', () => {
  assert.equal(fields.formatPostalCode('01.001-000abc99'), '01001-000');
  assert.equal(fields.formatPostalCode('01001'), '01001');
  assert.equal(fields.formatPostalCode('010010'), '01001-0');
  assert.equal(fields.formatSecurityCode('12a34', fields.getCardDetails('4')), '123');
  assert.equal(fields.formatSecurityCode('12a345', fields.getCardDetails('37')), '1234');
  assert.equal(fields.formatSecurityCode('12a34'), '1234');
  for (const value of ['12A', '12/14', '12-14', 'S/N']) assert.equal(fields.formatStreetNumber(value), value);
  assert.equal(fields.formatStreetNumber('  s/n  '), 'S/N ');
  assert.equal(fields.normalizeText('  Rua\t24  de Maio\n'), 'Rua 24 de Maio');
});

test('validates card checksums, field lengths, holder names and brand-specific security codes', () => {
  assert.deepEqual(Object.keys(fields.validateCardFields(visa, date)), []);
  assert.deepEqual(Object.keys(fields.validateCardFields({ ...visa, holderName: 'João da Silva' }, date)), []);
  assert.ok(fields.validateCardFields({ ...visa, holderName: '3M JOÃO D’ÁVILA' }, date).holderName);
  assert.ok(fields.validateCardFields({ ...visa, number: '4000000000000000006' }, date).number);
  assert.ok(fields.validateCardFields({ ...visa, number: '4000000000000011' }, date).number);
  assert.ok(fields.validateCardFields({ ...visa, number: '400000000000' }, date).number);
  assert.ok(fields.validateCardFields({ ...visa, number: '0000000000000000' }, date).number);
  assert.ok(fields.validateCardFields({ ...visa, holderName: '123456' }, date).holderName);
  assert.ok(fields.validateCardFields({ ...visa, holderName: '' }, date).holderName);
  assert.ok(fields.validateCardFields({ ...visa, cvv: '1234' }, date).cvv);
  assert.ok(fields.validateCardFields({ ...visa, number: '378282246310005', cvv: '123' }, date).cvv);
  assert.deepEqual(Object.keys(fields.validateCardFields({ ...visa, number: '378282246310005', cvv: '1234' }, date)), []);
  assert.deepEqual(Object.keys(fields.validateCardFields({ ...visa, number: '6200000000000000' }, date)), []);
  assert.ok(fields.validateCardFields({ ...visa, number: '6200000000000' }, date).number);
  for (const cvv of ['123', '1234']) {
    assert.deepEqual(Object.keys(fields.validateCardFields({ ...visa, number: '1234567890123452', cvv }, date)), []);
  }
});

test('accepts the current expiry month and rejects expired or incomplete dates', () => {
  assert.deepEqual(Object.keys(fields.validateCardFields(visa, date)), []);
  assert.ok(fields.validateCardFields({ ...visa, expMonth: '4' }, date).expMonth);
  assert.ok(fields.validateCardFields({ ...visa, expYear: '2029' }, date).expYear);
  assert.ok(fields.validateCardFields({ ...visa, expMonth: '' }, date).expMonth);
  assert.ok(fields.validateCardFields({ ...visa, expMonth: '13' }, date).expMonth);
  assert.ok(fields.validateCardFields({ ...visa, expYear: '30' }, date).expYear);
  assert.deepEqual(Object.keys(fields.validateCardFields({ ...visa, expMonth: '1', expYear: '2031' }, date)), []);
});
