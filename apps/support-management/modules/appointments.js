const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' });
const weekdayLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' });
const month = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' });
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dayMilliseconds = 86400000;

function parseDays(result) {
  if (!Array.isArray(result?.days)) throw new Error('calendar_unavailable');
  let previous = '';
  return result.days.map((day) => {
    const date = typeof day?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(day.date) ? new Date(`${day.date}T12:00:00Z`) : null;
    if (!date || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day.date
      || date.getUTCDay() === 0 || date.getUTCDay() === 6 || day.date <= previous
      || typeof day.available !== 'boolean'
      || (day.available && (!Number.isSafeInteger(day.priceCents) || day.priceCents <= 0
        || typeof day.pricePosition !== 'number' || day.pricePosition < 0 || day.pricePosition > 1 || !Number.isFinite(day.pricePosition)))
      || (!day.available && (day.priceCents !== null || day.pricePosition !== null))) throw new Error('calendar_unavailable');
    previous = day.date;
    return { date: day.date, available: day.available, priceCents: day.priceCents, pricePosition: day.pricePosition, value: date };
  });
}

export function createAppointments({ client, onAuthFailure, isCurrent = () => true, document: doc = globalThis.document, requestId = () => globalThis.crypto.randomUUID() }) {
  const calendar = doc.getElementById('appointment-calendar');
  const reserve = doc.getElementById('reserve-date');
  const message = doc.getElementById('appointments-message');
  let days = [];
  let selected;
  let reservation;
  let loading;
  let busy = false;
  let reviewRequired = false;

  function updateSelection() {
    for (const button of calendar.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.date === selected?.date));
    reserve.disabled = busy || Boolean(loading) || reviewRequired || !selected;
  }

  function clearSelection() {
    selected = undefined;
    reservation = undefined;
    updateSelection();
  }

  function createDayButton(day) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'calendar-day';
    button.dataset.date = day.date;
    button.disabled = !day.available;
    button.dataset.priceStep = day.available ? String(Math.round(day.pricePosition * 10)) : 'unavailable';
    button.setAttribute('aria-label', `${dateLabel.format(day.value)}: ${day.available ? `${currency.format(day.priceCents / 100)} por hora` : 'INDISPONÍVEL'}`);
    const number = doc.createElement('span');
    number.className = 'calendar-day-number';
    number.textContent = String(day.value.getUTCDate());
    const price = doc.createElement('span');
    price.className = 'calendar-day-price';
    price.textContent = day.available ? `${currency.format(day.priceCents / 100)}/h` : 'INDISPONÍVEL';
    button.append(number, price);
    button.addEventListener('click', () => {
      if (busy || loading || reviewRequired || !day.available) return;
      if (selected?.date !== day.date || selected?.priceCents !== day.priceCents) reservation = undefined;
      selected = day;
      message.textContent = '';
      updateSelection();
    });
    return button;
  }

  function createMonth(monthKey, monthDays) {
    const firstDay = new Date(`${monthKey}-01T12:00:00Z`);
    const lastDay = new Date(firstDay);
    lastDay.setUTCMonth(firstDay.getUTCMonth() + 1, 0);
    const firstMonday = firstDay.getTime() - ((firstDay.getUTCDay() + 6) % 7) * dayMilliseconds;
    const byDate = new Map(monthDays.map((day) => [day.date, day]));
    const block = doc.createElement('section');
    block.className = 'calendar-month-block';
    const heading = doc.createElement('h2');
    heading.id = `calendar-month-${monthKey}`;
    heading.className = 'calendar-month-heading';
    const label = month.format(firstDay);
    heading.textContent = label[0].toLocaleUpperCase('pt-BR') + label.slice(1);
    const table = doc.createElement('table');
    table.className = 'calendar-month';
    table.setAttribute('aria-labelledby', heading.id);
    const head = doc.createElement('thead');
    const weekdays = doc.createElement('tr');
    for (let offset = 0; offset < 5; offset++) {
      const value = new Date(firstMonday + offset * dayMilliseconds);
      const cell = doc.createElement('th');
      cell.scope = 'col';
      cell.textContent = weekday.format(value);
      cell.setAttribute('aria-label', weekdayLabel.format(value));
      weekdays.append(cell);
    }
    head.append(weekdays);
    const body = doc.createElement('tbody');
    for (let monday = firstMonday; monday <= lastDay.getTime(); monday += 7 * dayMilliseconds) {
      const week = doc.createElement('tr');
      let withinMonth = false;
      for (let offset = 0; offset < 5; offset++) {
        const value = new Date(monday + offset * dayMilliseconds);
        const date = value.toISOString().slice(0, 10);
        const cell = doc.createElement('td');
        if (date.startsWith(monthKey)) {
          withinMonth = true;
          const day = byDate.get(date) || { date, value, available: false, priceCents: null, pricePosition: null };
          cell.append(createDayButton(day));
        }
        week.append(cell);
      }
      if (withinMonth) body.append(week);
    }
    table.append(head, body);
    block.append(heading, table);
    return block;
  }

  function render(result) {
    days = parseDays(result);
    if (selected && !days.some((day) => day.date === selected.date && day.available && day.priceCents === selected.priceCents)) clearSelection();
    const months = new Map();
    for (const day of days) {
      const key = day.date.slice(0, 7);
      if (!months.has(key)) months.set(key, []);
      months.get(key).push(day);
    }
    calendar.replaceChildren(...Array.from(months, ([key, monthDays]) => createMonth(key, monthDays)));
    calendar.hidden = !days.length;
    updateSelection();
  }

  function refresh() {
    if (loading) return loading;
    calendar.setAttribute('aria-busy', 'true');
    message.textContent = 'Carregando...';
    reserve.disabled = true;
    loading = Promise.resolve().then(async () => {
      try {
        const result = await client.calendar();
        if (!isCurrent()) return false;
        render(result);
        message.textContent = days.length ? '' : 'Nenhuma data disponível.';
        return true;
      } catch (error) {
        if (!isCurrent() || onAuthFailure(error)) return false;
        clearSelection();
        calendar.hidden = true;
        message.textContent = 'Não foi possível carregar a agenda. Atualize a página para tentar novamente.';
        return false;
      } finally {
        calendar.setAttribute('aria-busy', 'false');
        loading = undefined;
        updateSelection();
      }
    });
    return loading;
  }

  function load() {
    return busy ? Promise.resolve(false) : refresh();
  }

  reserve.addEventListener('click', async () => {
    if (busy || loading || reviewRequired || !selected || !isCurrent()) return;
    busy = true;
    reserve.disabled = true;
    reserve.textContent = 'Reservando...';
    reserve.setAttribute('aria-busy', 'true');
    message.textContent = '';
    try {
      const submitted = reservation ??= { date: selected.date, priceCents: selected.priceCents, requestId: requestId() };
      const result = await client.reserveDate(submitted);
      if (!isCurrent()) return;
      if (result?.reserved !== true || result.date !== submitted.date) throw new Error('reservation_failed');
      clearSelection();
      const refreshed = await refresh();
      if (!isCurrent()) return;
      message.textContent = result.notificationPending ? 'Data reservada. O envio das notificações está pendente.'
        : refreshed ? 'Data reservada.' : 'Data reservada. Atualize a página para consultar a agenda.';
    } catch (error) {
      if (!isCurrent() || onAuthFailure(error)) return;
      if (error.code === 'support_management.date_unavailable' || error.code === 'support_management.price_changed') {
        clearSelection();
        await refresh();
        if (!isCurrent()) return;
        message.textContent = error.code === 'support_management.price_changed'
          ? 'O preço desta data mudou. Selecione a data novamente.'
          : 'A data não está mais disponível. Selecione outra data.';
      } else if (error.code === 'support_management.reservation_review_required') {
        reviewRequired = true;
        message.textContent = 'A reserva precisa ser conferida antes de uma nova tentativa. Entre em contato com o suporte.';
      } else {
        message.textContent = 'Não foi possível confirmar a reserva. Tente novamente.';
      }
    } finally {
      busy = false;
      reserve.textContent = 'Reservar Data';
      reserve.setAttribute('aria-busy', 'false');
      updateSelection();
    }
  });

  return { load };
}
