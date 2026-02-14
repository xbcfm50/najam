import {
  addDays,
  endOfMonth,
  format,
  getYear,
  subMonths,
  startOfMonth
} from 'date-fns';

export function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1);
}

export function lastDayOfMonth(year: number, month: number) {
  return endOfMonth(firstDayOfMonth(year, month));
}

export function suggestedBillingPeriod(today: Date) {
  return { year: getYear(today), month: Number(format(today, 'M')) };
}

export function computeCutoffDate(year: number, month: number, cutoffDay: number) {
  return new Date(year, month - 1, cutoffDay);
}

export function lastCompletedConsumptionPeriod(today: Date) {
  const previous = subMonths(startOfMonth(today), 1);
  return { year: getYear(previous), month: Number(format(previous, 'M')) };
}

export function computeDueDate(periodYear: number, periodMonth: number, dueDays: number) {
  return addDays(lastDayOfMonth(periodYear, periodMonth), dueDays);
}
