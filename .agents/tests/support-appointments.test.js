'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function fixture(client, options = {}) {
  function element(tagName = 'div') {
    return { tagName, children: [], dataset: {}, attributes: {}, listeners: {}, disabled: false, hidden: false, checked: false, textContent: '', colSpan: 1,
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(key, callback) { this.listeners[key] = callback; },
      scrollIntoView(options) { this.scrollOptions = options; },
      focus(options) { this.focusOptions = options; },
      querySelectorAll(selector) { return this.children.flatMap((child) => [ ...(child.tagName === selector ? [child] : []), ...child.querySelectorAll(selector) ]); },
    };
  }
  const elements = new Map(['appointment-calendar', 'reserve-date', 'appointments-message', 'appointments-gate', 'appointments-intro', 'appointments-faq', 'appointment-details', 'reservation-acknowledged', 'selected-appointment-date', 'selected-appointment-price', 'payment-administrator-name', 'appointment-confirmation-email'].map((id) => [id, element()]));
  let ids = 0;
  const failures = [];
  const context = vm.createContext({ Intl, document: { getElementById: (id) => elements.get(id), createElement: element } });
  const source = fs.readFileSync(path.join(__dirname, '../../apps/support-management/modules/appointments.js'), 'utf8');
  vm.runInContext(`${source.replace(/export /gu, '')}\nglobalThis.create = createAppointments;`, context);
  const connectedClient = { ...client, async calendar(...args) {
    const result = await client.calendar(...args);
    return result && Array.isArray(result.days) ? { today: '2026-11-09', paymentMethodRegistered: true, administratorName: 'Administradora Exemplo', userEmail: 'user@example.test', ...result } : result;
  } };
  const app = context.create({ client: connectedClient, onAuthFailure(error) { failures.push(error); return error.status === 401; },
    requestId: () => `00000000-0000-4000-8000-${String(++ids).padStart(12, '0')}`, ...options,
  });
  const buttons = () => elements.get('appointment-calendar').querySelectorAll('button');
  const button = (date) => buttons().find((item) => item.dataset.date === date);
  const acknowledge = (checked = true) => { elements.get('reservation-acknowledged').checked = checked; elements.get('reservation-acknowledged').listeners.change(); };
  const select = (date = '2026-11-10', checked = true) => { button(date).listeners.click(); if (!button(date).disabled) acknowledge(checked); };
  const reserve = () => elements.get('reserve-date').listeners.click();
  return { app, elements, buttons, button, select, acknowledge, reserve, failures, idCount: () => ids };
}

const days = [
  { date: '2026-11-10', available: true, priceCents: 50000, pricePosition: 0 },
  { date: '2026-11-11', available: false, priceCents: null, pricePosition: null },
  { date: '2026-12-01', available: true, priceCents: 37500, pricePosition: 1 },
];

test('calendar uses complete Sunday–Saturday weeks, gray unavailable dates and authoritative prices', async () => {
  const f = fixture({ calendar: async () => ({ days }) });
  await f.app.load();
  const blocks = f.elements.get('appointment-calendar').children;
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].children[0].textContent, 'Novembro de 2026');
  assert.equal(blocks[1].children[0].textContent, 'Dezembro de 2026');
  const [november, december] = blocks.map((block) => block.children[1]);
  assert.equal(november.attributes['aria-labelledby'], blocks[0].children[0].id);
  assert.deepEqual(november.children[0].children[0].children.map((cell) => cell.textContent), ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.']);
  assert.equal(november.children[0].children[0].children[0].attributes['aria-label'], 'domingo');
  const weeks = november.children[1].children;
  assert.equal(weeks.length, 5);
  assert.ok(weeks.every((week) => week.children.length === 7));
  assert.equal(weeks[0].querySelectorAll('button').length, 7);
  assert.ok(weeks[0].querySelectorAll('button').every((button) => button.disabled));
  assert.equal(weeks[1].children[1].children[0].dataset.date, '2026-11-09');
  assert.equal(weeks[1].children[1].children[0].disabled, true);
  assert.equal(weeks[1].children[2].children[0].dataset.date, '2026-11-10');
  assert.equal(weeks[1].children[3].children[0].dataset.date, '2026-11-11');
  assert.equal(december.children[1].children[0].children[0].children.length, 0);
  assert.equal(december.children[1].children[0].children[2].children[0].dataset.date, '2026-12-01');
  assert.equal(weeks[4].children[2].children.length, 0);
  assert.equal(f.button('2026-11-10').children[0].textContent, '10');
  assert.match(f.button('2026-11-10').children[1].textContent, /500,00\/h/u);
  assert.equal(f.button('2026-11-11').disabled, true);
  assert.equal(f.button('2026-11-11').children[1].textContent, '');
  assert.equal(f.button('2026-11-10').dataset.priceStep, '0');
  assert.equal(f.button('2026-12-01').dataset.priceStep, '10');
  assert.equal(f.elements.get('reserve-date').disabled, true);
  f.select();
  assert.equal(f.button('2026-11-10').attributes['aria-pressed'], 'true');
  assert.equal(f.elements.get('reserve-date').disabled, false);
});

