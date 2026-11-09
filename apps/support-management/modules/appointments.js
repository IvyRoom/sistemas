const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' });
const month = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateLabel = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' });
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

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
  const months = doc.getElementById('calendar-months');
  const weekdays = doc.getElementById('calendar-weekdays');
  const dates = doc.getElementById('calendar-days');
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
    for (const button of dates.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.date === selected?.date));
    reserve.disabled = busy || Boolean(loading) || reviewRequired || !selected;
  }

  function clearSelection() {
    selected = undefined;
    reservation = undefined;
    updateSelection();
  }

  function render(result) {
    days = parseDays(result);
    if (selected && !days.some((day) => day.date === selected.date && day.available && day.priceCents === selected.priceCents)) clearSelection();
    months.replaceChildren();
    weekdays.replaceChildren();
    dates.replaceChildren();
    let monthCell;
    let currentMonth;
    for (const day of days) {
      const monthKey = day.date.slice(0, 7);
      if (monthKey !== currentMonth) {
        monthCell = doc.createElement('th');
        monthCell.scope = 'colgroup';
        monthCell.colSpan = 1;
        const label = month.format(day.value);
        monthCell.textContent = label[0].toLocaleUpperCase('pt-BR') + label.slice(1);
        months.append(monthCell);
        currentMonth = monthKey;
      } else monthCell.colSpan++;
      const weekdayCell = doc.createElement('th');
      weekdayCell.scope = 'col';
      weekdayCell.textContent = weekday.format(day.value);
      weekdays.append(weekdayCell);
      const cell = doc.createElement('td');
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
      cell.append(button);
      dates.append(cell);
    }
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
