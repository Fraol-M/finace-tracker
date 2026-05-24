export const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
export const currentYear = new Date().getFullYear();

const d = new Date();
export const CURRENT_MONTH_VAL = d.getMonth() + 1;
export const CURRENT_MONTH_STR = String(CURRENT_MONTH_VAL).padStart(2, '0');
export const CURRENT_MONTH_PREFIX = `${currentYear}-${CURRENT_MONTH_STR}`;

export const YEARLY_MONTHS_CONFIG = [
  { name: 'January', prefix: `${currentYear}-01`, short: 'J' },
  { name: 'February', prefix: `${currentYear}-02`, short: 'F' },
  { name: 'March', prefix: `${currentYear}-03`, short: 'M' },
  { name: 'April', prefix: `${currentYear}-04`, short: 'A' },
  { name: 'May', prefix: `${currentYear}-05`, short: 'M' },
  { name: 'June', prefix: `${currentYear}-06`, short: 'J' },
  { name: 'July', prefix: `${currentYear}-07`, short: 'J' },
  { name: 'August', prefix: `${currentYear}-08`, short: 'A' },
  { name: 'September', prefix: `${currentYear}-09`, short: 'S' },
  { name: 'October', prefix: `${currentYear}-10`, short: 'O' },
  { name: 'November', prefix: `${currentYear}-11`, short: 'N' },
  { name: 'December', prefix: `${currentYear}-12`, short: 'D' },
];
