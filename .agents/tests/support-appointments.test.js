'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function fixture(client, options = {}) {
  const view = { innerWidth: 1280, innerHeight: 800, listeners: {},
    addEventListener(name, callback, capture) { this.listeners[name] = { callback, capture }; } };
  const document = { activeElement: undefined, defaultView: view };
  function element(tagName = 'div') {
    return { tagName, children: [], dataset: {}, attributes: {}, listeners: {}, style: {}, disabled: false, hidden: false, open: false, inert: false, textContent: '', colSpan: 1,
      bounds: { left: 10, right: 300, top: 10, bottom: 300, width: 290, height: 290 },
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(key, callback) { this.listeners[key] = callback; },
      focus(options) { this.focusOptions = options; document.activeElement = this; },
      showModal() { this.open = true; this.showCount = (this.showCount || 0) + 1; },
      close() { this.open = false; this.listeners.close?.(); },
      getBoundingClientRect() { return this.bounds; },
      querySelectorAll(selector) { return this.children.flatMap((child) => [ ...(child.tagName === selector ? [child] : []), ...child.querySelectorAll(selector) ]); },
    };
  }
  const elements = new Map(['appointment-calendar', 'reserve-date', 'appointments-message', 'appointments-gate', 'appointments-intro', 'appointments-faq', 'calendar-legend', 'appointment-details', 'reservation-content', 'reservation-overview', 'reservation-initial-step', 'reservation-confirm-step', 'reservation-status-step', 'reservation-status', 'reservation-warning', 'confirm-reservation', 'cancel-reservation', 'close-reservation', 'reservation-message', 'selected-appointment-date', 'selected-appointment-price', 'payment-administrator-name', 'appointment-confirmation-email'].map((id) => [id, element()]));
  const markup = fs.readFileSync(path.join(__dirname, '../../apps/support-management/scheduler/index.html'), 'utf8');
  for (const [, attributes, id] of markup.matchAll(/<[a-z][a-z0-9]*\b([^>]*\bid="([^"]+)"[^>]*)>/gu)) {
    if (elements.has(id)) elements.get(id).hidden = /(?:^|\s)hidden(?:\s|$)/u.test(attributes);
  }
  elements.get('appointments-message').textContent = markup.match(/id="appointments-message"[^>]*>([^<]*)<\/p>/u)?.[1] || '';
  document.body = element('body');
  let ids = 0;
  const failures = [];
  Object.assign(document, { getElementById: (id) => elements.get(id), createElement: element });
  const context = vm.createContext({ Intl, document });
  const source = fs.readFileSync(path.join(__dirname, '../../apps/support-management/modules/appointments.js'), 'utf8');
  vm.runInContext(`${source.replace(/export /gu, '')}\nglobalThis.create = createAppointments;`, context);
  const connectedClient = { ...client, async calendar(...args) {
    const result = await client.calendar(...args);
    return result && Array.isArray(result.days) ? { today: '2026-11-09', paymentMethodRegistered: true, canBook: true, administratorName: 'Administradora Exemplo', userEmail: 'user@example.test', ...result } : result;
  } };
  const app = context.create({ client: connectedClient, onAuthFailure(error) { failures.push(error); return error.status === 401; },
    requestId: () => `00000000-0000-4000-8000-${String(++ids).padStart(12, '0')}`, ...options,
  });
  const buttons = () => elements.get('appointment-calendar').querySelectorAll('button');
  const button = (date) => buttons().find((item) => item.dataset.date === date);
  const select = (date = '2026-11-10') => button(date).listeners.click();
  const start = () => elements.get('reserve-date').listeners.click();
  const confirm = () => elements.get('confirm-reservation').listeners.click();
  const reserve = () => { start(); return confirm(); };
  const cancel = () => elements.get('cancel-reservation').listeners.click();
  const close = () => elements.get('close-reservation').listeners.click();
  const escape = () => {
    const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    elements.get('appointment-details').listeners.cancel(event);
    if (!event.defaultPrevented) elements.get('appointment-details').close();
    return event;
  };
  const backdrop = (clientX = 0, clientY = 0) => {
    const details = elements.get('appointment-details');
    details.listeners.click({ target: details, clientX, clientY });
  };
  return { app, document, view, elements, buttons, button, select, start, confirm, reserve, cancel, close, escape, backdrop, failures, idCount: () => ids };
}

const days = [
  { date: '2026-11-10', available: true, priceCents: 50000, pricePosition: 0 },
  { date: '2026-11-11', available: false, priceCents: null, pricePosition: null },
  { date: '2026-12-01', available: true, priceCents: 37500, pricePosition: 1 },
];

test('the initial scheduler shows only its loading status until authoritative calendar data arrives', async () => {
  const response = deferred();
  let reads = 0;
  const f = fixture({ calendar: () => { reads++; return response.promise; } });
  const hiddenTools = ['appointments-intro', 'appointment-calendar', 'calendar-legend', 'appointments-faq', 'appointments-gate'];
  assert.equal(f.elements.get('appointments-message').textContent, 'Carregando...');
  assert.equal(f.elements.get('appointments-message').hidden, false);
  for (const id of hiddenTools) assert.equal(f.elements.get(id).hidden, true, `${id} must be hidden before session bootstrap`);
  const pending = f.app.load();
  for (const id of hiddenTools) assert.equal(f.elements.get(id).hidden, true);
  assert.equal(f.elements.get('appointments-message').hidden, false);
  assert.equal(f.elements.get('appointment-calendar').attributes['aria-busy'], 'true');
  response.resolve({ days });
  assert.equal(await pending, true);
  assert.equal(reads, 1);
  assert.equal(f.elements.get('appointments-message').hidden, true);
  assert.equal(f.elements.get('appointments-message').textContent, '');
  for (const id of hiddenTools.slice(0, 4)) assert.equal(f.elements.get(id).hidden, false);
  assert.equal(f.elements.get('appointments-gate').hidden, true);
});

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
  assert.match(f.button('2026-11-10').children[1].textContent, /500,00$/u);
  assert.doesNotMatch(f.button('2026-11-10').children[1].textContent, /\/h/u);
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

