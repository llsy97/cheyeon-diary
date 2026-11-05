import type { DateKey, MonthKey, TimeString } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export const WEEKDAY_SHORT = ['일', '월', '화', '수', '목', '금', '토'];

export function toDateKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toMonthKey(d: Date): MonthKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthOf(date: DateKey): MonthKey {
  return date.slice(0, 7);
}

/** 'YYYY-MM-DD' → 로컬 자정 Date */
export function parseDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function parseMonthKey(key: MonthKey): { year: number; month: number } {
  const [y, m] = key.split('-').map(Number);
  return { year: y, month: m - 1 };
}

export function addDays(key: DateKey, n: number): DateKey {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

export function addMonths(key: MonthKey, n: number): MonthKey {
  const { year, month } = parseMonthKey(key);
  return toMonthKey(new Date(year, month + n, 1));
}

export function daysInMonth(key: MonthKey): number {
  const { year, month } = parseMonthKey(key);
  return new Date(year, month + 1, 0).getDate();
}

export function dateInMonth(key: MonthKey, day: number): DateKey {
  return `${key}-${pad(day)}`;
}

/** 해당 월의 1일 요일 (0 = 일) */
export function firstWeekday(key: MonthKey): number {
  const { year, month } = parseMonthKey(key);
  return new Date(year, month, 1).getDay();
}

export function formatKoreanDate(key: DateKey): string {
  const d = parseDateKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAY_SHORT[d.getDay()]}요일`;
}

export function formatKoreanMonth(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  return `${year}년 ${month + 1}월`;
}

export function parseTime(t: TimeString): { hour: number; minute: number } {
  const [h, m] = t.split(':').map(Number);
  return { hour: h, minute: m };
}

export function toTimeString(hour: number, minute: number): TimeString {
  return `${pad(hour)}:${pad(minute)}`;
}

/** '21:00' → '오후 9:00' */
export function formatKoreanTime(t: TimeString): string {
  const { hour, minute } = parseTime(t);
  const ampm = hour < 12 ? '오전' : '오후';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${ampm} ${h12}:${pad(minute)}`;
}
