export type AgeBand = '13-15' | '16-17' | '18+';

export function ageOnDate(birthDate: string, today: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  const current = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today);
  if (!match || !current) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;

  const currentYear = Number(current[1]);
  const currentMonth = Number(current[2]);
  const currentDay = Number(current[3]);
  const age = currentYear - year - (currentMonth < month || (currentMonth === month && currentDay < day) ? 1 : 0);
  return age >= 0 && age <= 120 ? age : null;
}

export function ageBand(age: number): AgeBand | null {
  if (age < 13) return null;
  if (age < 16) return '13-15';
  if (age < 18) return '16-17';
  return '18+';
}

export function todayInJapan(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