test('confirmation submits the quote immediately and keeps a locked success popup while the calendar refreshes', async () => {
  let resolve;
  let reads = 0;
  let reserved = false;
  const readOptions = [];
  const calls = [];
  const f = fixture({ calendar: async (options) => {
    reads++; readOptions.push(options?.fresh === true);
    return { days: reserved ? days.map(day => day.date === '2026-11-10' ? { ...day, available: false, priceCents: null, pricePosition: null } : day) : days };
  }, reserveDate: (body) => { calls.push(JSON.parse(JSON.stringify(body))); return new Promise((done) => { resolve = done; }); } });
  await f.app.load();
  f.select();
  const first = f.reserve();
  assert.equal(f.elements.get('reservation-status').textContent, 'Reservando...');
  assert.equal(f.elements.get('reservation-content').dataset.activeStep, 'busy');
  assert.equal(f.document.body.dataset.reserving, 'true');
  assert.equal(f.elements.get('close-reservation').hidden, true);
  assert.equal(reads, 1, 'The server validates the quote without a second client calendar preflight');
  await f.reserve();
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { date: '2026-11-10', priceCents: 50000, requestId: '00000000-0000-4000-8000-000000000001', acknowledged: true });
  reserved = true;
  resolve({ date: '2026-11-10', reserved: true });
  await first;
  assert.equal(f.elements.get('reservation-status').textContent, 'Agendamento confirmado.');
  assert.equal(f.elements.get('appointment-details').open, true);
  assert.equal(f.elements.get('reservation-content').dataset.activeStep, 'complete');
  assert.equal(f.document.body.dataset.reserving, 'false');
  assert.equal(f.elements.get('close-reservation').hidden, false);
  assert.equal(f.document.activeElement, f.elements.get('close-reservation'));
  assert.equal(f.elements.get('appointments-message').textContent, '');
  assert.ok(f.buttons().every(button => button.disabled));
  await new Promise(done => setImmediate(done));
  assert.equal(reads, 2);
  assert.deepEqual(readOptions, [false, false]);
  assert.equal(f.elements.get('appointment-details').open, true, 'Removing the booked date from fresh availability must not close confirmation');
  assert.ok(f.buttons().every(button => button.disabled), 'Fresh calendar data stays locked until the confirmation closes');
  assert.equal(f.elements.get('reserve-date').disabled, true);
  f.close();
  assert.equal(f.elements.get('appointment-details').open, false);
  assert.equal(f.button('2026-11-10').disabled, true);
  assert.equal(f.button('2026-12-01').disabled, false);
  assert.equal(f.document.activeElement, f.elements.get('appointment-calendar'));
});

test('confirmation is immediate even while background availability is pending and closing waits for fresh dates', async () => {
  const refresh = deferred();
  let reads = 0;
  let writes = 0;
  const f = fixture({ calendar: async () => ++reads === 1 ? { days } : refresh.promise,
    reserveDate: async () => { writes++; return { reserved: true, date: '2026-11-10' }; } });
  await f.app.load();
  f.select();
  await f.reserve();
  assert.equal(f.elements.get('reservation-status').textContent, 'Agendamento confirmado.');
  assert.equal(f.elements.get('appointment-details').open, true);
  assert.equal(f.document.body.dataset.reserving, 'false');
  assert.equal(f.elements.get('close-reservation').disabled, false);
  assert.equal(f.elements.get('appointments-message').textContent, '');
  assert.equal(f.elements.get('reservation-message').textContent, '');
  assert.equal(f.elements.get('appointments-message').hidden, true);
  assert.equal(f.elements.get('appointment-calendar').hidden, false, 'A silent booking refresh must preserve the calendar behind its confirmation');
  assert.ok(f.buttons().every(button => button.disabled));
  f.select('2026-12-01');
  await f.confirm();
  assert.equal(writes, 1);
  assert.equal(f.button('2026-11-10').attributes['aria-pressed'], 'true');
  f.close();
  assert.equal(f.elements.get('appointment-details').open, false);
  assert.ok(f.buttons().every(button => button.disabled));
  assert.equal(f.document.activeElement, f.elements.get('appointment-calendar'));
  refresh.resolve({ days: days.map(day => day.date === '2026-11-10' ? { ...day, available: false, priceCents: null, pricePosition: null } : day) });
  await new Promise(done => setImmediate(done));
  assert.equal(reads, 2);
  assert.equal(f.button('2026-11-10').disabled, true);
  assert.equal(f.button('2026-12-01').disabled, false);
  assert.equal(f.elements.get('appointments-message').textContent, '');
});

test('a failed silent availability refresh cannot erase a confirmed booking or add outside popup copy', async () => {
  let reads = 0;
  let writes = 0;
  const f = fixture({ calendar: async () => {
    if (++reads === 2) throw { status: 503 };
    return { days };
  }, reserveDate: async () => { writes++; return { reserved: true, date: '2026-11-10', notificationPending: true }; } });
  await f.app.load();
  f.select();
  await f.reserve();
  await new Promise(done => setImmediate(done));
  assert.equal(f.elements.get('reservation-status').textContent, 'Agendamento confirmado.');
  assert.equal(f.elements.get('appointment-details').open, true);
  assert.equal(f.document.activeElement, f.elements.get('close-reservation'));
  assert.equal(f.elements.get('appointments-message').textContent, '');
  assert.equal(f.elements.get('reservation-message').textContent, '');
  assert.equal(f.elements.get('appointment-calendar').hidden, true);
  f.close();
  await new Promise(done => setImmediate(done));
  assert.equal(reads, 3);
  assert.equal(writes, 1);
  assert.equal(f.elements.get('appointment-calendar').hidden, false);
  assert.equal(f.button('2026-12-01').disabled, false);
  assert.equal(f.elements.get('appointments-message').textContent, '');
});