test('past and unlisted weekdays render as unavailable and cannot create a reservation', async () => {
  let reservations = 0;
  const f = fixture({ calendar: async () => ({ days: [days[0]] }), reserveDate: async () => { reservations++; } });
  await f.app.load();
  for (const date of ['2026-11-02', '2026-11-09', '2026-11-30']) {
    const button = f.button(date);
    assert.equal(button.disabled, true);
    assert.equal(button.dataset.priceStep, 'unavailable');
    assert.equal(button.children[0].textContent, String(Number(date.slice(8))));
    assert.equal(button.children[1].textContent, '');
    assert.match(button.attributes['aria-label'], /não disponível/u);
    f.select(date);
    await f.reserve();
    assert.equal(button.attributes['aria-pressed'], 'false');
  }
  assert.equal(f.elements.get('reserve-date').disabled, true);
  assert.equal(reservations, 0);
  assert.equal(f.idCount(), 0);
});

test('a Monday-start month keeps all dates in the matching seven-column weekday', async () => {
  const f = fixture({ calendar: async () => ({ today: '2027-02-01', days: [
    { date: '2027-02-01', available: true, priceCents: 50000, pricePosition: 0 },
    { date: '2027-02-26', available: true, priceCents: 37500, pricePosition: 1 },
  ] }) });
  await f.app.load();
  const table = f.elements.get('appointment-calendar').children[0].children[1];
  const weeks = table.children[1].children;
  assert.equal(weeks.length, 5);
  assert.equal(weeks[0].children[1].children[0].dataset.date, '2027-02-01');
  assert.equal(weeks[3].children[5].children[0].dataset.date, '2027-02-26');
  assert.equal(table.querySelectorAll('button').length, 28);
  assert.equal(f.button('2027-02-01').disabled, true, 'Today remains blocked even if a quote marks it available');
  assert.equal(f.buttons().filter((button) => !button.disabled).length, 1);
  assert.ok(weeks.every((week) => week.children.length === 7));
});

test('a booking submits only the selected quote, prevents duplicate clicks, then refreshes the calendar', async () => {
  let resolve;
  let reads = 0;
  const calls = [];
  const f = fixture({ calendar: async () => { reads++; return { days }; }, reserveDate: (body) => { calls.push(JSON.parse(JSON.stringify(body))); return new Promise((done) => { resolve = done; }); } });
  await f.app.load();
  f.select();
  const first = f.reserve();
  assert.equal(f.elements.get('reserve-date').textContent, 'Reservando...');
  await f.reserve();
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { date: '2026-11-10', priceCents: 50000, requestId: '00000000-0000-4000-8000-000000000001', acknowledged: true });
  resolve({ date: '2026-11-10', reserved: true });
  await first;
  assert.equal(reads, 3);
  assert.equal(f.elements.get('appointments-message').textContent, 'Data reservada.');
  assert.equal(f.elements.get('reserve-date').disabled, true);
});

