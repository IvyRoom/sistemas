const generic = { brand: 'unknown', label: '', lengths: [13, 14, 15, 16, 17, 18, 19], gaps: [4, 8, 12, 16], codeSize: 4 };
// Prefixes and card lengths: https://github.com/braintree/credit-card-type/blob/main/src/lib/card-types.ts
const cards = [
  { brand: 'visa', label: 'Visa', patterns: [4], lengths: [16, 18, 19] },
  { brand: 'mastercard', label: 'Mastercard', patterns: [[51, 55], [2221, 2720]], lengths: [16] },
  { brand: 'american-express', label: 'American Express', patterns: [34, 37], lengths: [15], gaps: [4, 10], codeSize: 4 },
  { brand: 'diners-club', label: 'Diners Club', patterns: [[300, 305], 36, 38, 39], lengths: [14, 16, 19], gaps: [4, 10] },
  { brand: 'discover', label: 'Discover', patterns: [6011, [644, 649], 65], lengths: [16, 19] },
  { brand: 'jcb', label: 'JCB', patterns: [2131, 1800, [3528, 3589]], lengths: [16, 17, 18, 19] },
  { brand: 'hipercard', label: 'Hipercard', patterns: [606282], lengths: [16] },
  { brand: 'elo', label: 'Elo', lengths: [16], patterns: [
    401178, 401179, 438935, 457631, 457632, 431274, 451416, 457393, 504175,
    [506699, 506778], [509000, 509999], 627780, 636297, 636368,
    [650031, 650033], [650035, 650051], [650057, 650081], [650405, 650439],
    [650485, 650538], [650541, 650598], [650700, 650718], [650720, 650727],
    [650901, 650978], [651652, 651704], [655000, 655019], [655021, 655058],
  ] },
  { brand: 'unionpay', label: 'UnionPay', lengths: [14, 15, 16, 17, 18, 19], patterns: [
    620, [62100, 62182], [62184, 62197], [62200, 62205], [622010, 622999],
    622018, [62207, 62209], [623, 626], 6270, 6272, 6276, [627700, 627779],
    [627781, 627799], [6282, 6289], 6291, 6292, 810, [8110, 8171],
  ] },
];

const digitsOnly = (value) => String(value ?? '').replace(/\D/gu, '');

export function getCardDetails(value) {
  const digits = digitsOnly(value);
  let selected = generic;
  let specificity = 0;
  for (const card of cards) {
    for (const pattern of card.patterns) {
      const [start, end] = Array.isArray(pattern) ? pattern : [pattern, pattern];
      const width = String(start).length;
      const prefix = Number(digits.slice(0, width));
      if (digits.length >= width && width > specificity && prefix >= start && prefix <= end) {
        selected = card;
        specificity = width;
      }
    }
  }
  return { brand: selected.brand, label: selected.label, lengths: [...selected.lengths],
    gaps: [...(selected.gaps || generic.gaps)], codeSize: selected.codeSize || 3 };
}

export function formatCardNumber(value) {
  const candidate = digitsOnly(value);
  const details = getCardDetails(candidate);
  const digits = candidate.slice(0, Math.min(16, Math.max(...details.lengths)));
  const gaps = details.gaps;
  return Array.from(digits, (digit, index) => `${index && gaps.includes(index) ? ' ' : ''}${digit}`).join('');
}

export function normalizeText(value) {
  return String(value ?? '').replace(/\s+/gu, ' ').trim();
}

export function formatCardholder(value) {
  return String(value ?? '').normalize('NFC').replace(/\s+/gu, ' ')
    .replace(/[^\p{L}\p{M} ]/gu, '').replace(/ {2,}/gu, ' ').trimStart();
}

export function formatPostalCode(value) {
  const digits = digitsOnly(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function formatSecurityCode(value, details = generic) {
  return digitsOnly(value).slice(0, details.codeSize);
}

export function formatStreetNumber(value) {
  return String(value ?? '').normalize('NFC').replace(/\s+/gu, ' ')
    .replace(/[^\p{L}\p{M}\p{N} /.-]/gu, '').replace(/ {2,}/gu, ' ').trimStart().toUpperCase();
}

function passesLuhn(digits) {
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index--) {
    let digit = Number(digits[index]);
    if (double) digit = digit * 2 > 9 ? digit * 2 - 9 : digit * 2;
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export function validateCardFields(card, now = new Date()) {
  const errors = {};
  const number = digitsOnly(card.number);
  const details = getCardDetails(number);
  // UnionPay does not universally use Luhn; final acceptance remains with the provider.
  // https://github.com/braintree/card-validator/blob/main/src/card-number.ts
  if (/[^\d\s-]/u.test(String(card.number ?? '')) || number.length > 16 || !details.lengths.includes(number.length)
      || /^(\d)\1+$/u.test(number) || (details.brand !== 'unionpay' && !passesLuhn(number))) {
    errors.number = 'Informe um número de cartão válido.';
  }
  const holder = normalizeText(card.holderName);
  if (!holder || holder.length > 64 || !/\p{L}/u.test(holder) || /[^\p{L}\p{M} ]/u.test(holder)) {
    errors.holderName = 'Informe o nome do titular como aparece no cartão.';
  }
  const month = Number(card.expMonth);
  const year = Number(card.expYear);
  if (!/^\d{1,2}$/u.test(String(card.expMonth ?? '')) || month < 1 || month > 12) errors.expMonth = 'Selecione o mês de validade.';
  if (!/^\d{4}$/u.test(String(card.expYear ?? ''))) errors.expYear = 'Selecione o ano de validade.';
  else if (year < now.getFullYear()) errors.expYear = 'O cartão está vencido.';
  if (!errors.expMonth && !errors.expYear && year === now.getFullYear() && month < now.getMonth() + 1) errors.expMonth = 'O cartão está vencido.';
  const cvv = String(card.cvv ?? '');
  const codeLengths = details.brand === 'unknown' ? [3, 4] : [details.codeSize];
  if (!/^\d+$/u.test(cvv) || !codeLengths.includes(cvv.length)) errors.cvv = 'Informe o código de segurança válido.';
  return errors;
}