for (const closed of [false, true]) {
  test(`a late session bootstrap cannot restore a booked date ${closed ? 'after closing' : 'inside'} its confirmation popup`, async () => {
    let reads = 0;
    let writes = 0;
    let discarded = 0;
    const bookedDays = days.map(day => day.date === '2026-11-10' ? { ...day, available: false, priceCents: null, pricePosition: null } : day);
    const f = fixture({ calendar: async () => { reads++; return { days: bookedDays }; },
      discardBootstrap: () => { discarded++; },
      reserveDate: async () => { writes++; return { reserved: true, date: '2026-11-10' }; } });
    await f.app.load(readyCalendar);
    f.select();
    await f.reserve();
    await new Promise(done => setImmediate(done));
    if (closed) f.close();
    assert.equal(await f.app.load(readyCalendar), true);
    assert.equal(discarded, 1, 'Ignoring a late session response must also remove its stale persisted bootstrap');
    assert.equal(reads, 1, 'The late bootstrap must reuse the controller’s authoritative post-booking calendar');
    assert.equal(writes, 1);
    assert.equal(f.button('2026-11-10').dataset.available, 'false');
    assert.equal(f.button('2026-11-10').disabled, true);
    assert.equal(f.elements.get('appointment-details').open, !closed);
    assert.equal(f.elements.get('appointments-message').textContent, '');
    if (!closed) assert.equal(f.elements.get('reservation-status').textContent, 'Agendamento confirmado.');
    f.select();
    await f.confirm();
    assert.equal(writes, 1);
  });
}

test('a late bootstrap shares the pending post-booking refresh instead of replacing it or starting another read', async () => {
  const fresh = deferred();
  let reads = 0;
  let writes = 0;
  const f = fixture({ calendar: () => { reads++; return fresh.promise; },
    reserveDate: async () => { writes++; return { reserved: true, date: '2026-11-10' }; } });
  await f.app.load(readyCalendar);
  f.select();
  await f.reserve();
  const pending = f.app.load(readyCalendar);
  assert.equal(f.app.load(missingCard), pending);
  assert.equal(reads, 1);
  assert.equal(f.elements.get('reservation-status').textContent, 'Agendamento confirmado.');
  assert.ok(f.buttons().every(button => button.disabled));
  fresh.resolve({ days: days.map(day => day.date === '2026-11-10' ? { ...day, available: false, priceCents: null, pricePosition: null } : day) });
  assert.equal(await pending, true);
  assert.equal(reads, 1);
  assert.equal(writes, 1);
  assert.equal(f.button('2026-11-10').dataset.available, 'false');
  assert.equal(f.elements.get('appointment-details').open, true);
  assert.equal(f.elements.get('appointments-message').textContent, '');
});

test('after a post-booking refresh failure a supplied bootstrap still requires an authoritative retry', async () => {
  let reads = 0;
  const f = fixture({ calendar: async () => {
    if (++reads === 1) throw { status: 503 };
    return { days: [], paymentMethodRegistered: true, canBook: false };
  }, reserveDate: async () => ({ reserved: true, date: '2026-11-10' }) });
  await f.app.load(readyCalendar);
  f.select();
  await f.reserve();
  await new Promise(done => setImmediate(done));
  assert.equal(await f.app.load(readyCalendar), true);
  assert.equal(reads, 2);
  assert.equal(f.elements.get('appointments-gate').hidden, false);
  assert.equal(f.elements.get('appointment-calendar').hidden, true);
  assert.equal(f.elements.get('appointment-details').open, true);
  assert.equal(f.elements.get('reservation-status').textContent, 'Agendamento confirmado.');
  assert.equal(f.elements.get('appointments-message').textContent, '');
});

for (const result of [undefined, { reserved: false, date: '2026-11-10' }, { reserved: true, date: '2026-12-01' }]) {
  test(`an unconfirmed reservation response ${JSON.stringify(result)} never shows success and preserves its retry identity`, async () => {
    const requests = [];
    const f = fixture({ calendar: async () => ({ days }), reserveDate: async body => {
      requests.push(JSON.parse(JSON.stringify(body)));
      return requests.length === 1 ? result : { reserved: true, date: body.date };
    } });
    await f.app.load();
    f.select();
    await f.reserve();
    assert.equal(f.elements.get('reservation-content').dataset.activeStep, 'confirm');
    assert.match(f.elements.get('reservation-message').textContent, /Não foi possível confirmar/u);
    assert.equal(f.elements.get('reservation-warning').hidden, true);
    assert.equal(f.elements.get('appointments-message').textContent, '');
    assert.equal(f.document.body.dataset.reserving, 'false');
    assert.equal(f.document.activeElement, f.elements.get('cancel-reservation'));
    assert.equal(f.elements.get('close-reservation').hidden, false);
    await f.confirm();
    assert.deepEqual(requests[0], requests[1]);
    assert.equal(f.idCount(), 1);
    assert.equal(f.elements.get('reservation-status').textContent, 'Agendamento confirmado.');
  });
}