test('an uncertain failure retries the same request ID rather than creating another reservation', async () => {
  const requests = [];
  const f = fixture({ calendar: async () => ({ days }), reserveDate: async (body) => { requests.push(JSON.parse(JSON.stringify(body))); throw { status: 503, code: 'support_management.reservation_failed' }; } });
  await f.app.load();
  f.select();
  await f.reserve();
  await f.reserve();
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0], requests[1]);
  assert.equal(f.idCount(), 1);
  assert.equal(f.elements.get('reserve-date').disabled, false);
});

test('returning to the calendar while a reservation is pending preserves its request until the response settles', async () => {
  let resolve;
  let reads = 0;
  let submitted = false;
  const calls = [];
  const f = fixture({
    calendar: async () => {
      reads++;
      return { days: !submitted ? days : days.map((day) => ({ ...day, available: false, priceCents: null, pricePosition: null })) };
    },
    reserveDate: (body) => {
      submitted = true;
      calls.push(JSON.parse(JSON.stringify(body)));
      return new Promise((done) => { resolve = done; });
    },
  });
  await f.app.load();
  f.select();
  const pending = f.reserve();
  assert.equal(await f.app.load(), false);
  assert.equal(reads, 2);
  assert.equal(f.elements.get('reserve-date').disabled, true);
  assert.equal(f.button('2026-11-10').attributes['aria-pressed'], 'true');
  await f.reserve();
  resolve({ date: '2026-11-10', reserved: true });
  await pending;
  assert.equal(calls.length, 1);
  assert.equal(f.idCount(), 1);
  assert.equal(reads, 3);
  assert.equal(f.elements.get('appointments-message').textContent, 'Data reservada.');
  assert.equal(f.button('2026-11-10').disabled, true);
  assert.equal(f.elements.get('reserve-date').disabled, true);
});

for (const reason of ['date_unavailable', 'price_changed']) {
  test(`${reason} clears the stale selection and refreshes authoritative dates`, async () => {
    let reads = 0;
    const f = fixture({ calendar: async () => { reads++; return { days }; }, reserveDate: async () => { throw { status: 409, code: `support_management.${reason}` }; } });
    await f.app.load();
    f.select();
    await f.reserve();
    assert.equal(reads, 3);
    assert.equal(f.elements.get('reserve-date').disabled, true);
    assert.equal(f.buttons().some((button) => button.attributes['aria-pressed'] === 'true'), false);
    assert.match(f.elements.get('appointments-message').textContent, reason === 'price_changed' ? /preço/u : /não está mais disponível/u);
  });
}

test('a reservation requiring review blocks repeats and a pending notification is not described as delivered', async () => {
  let calls = 0;
  const f = fixture({ calendar: async () => ({ days }), reserveDate: async () => { calls++; throw { status: 409, code: 'support_management.reservation_review_required' }; } });
  await f.app.load();
  f.select();
  await f.reserve();
  await f.reserve();
  assert.equal(calls, 1);
  assert.equal(f.elements.get('reserve-date').disabled, true);
  const pending = fixture({ calendar: async () => ({ days }), reserveDate: async () => ({ date: '2026-11-10', reserved: true, notificationPending: true }) });
  await pending.app.load();
  pending.select();
  await pending.reserve();
  assert.match(pending.elements.get('appointments-message').textContent, /notificações está pendente/u);
});

test('session expiry is delegated to authentication and malformed calendars fail closed', async () => {
  const expired = fixture({ calendar: async () => { throw { status: 401 }; } });
  assert.equal(await expired.app.load(), false);
  assert.equal(expired.failures.length, 1);
  for (const invalid of [undefined, { days: [{ ...days[0], priceCents: -1 }] }, { days: [days[0], days[0]] }]) {
    const f = fixture({ calendar: async () => invalid });
    assert.equal(await f.app.load(), false);
    assert.equal(f.elements.get('appointment-calendar').hidden, true);
    assert.equal(f.elements.get('appointments-faq').hidden, true);
    assert.equal(f.elements.get('reserve-date').disabled, true);
  }
});


