import { Order } from './accounts';

/** Number crunching for the dashboard charts and reports. No Angular in here. */

/** Orders that money was actually received for. */
export const isPaid = (o: Order): boolean =>
  o.status !== 'Cancelled' && o.status !== 'Awaiting payment';

export interface DayPoint {
  key: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface Group {
  label: string;
  value: number;
  count: number;
}

const dayLabel = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short' });
const compact = new Intl.NumberFormat('en-NG', { notation: 'compact', maximumFractionDigits: 1 });

/** 12500 → "₦12.5K", for chart axes. */
export const compactNaira = (value: number): string => '₦' + compact.format(value);

/** A date as "2026-11-15" in the viewer's own time zone. */
function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** One point per day for the last `days` days, ending today. Days with no orders are zero. */
export function dailySeries(orders: Order[], days: number): DayPoint[] {
  const points = new Map<string, DayPoint>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = dayKey(date);
    points.set(key, { key, label: dayLabel.format(date), revenue: 0, orders: 0 });
  }
  for (const order of orders) {
    const point = points.get(dayKey(new Date(order.date)));
    if (point) {
      point.revenue += order.total;
      point.orders++;
    }
  }
  return [...points.values()];
}

/** Orders placed in the last `days` days, counting today. */
export function lastDays(orders: Order[], days: number): Order[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1).getTime();
  return orders.filter((o) => new Date(o.date).getTime() >= start);
}

/** Adds things up under a label, biggest total first. */
export function groupSum<T>(
  items: T[],
  label: (item: T) => string,
  value: (item: T) => number,
  count: (item: T) => number = () => 1,
): Group[] {
  const groups = new Map<string, Group>();
  for (const item of items) {
    const key = label(item);
    const group = groups.get(key) ?? { label: key, value: 0, count: 0 };
    group.value += value(item);
    group.count += count(item);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.value - a.value);
}

/** Percentage change from `previous` to `current`, or null when there is nothing to compare to. */
export function change(current: number, previous: number): number | null {
  return previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
}

/** Round axis values from zero up to at least `max`, e.g. 0, 5K, 10K, 15K, 20K. */
export function axisTicks(max: number, steps = 4): number[] {
  if (max <= 0) return [0];
  const raw = max / steps;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / magnitude;
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10;
  const step = Math.max(1, Math.ceil(nice * magnitude));
  const ticks: number[] = [];
  for (let value = 0; value < max + step; value += step) ticks.push(value);
  return ticks;
}

/** Saves rows as a .csv file the browser downloads. The first row is the header. */
export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const cell = (value: string | number): string => {
    let text = String(value);
    // Stop spreadsheet apps from running a name like "=SUM(...)" as a formula.
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = rows.map((row) => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