test('booking wait presentation clears on authentication failure and page exit without showing false success', async () => {
  const expired = fixture({ calendar: async () => ({ days }), reserveDate: async () => { throw { status: 401 }; } });
  await expired.app.load();
  expired.select();
  await expired.reserve();
  assert.equal(expired.failures.length, 1);
  assert.equal(expired.document.body.dataset.reserving, 'false');
  assert.notEqual(expired.elements.get('reservation-status').textContent, 'Agendamento confirmado.');
  const pending = deferred();
  let current = true;
  const f = fixture({ calendar: async () => ({ days }), reserveDate: () => pending.promise }, { isCurrent: () => current });
  await f.app.load();
  f.select();
  const request = f.reserve();
  assert.equal(f.document.body.dataset.reserving, 'true');
  current = false;
  f.view.listeners.pagehide.callback();
  assert.equal(f.document.body.dataset.reserving, 'false');
  pending.resolve({ reserved: true, date: '2026-11-10' });
  await request;
  assert.equal(f.document.body.dataset.reserving, 'false');
  assert.notEqual(f.elements.get('reservation-status').textContent, 'Agendamento confirmado.');
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
  assert.equal(f.elements.get('appointments-message').textContent, '');
  assert.match(f.elements.get('reservation-message').textContent, /Não foi possível confirmar/u);
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
  assert.equal(reads, 1);
  assert.equal(f.elements.get('reserve-date').disabled, true);
  assert.equal(f.button('2026-11-10').attributes['aria-pressed'], 'true');
  await f.reserve();
  resolve({ date: '2026-11-10', reserved: true });
  await pending;
  await new Promise(done => setImmediate(done));
  assert.equal(calls.length, 1);
  assert.equal(f.idCount(), 1);
  assert.equal(reads, 2);
  assert.equal(f.elements.get('appointments-message').textContent, '');
  assert.equal(f.elements.get('reservation-status').textContent, 'Agendamento confirmado.');
  assert.equal(f.elements.get('appointment-details').open, true);
  assert.equal(f.button('2026-11-10').disabled, true);
  assert.equal(f.elements.get('reserve-date').disabled, true);
});

