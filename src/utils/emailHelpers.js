const TYPO_DOMAINS = [
  ['gmial.com', 'gmail.com'],
  ['gmai.com', 'gmail.com'],
  ['gnail.com', 'gmail.com'],
  ['yahooo.com', 'yahoo.com'],
  ['yaho.com', 'yahoo.com'],
  ['hotmial.com', 'hotmail.com'],
  ['hotmal.com', 'hotmail.com'],
  ['outlok.com', 'outlook.com'],
  ['outllok.com', 'outlook.com'],
  ['icloud.con', 'icloud.com'],
  ['iclould.com', 'icloud.com'],
  ['live.con', 'live.com'],
  ['protonmail.con', 'protonmail.com'],
];

export function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value) {
  const email = normalizeEmail(value);
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function suggestEmailFix(value) {
  const email = normalizeEmail(value);
  if (!email.includes('@')) return null;

  const [local, domain] = email.split('@');
  if (!local || !domain) return null;

  for (const [wrong, right] of TYPO_DOMAINS) {
    if (domain === wrong) {
      const suggestion = `${local}@${right}`;
      if (suggestion !== email) return suggestion;
    }
  }

  return null;
}
