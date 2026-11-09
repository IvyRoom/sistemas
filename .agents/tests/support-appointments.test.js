'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function fixture(client, options = {}) {
  function element(tagName = 'div') {
    return { tagName, children: [], dataset: {}, attributes: {}, listeners: {}, disabled: false, hidden: false, textContent: '', colSpan: 1,
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(key, callback) { this.listeners[key] = callback; },
      querySelectorAll(selector) { return this.children.flatMap((child) => [ ...(child.tagName === selector ? [child] : []), ...child.querySelectorAll(selector) ]); },
    };
  }
  const elements = new Map(['calendar-months', 'calendar-weekdays', 'calendar-days', 'appointment-calendar', 'reserve-date', 'appointments-message'].map((id) => [id, element()]));
  let ids = 0;
  const failures = [];
  const context = vm.createContext({ Intl, document: { getElementById: (id) => elements.get(id), createElement: element } });
  const source = fs.readFileSync(path.join(__dirname, '../../apps/support-management/modules/appointments.js'), 'utf8');
  vm.runInContext(`${source.replace(/export /gu, '')}\nglobalThis.create = createAppointments;`, context);
  const app = context.create({ client, onAuthFailure(error) { failures.push(error); return error.status === 401; },
    requestId: () => `00000000-0000-4000-8000-${String(++ids).padStart(12, '0')}`, ...options,
  });
  const buttons = () => elements.get('calendar-days').querySelectorAll('button');
  const select = (index) => buttons()[index].listeners.click();
  const reserve = () => elements.get('reserve-date').listeners.click();
  return { app, elements, buttons, select, reserve, failures, idCount: () => ids };
}

const days = [
  { date: '2026-11-10', available: true, priceCents: 50000, pricePosition: 0 },
  { date: '2026-11-11', available: false, priceCents: null, pricePosition: null },
  { date: '2026-12-01', available: true, priceCents: 37500, pricePosition: 1 },
];

test('calendar shows grouped months, weekdays and server prices, disables unavailable dates and selects a quote', async () => {
  const f = fixture({ calendar: async () => ({ days }) });
  await f.app.load();
  assert.deepEqual(f.elements.get('calendar-months').children.map((cell) => cell.colSpan), [2, 1]);
  assert.equal(f.elements.get('calendar-weekdays').children.length, 3);
  assert.equal(f.buttons()[0].children[0].textContent, '10');
  assert.match(f.buttons()[0].children[1].textContent, /500,00\/h/u);
  assert.equal(f.buttons()[1].disabled, true);
  assert.equal(f.buttons()[1].children[1].textContent, 'INDISPONÍVEL');
  assert.equal(f.buttons()[0].dataset.priceStep, '0');
  assert.equal(f.buttons()[2].dataset.priceStep, '10');
  assert.equal(f.elements.get('reserve-date').disabled, true);
  f.select(0);
  assert.equal(f.buttons()[0].attributes['aria-pressed'], 'true');
  assert.equal(f.elements.get('reserve-date').disabled, false);
});

test('a booking submits only the selected quote, prevents duplicate clicks, then refreshes the calendar', async () => {
  let resolve;
  let reads = 0;
  const calls = [];
  const f = fixture({ calendar: async () => { reads++; return { days }; }, reserveDate: (body) => { calls.push(JSON.parse(JSON.stringify(body))); return new Promise((done) => { resolve = done; }); } });
  await f.app.load();
  f.select(0);
  const first = f.reserve();
  assert.equal(f.elements.get('reserve-date').textContent, 'Reservando...');
  await f.reserve();
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { date: '2026-11-10', priceCents: 50000, requestId: '00000000-0000-4000-8000-000000000001' });
  resolve({ date: '2026-11-10', reserved: true });
  await first;
  assert.equal(reads, 2);
  assert.equal(f.elements.get('appointments-message').textContent, 'Data reservada.');
  assert.equal(f.elements.get('reserve-date').disabled, true);
});

test('an uncertain failure retries the same request ID rather than creating another reservation', async () => {
  const requests = [];
  const f = fixture({ calendar: async () => ({ days }), reserveDate: async (body) => { requests.push(JSON.parse(JSON.stringify(body))); throw { status: 503, code: 'support_management.reservation_failed' }; } });
  await f.app.load();
  f.select(0);
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
  const calls = [];
  const f = fixture({
    calendar: async () => {
      reads++;
      return { days: reads === 1 ? days : days.map((day) => ({ ...day, available: false, priceCents: null, pricePosition: null })) };
    },
    reserveDate: (body) => {
      calls.push(JSON.parse(JSON.stringify(body)));
      return new Promise((done) => { resolve = done; });
    },
  });
  await f.app.load();
  f.select(0);
  const pending = f.reserve();
  assert.equal(await f.app.load(), false);
  assert.equal(reads, 1);
  assert.equal(f.elements.get('reserve-date').disabled, true);
  assert.equal(f.buttons()[0].attributes['aria-pressed'], 'true');
  await f.reserve();
  resolve({ date: '2026-11-10', reserved: true });
  await pending;
  assert.equal(calls.length, 1);
  assert.equal(f.idCount(), 1);
  assert.equal(reads, 2);
  assert.equal(f.elements.get('appointments-message').textContent, 'Data reservada.');
  assert.equal(f.buttons()[0].disabled, true);
  assert.equal(f.elements.get('reserve-date').disabled, true);
});

for (const reason of ['date_unavailable', 'price_changed']) {
  test(`${reason} clears the stale selection and refreshes authoritative dates`, async () => {
    let reads = 0;
    const f = fixture({ calendar: async () => { reads++; return { days }; }, reserveDate: async () => { throw { status: 409, code: `support_management.${reason}` }; } });
    await f.app.load();
    f.select(0);
    await f.reserve();
    assert.equal(reads, 2);
    assert.equal(f.elements.get('reserve-date').disabled, true);
    assert.equal(f.buttons().some((button) => button.attributes['aria-pressed'] === 'true'), false);
    assert.match(f.elements.get('appointments-message').textContent, reason === 'price_changed' ? /preço/u : /não está mais disponível/u);
  });
}

test('a reservation requiring review blocks repeats and a pending notification is not described as delivered', async () => {
  let calls = 0;
  const f = fixture({ calendar: async () => ({ days }), reserveDate: async () => { calls++; throw { status: 409, code: 'support_management.reservation_review_required' }; } });
  await f.app.load();
  f.select(0);
  await f.reserve();
  await f.reserve();
  assert.equal(calls, 1);
  assert.equal(f.elements.get('reserve-date').disabled, true);
  const pending = fixture({ calendar: async () => ({ days }), reserveDate: async () => ({ date: '2026-11-10', reserved: true, notificationPending: true }) });
  await pending.app.load();
  pending.select(0);
  await pending.reserve();
  assert.match(pending.elements.get('appointments-message').textContent, /notificações está pendente/u);
});

test('session expiry is delegated to authentication and malformed or weekend calendars fail closed', async () => {
  const expired = fixture({ calendar: async () => { throw { status: 401 }; } });
  assert.equal(await expired.app.load(), false);
  assert.equal(expired.failures.length, 1);
  for (const invalid of [undefined, { days: [{ ...days[0], date: '2026-11-14' }] }, { days: [{ ...days[0], priceCents: -1 }] }, { days: [days[0], days[0]] }]) {
    const f = fixture({ calendar: async () => invalid });
    assert.equal(await f.app.load(), false);
    assert.equal(f.elements.get('appointment-calendar').hidden, true);
    assert.equal(f.elements.get('reserve-date').disabled, true);
  }
});