for (const reason of ['date_unavailable', 'price_changed']) {
  test(`${reason} stays inside the popup and refreshes authoritative dates before another selection`, async () => {
    let reads = 0;
    const f = fixture({ calendar: async () => { reads++; return { days }; }, reserveDate: async () => { throw { status: 409, code: `support_management.${reason}` }; } });
    await f.app.load();
    f.select();
    await f.reserve();
    await new Promise(done => setImmediate(done));
    assert.equal(reads, 2);
    assert.equal(f.elements.get('reserve-date').disabled, true);
    assert.equal(f.elements.get('appointment-details').open, true);
    assert.match(f.elements.get('reservation-status').textContent, reason === 'price_changed' ? /preço/u : /não está mais disponível/u);
    assert.equal(f.elements.get('appointments-message').textContent, '');
    f.close();
    assert.equal(f.buttons().some((button) => button.attributes['aria-pressed'] === 'true'), false);
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
  assert.equal(pending.elements.get('reservation-status').textContent, 'Agendamento confirmado.');
  assert.equal(pending.elements.get('appointments-message').textContent, '');
  assert.doesNotMatch(pending.elements.get('reservation-status').textContent, /e-mail|notifica/u);
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


for (const source of ['network', 'bootstrap']) {
  for (const canBook of [false, true]) {
    test(`a missing company card shows its administrator and blocks scheduling from ${source} even with canBook ${canBook}`, async () => {
      let writes = 0;
      let reads = 0;
      const result = { days, today: '2026-11-09', paymentMethodRegistered: false, canBook, administratorName: 'Maria da Silva', userEmail: 'colleague@example.test' };
      const f = fixture({ calendar: async () => { reads++; return result; }, reserveDate: async () => { writes++; } });
      await f.app.load(source === 'bootstrap' ? result : undefined);
      assert.equal(reads, source === 'bootstrap' ? 0 : 1);
      assert.equal(f.elements.get('appointments-gate').hidden, false);
      assert.equal(f.elements.get('payment-administrator-name').textContent, 'Maria da Silva');
      for (const id of ['appointments-intro', 'appointments-faq', 'appointment-calendar', 'calendar-legend']) assert.equal(f.elements.get(id).hidden, true);
      f.select();
      await f.reserve();
      assert.equal(f.elements.get('appointment-details').open, false);
      assert.equal(f.elements.get('reserve-date').disabled, true);
      assert.equal(f.elements.get('confirm-reservation').disabled, true);
      assert.equal(writes, 0);
      assert.equal(f.idCount(), 0);
    });
  }
}

test('selection opens its formatted dialog and the first reserve step requests confirmation without calling the API', async () => {
  let reads = 0;
  let writes = 0;
  const f = fixture({ calendar: async () => { reads++; return { days }; }, reserveDate: async () => { writes++; } });
  await f.app.load();
  assert.equal(f.elements.get('appointment-details').open, false);
  f.select();
  assert.equal(f.elements.get('appointment-details').open, true);
  assert.equal(f.elements.get('appointment-details').showCount, 1);
  assert.equal(f.document.activeElement, f.elements.get('reserve-date'));
  assert.equal(f.elements.get('reserve-date').focusOptions.preventScroll, true);
  assert.equal(f.elements.get('selected-appointment-date').textContent, '10/nov/2026 09:00');
  assert.match(f.elements.get('selected-appointment-price').textContent, /500,00/u);
  assert.equal(f.elements.get('appointment-confirmation-email').textContent, 'user@example.test');
  assert.equal(f.elements.get('appointment-calendar').dataset.selected, 'true');
  assert.equal(f.button('2026-11-10').attributes['aria-pressed'], 'true');
  assert.equal(f.button('2026-12-01').attributes['aria-pressed'], 'false');
  assert.equal(f.elements.get('reserve-date').disabled, false);
  assert.equal(f.elements.get('reservation-content').dataset.activeStep, 'initial');
  assert.equal(f.elements.get('reservation-initial-step').inert, false);
  assert.equal(f.elements.get('reservation-initial-step').attributes['aria-hidden'], 'false');
  assert.equal(f.elements.get('reservation-confirm-step').inert, true);
  assert.equal(f.elements.get('reservation-confirm-step').attributes['aria-hidden'], 'true');
  assert.equal(f.elements.get('appointment-details').attributes['aria-describedby'], 'reservation-instructions');
  await f.confirm();
  assert.equal(reads, 1, 'Confirm cannot skip the first reserve step');
  await f.start();
  assert.equal(writes, 0);
  assert.equal(reads, 1, 'The first reserve step must not make a preflight request');
  assert.equal(f.idCount(), 0);
  assert.equal(f.elements.get('reservation-content').dataset.activeStep, 'confirm');
  assert.equal(f.elements.get('reservation-initial-step').inert, true);
  assert.equal(f.elements.get('reservation-initial-step').attributes['aria-hidden'], 'true');
  assert.equal(f.elements.get('reservation-confirm-step').inert, false);
  assert.equal(f.elements.get('reservation-confirm-step').attributes['aria-hidden'], 'false');
  assert.equal(f.elements.get('appointment-details').attributes['aria-describedby'], 'reservation-warning');
  for (const id of ['reservation-overview', 'reserve-date', 'reservation-warning', 'confirm-reservation', 'cancel-reservation']) {
    assert.equal(f.elements.get(id).hidden, false, 'Inactive step contents must retain their layout size');
  }
  assert.equal(f.document.activeElement, f.elements.get('cancel-reservation'));
  assert.equal(f.elements.get('cancel-reservation').focusOptions.preventScroll, true);
});

for (const dismissal of ['cancel', 'close', 'escape', 'backdrop']) {
  test(`${dismissal} dismisses the confirmation without writing and restores the selected day focus`, async () => {
    let reads = 0;
    let writes = 0;
    const f = fixture({ calendar: async () => { reads++; return { days }; }, reserveDate: async () => { writes++; } });
    await f.app.load();
    f.select();
    f.start();
    const event = f[dismissal]();
    if (dismissal === 'escape') assert.equal(event.defaultPrevented, true);
    assert.equal(f.elements.get('appointment-details').open, false);
    assert.equal(f.elements.get('appointment-calendar').dataset.selected, 'false');
    assert.ok(f.buttons().every(button => button.attributes['aria-pressed'] === 'false'));
    assert.equal(f.document.activeElement, f.button('2026-11-10'));
    assert.equal(f.button('2026-11-10').focusOptions.preventScroll, true);
    await f.confirm();
    assert.equal(reads, 1);
    assert.equal(writes, 0);
    assert.equal(f.idCount(), 0);
    f.select();
    assert.equal(f.elements.get('appointment-details').open, true);
    assert.equal(f.elements.get('reservation-content').dataset.activeStep, 'initial');
    assert.equal(f.elements.get('reservation-initial-step').inert, false);
    assert.equal(f.elements.get('reservation-confirm-step').inert, true);
    assert.equal(f.elements.get('appointment-details').attributes['aria-describedby'], 'reservation-instructions');
  });
}

test('the booking popup stays centered on the calendar across steps without collapsing its inactive panel', async () => {
  const request = deferred();
  const f = fixture({ calendar: async () => ({ days }), reserveDate: () => request.promise });
  const calendar = f.elements.get('appointment-calendar');
  const details = f.elements.get('appointment-details');
  calendar.bounds = { left: 300, top: 100, width: 800, height: 500 };
  details.bounds = { left: 0, top: 0, width: 400, height: 300 };
  await f.app.load();
  f.select();
  assert.deepEqual(details.style, { left: '500px', top: '200px' });
  const position = { ...details.style };
  f.start();
  assert.deepEqual(details.style, position);
  assert.equal(f.elements.get('reservation-initial-step').hidden, false);
  assert.equal(f.elements.get('reservation-confirm-step').hidden, false);
  assert.equal(f.elements.get('reservation-initial-step').inert, true);
  assert.equal(f.elements.get('reservation-confirm-step').inert, false);
  assert.equal(f.document.activeElement, f.elements.get('cancel-reservation'));
  const pending = f.confirm();
  assert.deepEqual(details.style, position);
  assert.equal(f.elements.get('reservation-status-step').hidden, false);
  assert.equal(f.elements.get('reservation-status-step').inert, false);
  assert.equal(f.elements.get('reservation-initial-step').inert, true);
  assert.equal(f.elements.get('reservation-confirm-step').inert, true);
  request.resolve({ reserved: true, date: '2026-11-10' });
  await pending;
  assert.deepEqual(details.style, position);
  assert.equal(f.elements.get('reservation-status-step').inert, false);
  assert.equal(details.open, true);
});

test('calendar-centered popup geometry clamps to the viewport and follows resize and captured scrolling only while open', async () => {
  const f = fixture({ calendar: async () => ({ days }) });
  const calendar = f.elements.get('appointment-calendar');
  const details = f.elements.get('appointment-details');
  f.view.innerWidth = 600;
  f.view.innerHeight = 500;
  calendar.bounds = { left: -250, top: -120, width: 1400, height: 1600 };
  details.bounds = { left: 0, top: 0, width: 400, height: 300 };
  await f.app.load();
  f.select();
  assert.deepEqual(details.style, { left: '192px', top: '192px' });
  f.view.innerWidth = 390;
  calendar.bounds = { left: 12, top: 100, width: 366, height: 800 };
  details.bounds.width = 350;
  details.bounds.height = 260;
  f.view.listeners.resize.callback();
  assert.deepEqual(details.style, { left: '20px', top: '232px' });
  assert.equal(f.view.listeners.scroll.capture, true);
  calendar.bounds.top = -600;
  f.view.listeners.scroll.callback();
  assert.equal(details.style.top, '8px');
  f.close();
  calendar.bounds.top = 100;
  f.view.listeners.scroll.callback();
  assert.equal(details.style.top, '8px', 'A closed popup must not reposition');
});

test('clicks inside the dialog content do not dismiss its selected quote', async () => {
  const f = fixture({ calendar: async () => ({ days }) });
  await f.app.load();
  f.select();
  f.backdrop(20, 20);
  const details = f.elements.get('appointment-details');
  details.listeners.click({ target: f.elements.get('reserve-date'), clientX: 0, clientY: 0 });
  assert.equal(details.open, true);
  assert.equal(f.elements.get('appointment-calendar').dataset.selected, 'true');
  assert.equal(f.button('2026-11-10').attributes['aria-pressed'], 'true');
});

test('submission hides every action and prevents dismissal or quote changes until the response settles', async () => {
  let reads = 0;
  let resolveReservation;
  const calls = [];
  const f = fixture({
    calendar: async () => { reads++; return { days }; },
    reserveDate: body => { calls.push(JSON.parse(JSON.stringify(body))); return new Promise(done => { resolveReservation = done; }); },
  });
  await f.app.load();
  f.select();
  f.start();
  const pending = f.confirm();
  const assertBusy = () => {
    f.cancel();
    f.close();
    assert.equal(f.escape().defaultPrevented, true);
    f.backdrop();
    f.select('2026-12-01');
    assert.equal(f.elements.get('appointment-details').open, true);
    assert.equal(f.elements.get('appointment-details').attributes['aria-busy'], 'true');
    assert.equal(f.elements.get('appointment-calendar').dataset.selected, 'true');
    assert.equal(f.elements.get('reservation-content').dataset.activeStep, 'busy');
    assert.equal(f.elements.get('reservation-initial-step').attributes['aria-hidden'], 'true');
    assert.equal(f.elements.get('reservation-confirm-step').attributes['aria-hidden'], 'true');
    assert.equal(f.elements.get('reservation-status-step').attributes['aria-hidden'], 'false');
    assert.equal(f.elements.get('reservation-status').textContent, 'Reservando...');
    assert.equal(f.elements.get('close-reservation').hidden, true);
    assert.equal(f.document.body.dataset.reserving, 'true');
    assert.equal(f.document.activeElement, f.elements.get('reservation-status'));
    assert.equal(f.button('2026-11-10').attributes['aria-pressed'], 'true');
    assert.equal(f.button('2026-12-01').attributes['aria-pressed'], 'false');
    for (const id of ['confirm-reservation', 'cancel-reservation', 'close-reservation']) assert.equal(f.elements.get(id).disabled, true);
  };
  assertBusy();
  assert.equal(calls.length, 1);
  assert.equal(f.idCount(), 1);
  assert.equal(reads, 1);
  assertBusy();
  await f.confirm();
  assert.equal(calls.length, 1);
  resolveReservation({ reserved: true, date: '2026-11-10' });
  await pending;
  assert.equal(f.elements.get('appointment-details').open, true);
  assert.equal(f.elements.get('reservation-status').textContent, 'Agendamento confirmado.');
  assert.equal(f.elements.get('appointment-details').attributes['aria-busy'], 'false');
  assert.equal(f.document.body.dataset.reserving, 'false');
  assert.equal(f.elements.get('close-reservation').hidden, false);
  assert.equal(calls.length, 1);
  await new Promise(done => setImmediate(done));
  assert.equal(reads, 2);
  f.close();
  assert.equal(f.elements.get('appointment-calendar').dataset.selected, 'false');
});

test('an uncertain reservation keeps its request ID after cancellation and reopening the same quote', async () => {
  const requests = [];
  const f = fixture({
    calendar: async () => ({ days }),
    reserveDate: async body => { requests.push(JSON.parse(JSON.stringify(body))); throw { status: 503 }; },
  });
  await f.app.load();
  f.select();
  await f.reserve();
  f.cancel();
  assert.equal(f.elements.get('appointment-details').open, false);
  assert.equal(f.elements.get('appointment-calendar').dataset.selected, 'false');
  f.select();
  await f.confirm();
  assert.equal(requests.length, 1, 'Reopening must require its first reserve step again');
  await f.reserve();
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0], requests[1]);
  assert.equal(f.idCount(), 1);
});

test('the server can reject an uncertain replay after its company card is removed without a new request ID', async () => {
  let reads = 0;
  const requests = [];
  const f = fixture({
    calendar: async () => ({ days, paymentMethodRegistered: ++reads === 1, administratorName: 'Maria da Silva' }),
    reserveDate: async body => {
      requests.push(JSON.parse(JSON.stringify(body)));
      throw requests.length === 1 ? { status: 503 } : { status: 403, code: 'support_management.payment_method_required' };
    },
  });
  await f.app.load();
  f.select();
  await f.reserve();
  assert.equal(requests.length, 1);
  await f.confirm();
  await new Promise(done => setImmediate(done));
  assert.equal(reads, 2);
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0], requests[1]);
  assert.equal(f.idCount(), 1);
  assert.equal(f.elements.get('appointment-details').open, true);
  assert.equal(f.elements.get('reservation-status').textContent, 'Não foi possível confirmar a reserva. Tente novamente.');
  assert.equal(f.elements.get('appointments-message').textContent, '');
  assert.equal(f.elements.get('appointments-gate').hidden, false);
  assert.equal(f.elements.get('payment-administrator-name').textContent, 'Maria da Silva');
  for (const id of ['appointments-intro', 'appointments-faq', 'appointment-calendar', 'calendar-legend']) assert.equal(f.elements.get(id).hidden, true);
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
    assert.match(f.button(date).children[1].textContent, /500,00$/u);
  }
  assert.equal(f.button('2027-01-01'), undefined, 'A later month cannot extend the rendered window');
});

