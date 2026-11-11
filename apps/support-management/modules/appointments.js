const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' });
const weekdayLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' });
const month = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthAbbreviation = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });
const dateLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' });
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dayMilliseconds = 86400000;

function parseDate(value) {
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(value) ? new Date(value + 'T12:00:00Z') : null;
  if (!date || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('calendar_unavailable');
  return date;
}

function parseCalendar(result) {
  if (!Array.isArray(result?.days) || typeof result.paymentMethodRegistered !== 'boolean' || typeof result.canBook !== 'boolean') throw new Error('calendar_unavailable');
  const today = parseDate(result.today);
  const endOfNextMonth = new Date(today);
  endOfNextMonth.setUTCMonth(today.getUTCMonth() + 2, 0);
  const lastDate = endOfNextMonth.toISOString().slice(0, 10);
  let previous = '';
  const days = result.days.map((day) => {
    const value = parseDate(day?.date);
    if (day.date <= previous || typeof day.available !== 'boolean'
      || (day.available && (!Number.isSafeInteger(day.priceCents) || day.priceCents <= 0
        || typeof day.pricePosition !== 'number' || day.pricePosition < 0 || day.pricePosition > 1 || !Number.isFinite(day.pricePosition)))
      || (!day.available && (day.priceCents !== null || day.pricePosition !== null))) throw new Error('calendar_unavailable');
    previous = day.date;
    const available = day.available && day.date > result.today && day.date <= lastDate && value.getUTCDay() !== 0 && value.getUTCDay() !== 6;
    return { date: day.date, available, priceCents: available ? day.priceCents : null, pricePosition: available ? day.pricePosition : null, value };
  });
  return { days, today, lastDate, paymentMethodRegistered: result.paymentMethodRegistered, canBook: result.canBook && result.paymentMethodRegistered,
    administratorName: typeof result.administratorName === 'string' ? result.administratorName : '',
    userEmail: typeof result.userEmail === 'string' ? result.userEmail : '' };
}

export function createAppointments({ client, onAuthFailure, isCurrent = () => true, document: doc = globalThis.document, requestId = () => globalThis.crypto.randomUUID() }) {
  const calendar = doc.getElementById('appointment-calendar');
  const reserve = doc.getElementById('reserve-date');
  const message = doc.getElementById('appointments-message');
  const gate = doc.getElementById('appointments-gate');
  const intro = doc.getElementById('appointments-intro');
  const faq = doc.getElementById('appointments-faq');
  const legend = doc.getElementById('calendar-legend');
  const details = doc.getElementById('appointment-details');
  const content = doc.getElementById('reservation-content');
  const initialStep = doc.getElementById('reservation-initial-step');
  const confirmStep = doc.getElementById('reservation-confirm-step');
  const statusStep = doc.getElementById('reservation-status-step');
  const status = doc.getElementById('reservation-status');
  const warning = doc.getElementById('reservation-warning');
  const confirm = doc.getElementById('confirm-reservation');
  const cancel = doc.getElementById('cancel-reservation');
  const close = doc.getElementById('close-reservation');
  const dialogMessage = doc.getElementById('reservation-message');
  let snapshot;
  let selected;
  let reservation;
  let loading;
  let generation = 0;
  let busy = false;
  let loaded = false;
  let reviewRequired = false;
  let confirming = false;
  let completed = false;
  let blockedError = '';
  let bookingStarted = false;

  function positionDialog() {
    const view = doc.defaultView;
    if (!details.open || !view) return;
    const anchor = calendar.getBoundingClientRect();
    const popup = details.getBoundingClientRect();
    details.style.left = Math.min(Math.max(8, view.innerWidth - popup.width - 8), Math.max(8, anchor.left + (anchor.width - popup.width) / 2)) + 'px';
    details.style.top = Math.min(Math.max(8, view.innerHeight - popup.height - 8), Math.max(8, anchor.top + (anchor.height - popup.height) / 2)) + 'px';
  }

  function setMessage(text, { outside = false } = {}) {
    message.textContent = outside ? text : '';
    message.hidden = !outside || !text;
    dialogMessage.textContent = outside ? '' : text;
    dialogMessage.hidden = outside || !text;
    warning.hidden = !outside && Boolean(text);
    positionDialog();
  }

  function updateSelection() {
    for (const button of calendar.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.date === selected?.date));
      button.disabled = button.dataset.available !== 'true' || busy || completed || Boolean(blockedError) || Boolean(loading) || !loaded || reviewRequired;
    }
    calendar.dataset.selected = String(Boolean(selected && details.open));
    const step = busy ? 'busy' : completed ? 'complete' : blockedError ? 'error' : confirming ? 'confirm' : 'initial';
    content.dataset.activeStep = step;
    for (const [panel, active] of [[initialStep, step === 'initial'], [confirmStep, step === 'confirm'], [statusStep, ['busy', 'complete', 'error'].includes(step)]]) {
      panel.inert = !active;
      panel.setAttribute('aria-hidden', String(!active));
    }
    status.textContent = busy ? 'Reservando...' : completed ? 'Agendamento confirmado.' : blockedError;
    reserve.disabled = confirm.disabled = busy || completed || Boolean(blockedError) || Boolean(loading) || !loaded || reviewRequired || !selected;
    cancel.disabled = close.disabled = busy;
    close.hidden = busy;
    doc.body.dataset.reserving = String(busy);
    details.setAttribute('aria-busy', String(busy));
    details.setAttribute('aria-describedby', ['busy', 'complete', 'error'].includes(step) ? 'reservation-status'
      : confirming ? dialogMessage.textContent ? 'reservation-message' : 'reservation-warning' : 'reservation-instructions');
    positionDialog();
  }

  function clearSelection({ keepReservation = false } = {}) {
    const date = selected?.date;
    selected = undefined;
    confirming = false;
    completed = false;
    blockedError = '';
    if (!keepReservation) reservation = undefined;
    if (details.open) details.close();
    updateSelection();
    if (date) {
      const button = [...calendar.querySelectorAll('button')].find(button => button.dataset.date === date && !button.disabled);
      (button || calendar).focus({ preventScroll: true });
    }
  }

  function dismiss() {
    if (busy) return;
    const silent = completed || Boolean(blockedError);
    clearSelection({ keepReservation: true });
    setMessage('');
    if (!loaded && !loading) void refresh({ silent });
  }

  function showSelected(day) {
    const shortMonth = monthAbbreviation.format(day.value).replace('.', '').toLocaleLowerCase('pt-BR');
    doc.getElementById('selected-appointment-date').textContent = String(day.value.getUTCDate()).padStart(2, '0') + '/' + shortMonth + '/' + day.value.getUTCFullYear() + ' 09:00';
    doc.getElementById('selected-appointment-price').textContent = currency.format(day.priceCents / 100);
  }

  function createDayButton(day) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'calendar-day';
    button.dataset.date = day.date;
    button.dataset.available = String(day.available);
    button.disabled = !day.available;
    button.dataset.priceStep = day.available ? String(Math.round(day.pricePosition * 10)) : 'unavailable';
    button.setAttribute('aria-label', dateLabel.format(day.value) + ': ' + (day.available ? currency.format(day.priceCents / 100) + ' por hora' : 'não disponível'));
    const number = doc.createElement('span');
    number.className = 'calendar-day-number';
    number.textContent = String(day.value.getUTCDate());
    const price = doc.createElement('span');
    price.className = 'calendar-day-price';
    price.textContent = day.available ? currency.format(day.priceCents / 100) : '';
    button.append(number, price);
    button.addEventListener('click', () => {
      if (busy || completed || blockedError || loading || !loaded || reviewRequired || !day.available || !snapshot?.canBook) return;
      if (reservation && (reservation.date !== day.date || reservation.priceCents !== day.priceCents)) {
        reservation = undefined;
      }
      selected = day;
      confirming = false;
      completed = false;
      blockedError = '';
      setMessage('');
      showSelected(day);
      if (!details.open) details.showModal();
      updateSelection();
      reserve.focus({ preventScroll: true });
    });
    return button;
  }

  function createMonth(monthKey) {
    const firstDay = new Date(monthKey + '-01T12:00:00Z');
    const lastDay = new Date(firstDay);
    lastDay.setUTCMonth(firstDay.getUTCMonth() + 1, 0);
    const firstSunday = firstDay.getTime() - firstDay.getUTCDay() * dayMilliseconds;
    const byDate = new Map(snapshot.days.map((day) => [day.date, day]));
    const block = doc.createElement('section');
    block.className = 'calendar-month-block';
    const heading = doc.createElement('h2');
    heading.id = 'calendar-month-' + monthKey;
    heading.className = 'calendar-month-heading';
    const label = month.format(firstDay);
    heading.textContent = label[0].toLocaleUpperCase('pt-BR') + label.slice(1);
    const table = doc.createElement('table');
    table.className = 'calendar-month';
    table.setAttribute('aria-labelledby', heading.id);
    const head = doc.createElement('thead');
    const weekdays = doc.createElement('tr');
    for (let offset = 0; offset < 7; offset++) {
      const value = new Date(firstSunday + offset * dayMilliseconds);
      const cell = doc.createElement('th');
      cell.scope = 'col';
      cell.textContent = weekday.format(value);
      cell.setAttribute('aria-label', weekdayLabel.format(value));
      weekdays.append(cell);
    }
    head.append(weekdays);
    const body = doc.createElement('tbody');
    for (let sunday = firstSunday; sunday <= lastDay.getTime(); sunday += 7 * dayMilliseconds) {
      const week = doc.createElement('tr');
      for (let offset = 0; offset < 7; offset++) {
        const value = new Date(sunday + offset * dayMilliseconds);
        const date = value.toISOString().slice(0, 10);
        const cell = doc.createElement('td');
        if (date.startsWith(monthKey)) {
          const day = byDate.get(date) || { date, value, available: false, priceCents: null, pricePosition: null };
          cell.append(createDayButton(day));
        }
        week.append(cell);
      }
      body.append(week);
    }
    table.append(head, body);
    block.append(heading, table);
    return block;
  }

  function render(result) {
    snapshot = parseCalendar(result);
    const stillAvailable = selected && snapshot.days.find((day) => day.date === selected.date && day.available && day.priceCents === selected.priceCents);
    if (!completed && !blockedError && (!snapshot.canBook || (selected && !stillAvailable))) clearSelection();
    else if (stillAvailable) selected = stillAvailable;
    gate.hidden = snapshot.canBook;
    intro.hidden = !snapshot.canBook;
    faq.hidden = !snapshot.canBook;
    calendar.hidden = !snapshot.canBook;
    legend.hidden = !snapshot.canBook;
    doc.getElementById('payment-administrator-name').textContent = snapshot.administratorName || 'administrador da empresa';
    doc.getElementById('appointment-confirmation-email').textContent = snapshot.userEmail;
    const monthKeys = [];
    const cursor = new Date(snapshot.today);
    cursor.setUTCDate(1);
    const lastMonth = snapshot.lastDate.slice(0, 7);
    while (cursor.toISOString().slice(0, 7) <= lastMonth) {
      monthKeys.push(cursor.toISOString().slice(0, 7));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    calendar.replaceChildren(...monthKeys.map(createMonth));
    loaded = true;
    updateSelection();
  }

  function invalidate({ silent = details.open } = {}) {
    loaded = false;
    generation++;
    loading = undefined;
    gate.hidden = true;
    calendar.setAttribute('aria-busy', 'true');
    if (!silent) {
      intro.hidden = calendar.hidden = legend.hidden = faq.hidden = true;
      setMessage('Carregando...', { outside: true });
    }
    updateSelection();
  }

  function refresh({ silent = false } = {}) {
    if (loading) return loading;
    invalidate({ silent });
    const currentGeneration = generation;
    loading = Promise.resolve().then(async () => {
      try {
        const result = await client.calendar();
        if (!isCurrent() || currentGeneration !== generation) return false;
        render(result);
        if (!silent) setMessage('', { outside: true });
        return true;
      } catch (error) {
        if (!isCurrent() || currentGeneration !== generation || onAuthFailure(error)) return false;
        if (!completed && !blockedError) clearSelection();
        calendar.hidden = true;
        legend.hidden = true;
        intro.hidden = true;
        faq.hidden = true;
        gate.hidden = true;
        loaded = false;
        if (!silent) setMessage('Não foi possível carregar a agenda. Atualize a página para tentar novamente.', { outside: true });
        return false;
      } finally {
        if (currentGeneration === generation) {
          calendar.setAttribute('aria-busy', 'false');
          loading = undefined;
          updateSelection();
        }
      }
    });
    updateSelection();
    return loading;
  }

  function load(result) {
    if (result && bookingStarted) client.discardBootstrap?.();
    if (busy) return Promise.resolve(false);
    if (result && !bookingStarted) {
      invalidate();
      try {
        render(result);
        setMessage('');
        calendar.setAttribute('aria-busy', 'false');
        return Promise.resolve(true);
      } catch {
        loaded = false;
      }
    }
    return loaded ? Promise.resolve(true) : refresh({ silent: completed || Boolean(blockedError) });
  }

  close.addEventListener('click', dismiss);
  doc.defaultView?.addEventListener('resize', positionDialog);
  doc.defaultView?.addEventListener('scroll', positionDialog, true);
  doc.defaultView?.addEventListener('pagehide', () => { doc.body.dataset.reserving = 'false'; });
  cancel.addEventListener('click', dismiss);
  details.addEventListener('cancel', (event) => {
    event.preventDefault();
    dismiss();
  });
  details.addEventListener('close', () => {
    if (!details.open && selected && !busy) dismiss();
  });
  details.addEventListener('click', (event) => {
    if (event.target !== details) return;
    const bounds = details.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dismiss();
  });
  reserve.addEventListener('click', () => {
    if (busy || completed || blockedError || loading || !loaded || reviewRequired || !selected || !details.open || !isCurrent()) return;
    confirming = true;
    updateSelection();
    cancel.focus({ preventScroll: true });
  });
  confirm.addEventListener('click', async () => {
    if (busy || completed || blockedError || loading || !loaded || reviewRequired || !selected || !confirming || !details.open || !isCurrent()) return;
    bookingStarted = true;
    busy = true;
    setMessage('');
    updateSelection();
    status.focus({ preventScroll: true });
    try {
      if (!reservation) {
        reservation = { date: selected.date, priceCents: selected.priceCents, requestId: requestId(), acknowledged: true };
      }
      const submitted = reservation;
      const result = await client.reserveDate(submitted);
      if (!isCurrent()) return;
      if (result?.reserved !== true || result.date !== submitted.date) throw new Error('reservation_failed');
      completed = true;
      confirming = false;
      reservation = undefined;
      void refresh({ silent: true });
    } catch (error) {
      if (!isCurrent() || onAuthFailure(error)) return;
      const rejected = {
        'support_management.date_unavailable': 'A data não está mais disponível. Selecione outra data.',
        'support_management.price_changed': 'O preço desta data mudou. Selecione a data novamente.',
        'support_management.payment_method_required': 'Não foi possível confirmar a reserva. Tente novamente.',
        'support_management.booking_permission_required': 'Não foi possível confirmar a reserva. Tente novamente.',
      }[error.code];
      if (rejected) {
        reservation = undefined;
        confirming = false;
        blockedError = rejected;
        void refresh({ silent: true });
      } else if (error.code === 'support_management.reservation_review_required') {
        reviewRequired = true;
        blockedError = 'A reserva precisa ser conferida antes de uma nova tentativa. Entre em contato com o suporte.';
      } else {
        setMessage('Não foi possível confirmar a reserva. Tente novamente.');
      }
    } finally {
      busy = false;
      updateSelection();
      if (isCurrent() && details.open) (completed || blockedError ? close : cancel).focus({ preventScroll: true });
    }
  });

  return { load, invalidate };
}