test('a missing company payment method shows the named administrator gate and hides appointment content', async () => {
  const f = fixture({ calendar: async () => ({ days, paymentMethodRegistered: false, administratorName: 'Maria da Silva', userEmail: 'colleague@example.test' }) });
  await f.app.load();
  assert.equal(f.elements.get('appointments-gate').hidden, false);
  assert.equal(f.elements.get('payment-administrator-name').textContent, 'Maria da Silva');
  assert.equal(f.elements.get('appointments-intro').hidden, true);
  assert.equal(f.elements.get('appointments-faq').hidden, true);
  assert.equal(f.elements.get('appointment-calendar').hidden, true);
  assert.equal(f.elements.get('appointment-details').hidden, true);
  assert.equal(f.elements.get('reserve-date').hidden, true);
});

test('selection reveals its formatted details and requires the acknowledgement before any reservation request', async () => {
  let writes = 0;
  const f = fixture({ calendar: async () => ({ days }), reserveDate: async () => { writes++; } });
  await f.app.load();
  assert.equal(f.elements.get('appointment-details').hidden, true);
  f.select('2026-11-10', false);
  assert.equal(f.elements.get('appointment-details').hidden, false);
  assert.equal(f.elements.get('appointment-details').scrollOptions.behavior, 'instant');
  assert.equal(f.elements.get('appointment-details').scrollOptions.block, 'start');
  assert.equal(f.elements.get('appointment-details').focusOptions.preventScroll, true);
  assert.equal(f.elements.get('selected-appointment-date').textContent, '10/NOV/2026 09:00');
  assert.match(f.elements.get('selected-appointment-price').textContent, /500,00/u);
  assert.equal(f.elements.get('appointment-confirmation-email').textContent, 'user@example.test');
  assert.equal(f.elements.get('reserve-date').disabled, true);
  await f.reserve();
  assert.equal(writes, 0);
  assert.equal(f.idCount(), 0);
  f.acknowledge();
  assert.equal(f.elements.get('reserve-date').disabled, false);
  f.button('2026-11-10').listeners.click();
  assert.equal(f.elements.get('reservation-acknowledged').checked, true, 'Selecting the same quote must preserve consent');
  f.select('2026-12-01', false);
  assert.equal(f.elements.get('reservation-acknowledged').checked, false);
  assert.equal(f.elements.get('reserve-date').disabled, true);
});

test('past dates, today and weekends stay gray while eligible dates through next month remain selectable', async () => {
  const invalidQuote = { available: true, priceCents: 50000, pricePosition: 0 };
  const f = fixture({ calendar: async () => ({ days: [
    { ...invalidQuote, date: '2026-11-08' },
    { ...invalidQuote, date: '2026-11-09' },
    { ...invalidQuote, date: '2026-11-14' },
    { ...invalidQuote, date: '2026-12-10' },
    { ...invalidQuote, date: '2026-12-31' },
    { ...invalidQuote, date: '2027-01-01' },
  ] }) });
  await f.app.load();
  for (const date of ['2026-11-08', '2026-11-09', '2026-11-14']) {
    assert.equal(f.button(date).disabled, true);
    assert.equal(f.button(date).dataset.priceStep, 'unavailable');
    assert.equal(f.button(date).children[1].textContent, '');
  }
  for (const date of ['2026-12-10', '2026-12-31']) {
    assert.equal(f.button(date).disabled, false);
    assert.equal(f.button(date).dataset.priceStep, '0');
    assert.match(f.button(date).children[1].textContent, /500,00\/h/u);
  }
  assert.equal(f.button('2027-01-01'), undefined, 'A later month cannot extend the rendered window');
});

test('the login bootstrap renders immediately and tab revisits do not repeat calendar reads', async () => {
  let reads = 0;
  const f = fixture({ calendar: async () => { reads++; return { days }; } });
  const bootstrap = { days, today: '2026-11-09', paymentMethodRegistered: true, administratorName: 'Maria', userEmail: 'user@example.test' };
  assert.equal(await f.app.load(bootstrap), true);
  assert.equal(reads, 0);
  await f.app.load();
  await f.app.load();
  assert.equal(reads, 0);
  f.app.invalidate();
  await f.app.load();
  assert.equal(reads, 1);
});