test('the login bootstrap renders immediately and tab revisits do not repeat calendar reads', async () => {
  let reads = 0;
  const f = fixture({ calendar: async () => { reads++; return { days }; } });
  const bootstrap = { days, today: '2026-11-09', paymentMethodRegistered: true, canBook: true, administratorName: 'Maria', userEmail: 'user@example.test' };
  const cached = f.app.load(bootstrap);
  assert.equal(f.elements.get('appointments-intro').hidden, false, 'Usable bootstrap data must render synchronously');
  assert.equal(f.elements.get('appointment-calendar').hidden, false);
  assert.equal(f.elements.get('appointments-message').hidden, true);
  assert.equal(await cached, true);
  assert.equal(reads, 0);
  await f.app.load();
  await f.app.load();
  assert.equal(reads, 0);
  f.app.invalidate();
  await f.app.load();
  assert.equal(reads, 1);
});

const missingCard = { days: [], today: '2026-11-09', paymentMethodRegistered: false, canBook: false,
  administratorName: 'Maria', userEmail: 'user@example.test' };
const readyCalendar = { ...missingCard, days, paymentMethodRegistered: true, canBook: true };

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

for (const previous of ['ready', 'missing-card']) {
  test(`invalidating a ${previous} calendar leaves only the loading status until its refresh finishes`, async () => {
    const next = deferred();
    const f = fixture({ calendar: () => next.promise });
    await f.app.load(previous === 'ready' ? readyCalendar : missingCard);
    f.app.invalidate();
    for (const id of ['appointments-intro', 'appointment-calendar', 'calendar-legend', 'appointments-faq', 'appointments-gate']) {
      assert.equal(f.elements.get(id).hidden, true);
    }
    assert.equal(f.elements.get('appointments-message').hidden, false);
    assert.equal(f.elements.get('appointments-message').textContent, 'Carregando...');
    const pending = f.app.load();
    assert.equal(f.app.load(), pending);
    assert.equal(f.elements.get('appointments-intro').hidden, true);
    next.resolve(readyCalendar);
    assert.equal(await pending, true);
    assert.equal(f.elements.get('appointments-message').hidden, true);
    assert.equal(f.elements.get('appointments-intro').hidden, false);
    assert.equal(f.elements.get('appointment-calendar').hidden, false);
  });
}

