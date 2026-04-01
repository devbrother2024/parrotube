const PERIOD_MAP: Record<string, number> = {
  '7d': 7,
  '28d': 28,
  '30d': 30,
  '90d': 90,
  '1y': 365,
  '365d': 365,
};

export interface DateRange {
  startDate: string;
  endDate: string;
}

export function parsePeriod(period: string): DateRange {
  const days = PERIOD_MAP[period];
  if (!days) {
    throw new Error(
      `Unknown period "${period}". Use one of: ${Object.keys(PERIOD_MAP).join(', ')}`,
    );
  }

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  return { startDate: fmt(start), endDate: fmt(end) };
}

export interface DateOptions {
  startDate?: string;
  endDate?: string;
  period?: string;
}

export function resolveDates(options: DateOptions): DateRange {
  if (options.startDate && options.endDate) {
    return { startDate: options.startDate, endDate: options.endDate };
  }
  return parsePeriod(options.period ?? '28d');
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}