test('the fresh preflight blocks a changed quote before writing and clears acknowledgement', async () => {
  let reads = 0;
  let writes = 0;
  const f = fixture({
    calendar: async () => ({ days: reads++ ? days.map(day => day.available ? { ...day, priceCents: day.priceCents + 100 } : day) : days }),
    reserveDate: async () => { writes++; },
  });
  await f.app.load();
  f.select();
  await f.reserve();
  assert.equal(reads, 2);
  assert.equal(writes, 0);
  assert.equal(f.idCount(), 0);
  assert.equal(f.elements.get('reservation-acknowledged').checked, false);
  assert.equal(f.elements.get('appointment-details').hidden, true);
});

test('uncertain booking replay retains its request ID when the fresh calendar now shows its own date unavailable', async () => {
  const calls = [];
  const f = fixture({
    calendar: async () => ({ days: calls.length ? days.map(day => ({ ...day, available: false, priceCents: null, pricePosition: null })) : days }),
    reserveDate: async body => { calls.push(JSON.parse(JSON.stringify(body))); throw { status: 503 }; },
  });
  await f.app.load();
  f.select();
  await f.reserve();
  await f.reserve();
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(calls[0].acknowledged, true);
  assert.equal(f.idCount(), 1);
});


test('empty API dates still render exactly the current month and the next month at the beginning of a month', async () => {
  const f = fixture({ calendar: async () => ({ today: '2026-11-01', days: [] }) });
  await f.app.load();
  const blocks = f.elements.get('appointment-calendar').children;
  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks.map(block => block.children[0].textContent), ['Novembro de 2026', 'Dezembro de 2026']);
  assert.equal(f.buttons().length, 61);
  assert.ok(f.buttons().every(button => button.disabled));
  assert.equal(f.elements.get('appointment-calendar').hidden, false);
});

test('the two-month window rolls over December into January without including February', async () => {
  const f = fixture({ calendar: async () => ({ today: '2026-12-31', days: [
    { date: '2027-01-29', available: true, priceCents: 37500, pricePosition: 1 },
    { date: '2027-02-01', available: true, priceCents: 37500, pricePosition: 1 },
  ] }) });
  await f.app.load();
  const blocks = f.elements.get('appointment-calendar').children;
  assert.deepEqual(blocks.map(block => block.children[0].textContent), ['Dezembro de 2026', 'Janeiro de 2027']);
  assert.equal(f.button('2027-01-29').disabled, false);
  assert.equal(f.button('2027-01-31').disabled, true);
  assert.equal(f.button('2027-02-01'), undefined);
});

test('booking preflight accepts an eligible date at the end of next month beyond the former thirty-day cap', async () => {
  let reads = 0;
  const requests = [];
  const f = fixture({
    calendar: async () => { reads++; return { days: [{ date: '2026-12-31', available: true, priceCents: 37500, pricePosition: 1 }] }; },
    reserveDate: async body => { requests.push(JSON.parse(JSON.stringify(body))); return { reserved: true, date: body.date }; },
  });
  await f.app.load();
  f.select('2026-12-31');
  await f.reserve();
  assert.equal(reads, 3);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0], { date: '2026-12-31', priceCents: 37500, requestId: '00000000-0000-4000-8000-000000000001', acknowledged: true });
});

test('the FAQ follows payment readiness and inserts its confirmation email as plain text', async () => {
  const email = '<img src=x onerror=example>@example.test';
  const f = fixture({ calendar: async () => ({ days, userEmail: email }) });
  await f.app.load();
  assert.equal(f.elements.get('appointments-faq').hidden, false);
  assert.equal(f.elements.get('appointment-confirmation-email').textContent, email);
  assert.equal(f.elements.get('appointment-confirmation-email').children.length, 0);
  assert.equal(f.elements.get('appointment-confirmation-email').innerHTML, undefined);
});