for (const allowed of [false, true]) {
  test(`invalidating a missing-card gate hides it immediately and waits for fresh booking permission ${allowed}`, async () => {
    const next = deferred();
    let reads = 0;
    let writes = 0;
    const f = fixture({ calendar: () => { reads++; return next.promise; }, reserveDate: async () => { writes++; } });
    await f.app.load(missingCard);
    assert.equal(f.elements.get('appointments-gate').hidden, false);
    f.app.invalidate();
    assert.equal(f.elements.get('appointments-gate').hidden, true);
    assert.ok(f.buttons().every(button => button.disabled));
    f.select();
    assert.equal(f.elements.get('appointment-details').open, false);
    const pending = f.app.load();
    assert.equal(f.app.load(), pending, 'Tab revisits must share the current fresh request');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(reads, 1);
    assert.equal(f.elements.get('appointments-gate').hidden, true);
    assert.equal(f.elements.get('appointment-calendar').attributes['aria-busy'], 'true');
    assert.ok(f.buttons().every(button => button.disabled));
    next.resolve({ ...readyCalendar, canBook: allowed });
    assert.equal(await pending, true);
    assert.equal(f.elements.get('appointments-gate').hidden, allowed);
    assert.equal(f.elements.get('appointment-calendar').hidden, !allowed);
    if (allowed) assert.equal(f.button('2026-11-10').disabled, false);
    else {
      f.select();
      assert.equal(f.elements.get('appointment-details').open, false);
    }
    await f.app.load();
    assert.equal(reads, 1, 'A warmed authoritative result must be reusable without another request');
    assert.equal(writes, 0);
  });
}

for (const stale of ['missing-card', 'expired', 'malformed']) {
  for (const order of ['older-first', 'newer-first']) {
    test(`an invalidated ${stale} response settling ${order} cannot replace or finish a newer calendar load`, async () => {
      const previous = deferred();
      const current = deferred();
      let reads = 0;
      const f = fixture({ calendar: () => (++reads === 1 ? previous.promise : current.promise) });
      const oldLoad = f.app.load();
      await new Promise(resolve => setImmediate(resolve));
      f.app.invalidate();
      const newLoad = f.app.load();
      assert.notEqual(newLoad, oldLoad);
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(reads, 2);
      const settleOld = () => stale === 'expired' ? previous.reject({ status: 401 })
        : previous.resolve(stale === 'malformed' ? { days: null } : missingCard);
      if (order === 'older-first') {
        settleOld();
        assert.equal(await oldLoad, false);
        assert.equal(f.app.load(), newLoad, 'The old finally must not clear the newer request');
        assert.equal(f.elements.get('appointment-calendar').attributes['aria-busy'], 'true');
        assert.equal(f.elements.get('appointments-gate').hidden, true);
      }
      current.resolve(readyCalendar);
      assert.equal(await newLoad, true);
      if (order === 'newer-first') {
        settleOld();
        assert.equal(await oldLoad, false);
      }
      assert.equal(f.failures.length, 0, 'An obsolete failure must not expire the current view');
      assert.equal(f.elements.get('appointments-gate').hidden, true);
      assert.equal(f.elements.get('appointment-calendar').hidden, false);
      assert.equal(f.elements.get('appointment-calendar').attributes['aria-busy'], 'false');
      assert.equal(f.button('2026-11-10').disabled, false);
      assert.equal(f.elements.get('appointments-message').textContent, '');
      await f.app.load();
      assert.equal(reads, 2);
    });
  }
}

test('a failed fresh calendar stays closed and an older success cannot erase its error or interrupt an explicit retry', async () => {
  const previous = deferred();
  const current = deferred();
  const retry = deferred();
  const responses = [previous, current, retry];
  let reads = 0;
  const f = fixture({ calendar: () => responses[reads++].promise });
  await f.app.load(readyCalendar);
  f.select();
  f.app.invalidate();
  assert.equal(f.elements.get('reserve-date').disabled, true);
  const oldLoad = f.app.load();
  await new Promise(resolve => setImmediate(resolve));
  f.app.invalidate();
  const newLoad = f.app.load();
  await new Promise(resolve => setImmediate(resolve));
  current.reject({ status: 503 });
  assert.equal(await newLoad, false);
  for (const id of ['appointments-gate', 'appointment-calendar', 'calendar-legend', 'appointments-intro', 'appointments-faq']) assert.equal(f.elements.get(id).hidden, true);
  assert.match(f.elements.get('appointments-message').textContent, /Não foi possível carregar/u);
  assert.equal(f.elements.get('appointment-details').open, false);
  assert.ok(f.buttons().every(button => button.disabled));
  const retried = f.app.load();
  await new Promise(resolve => setImmediate(resolve));
  previous.resolve(readyCalendar);
  assert.equal(await oldLoad, false);
  assert.equal(f.app.load(), retried);
  assert.equal(f.elements.get('appointment-calendar').attributes['aria-busy'], 'true');
  assert.equal(f.elements.get('appointments-gate').hidden, true);
  retry.resolve(readyCalendar);
  assert.equal(await retried, true);
  assert.equal(f.elements.get('appointments-message').textContent, '');
  assert.equal(f.button('2026-11-10').disabled, false);
  assert.equal(reads, 3);
});

test('an authoritative bootstrap supersedes an older in-flight missing-card request', async () => {
  const previous = deferred();
  let reads = 0;
  const f = fixture({ calendar: () => { reads++; return previous.promise; } });
  const oldLoad = f.app.load();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(await f.app.load(readyCalendar), true);
  previous.resolve(missingCard);
  assert.equal(await oldLoad, false);
  assert.equal(f.elements.get('appointments-gate').hidden, true);
  assert.equal(f.button('2026-11-10').disabled, false);
  await f.app.load();
  assert.equal(reads, 1);
});

test('invalidating availability preserves an uncertain reservation identity when its refreshed quote remains unchanged', async () => {
  const requests = [];
  const f = fixture({ calendar: async () => ({ days }),
    reserveDate: async body => { requests.push(JSON.parse(JSON.stringify(body))); throw { status: 503 }; } });
  await f.app.load();
  f.select();
  await f.reserve();
  f.app.invalidate();
  assert.equal(f.elements.get('confirm-reservation').disabled, true);
  await f.app.load();
  assert.equal(f.elements.get('appointment-details').open, true);
  await f.reserve();
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0], requests[1]);
  assert.equal(f.idCount(), 1);
});

test('a server price rejection refreshes the changed quote and keeps its error inside the popup', async () => {
  let reads = 0;
  let writes = 0;
  const f = fixture({
    calendar: async () => ({ days: reads++ ? days.map(day => day.available ? { ...day, priceCents: day.priceCents + 100 } : day) : days }),
    reserveDate: async () => { writes++; throw { status: 409, code: 'support_management.price_changed' }; },
  });
  await f.app.load();
  f.select();
  await f.reserve();
  await new Promise(done => setImmediate(done));
  assert.equal(reads, 2);
  assert.equal(writes, 1);
  assert.equal(f.idCount(), 1);
  assert.equal(f.elements.get('appointment-details').open, true);
  assert.match(f.elements.get('reservation-status').textContent, /preço/u);
  assert.equal(f.elements.get('appointments-message').textContent, '');
  assert.match(f.button('2026-11-10').children[1].textContent, /501,00$/u);
  f.close();
  assert.equal(f.elements.get('appointment-calendar').dataset.selected, 'false');
});

test('uncertain booking replay retains its request ID and relies on the server instead of a client calendar preflight', async () => {
  const calls = [];
  let reads = 0;
  const f = fixture({
    calendar: async () => { reads++; return { days }; },
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
  assert.equal(reads, 1);
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

test('booking submits an eligible date at the end of next month beyond the former thirty-day cap', async () => {
  let reads = 0;
  const requests = [];
  const f = fixture({
    calendar: async () => { reads++; return { days: [{ date: '2026-12-31', available: true, priceCents: 37500, pricePosition: 1 }] }; },
    reserveDate: async body => { requests.push(JSON.parse(JSON.stringify(body))); return { reserved: true, date: body.date }; },
  });
  await f.app.load();
  f.select('2026-12-31');
  await f.reserve();
  await new Promise(done => setImmediate(done));
  assert.equal(reads, 2);
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

test('a verified company card does not expose availability or permit selection without booking permission', async () => {
  let writes = 0;
  const f = fixture({ calendar: async () => ({ days, paymentMethodRegistered: true, canBook: false }),
    reserveDate: async () => { writes++; } });
  await f.app.load();
  assert.equal(f.elements.get('appointments-gate').hidden, false);
  for (const id of ['appointments-intro', 'appointments-faq', 'appointment-calendar', 'calendar-legend']) assert.equal(f.elements.get(id).hidden, true);
  f.select();
  await f.reserve();
  assert.equal(f.elements.get('appointment-details').open, false);
  assert.equal(writes, 0);
});

test('a pre-permission cached calendar is discarded in favor of a fresh denied calendar', async () => {
  let reads = 0;
  const f = fixture({ calendar: async () => { reads++; return { days, paymentMethodRegistered: true, canBook: false }; } });
  await f.app.load({ days, today: '2026-11-09', paymentMethodRegistered: true });
  assert.equal(reads, 1);
  assert.equal(f.elements.get('appointments-gate').hidden, false);
});

test('a server permission rejection stays in the popup and refreshes its authoritative scheduling gate', async () => {
  let reads = 0;
  let writes = 0;
  const f = fixture({ calendar: async () => ({ days, paymentMethodRegistered: true, canBook: ++reads === 1 }),
    reserveDate: async () => { writes++; throw { status: 403, code: 'support_management.booking_permission_required' }; } });
  await f.app.load();
  f.select();
  await f.reserve();
  await new Promise(done => setImmediate(done));
  assert.equal(writes, 1);
  assert.equal(f.elements.get('appointment-details').open, true);
  assert.equal(f.elements.get('reservation-status').textContent, 'Não foi possível confirmar a reserva. Tente novamente.');
  assert.equal(f.elements.get('appointments-message').textContent, '');
  assert.equal(f.elements.get('appointments-gate').hidden, false);
});
