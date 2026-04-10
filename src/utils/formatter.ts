import Table from 'cli-table3';

interface ColumnHeader {
  name: string;
  columnType: string;
}

interface AnalyticsResponse {
  columnHeaders?: ColumnHeader[];
  rows?: unknown[][];
}

interface DataApiResponse {
  items: Record<string, unknown>[];
}

function isDataApiResponse(data: unknown): data is DataApiResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as DataApiResponse).items)
  );
}

export function output(data: unknown, format: string = 'json'): void {
  if (format === 'table') {
    if (isDataApiResponse(data)) {
      console.log(dataApiToTable(data));
    } else {
      console.log(toTable(data as AnalyticsResponse));
    }
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

export function formatReport(
  response: AnalyticsResponse | null | undefined,
): Record<string, unknown>[] {
  if (!response?.columnHeaders || !response?.rows) {
    return [];
  }

  const keys = response.columnHeaders.map((h) => h.name);
  return response.rows.map((row) =>
    Object.fromEntries(keys.map((k, i) => [k, row[i]])),
  );
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

function dataApiToTable(data: DataApiResponse): string {
  if (!data.items.length) {
    return new Table().toString();
  }

  const flatItems = data.items.map((item) =>
    flattenObject(item as Record<string, unknown>),
  );
  const headers = [...new Set(flatItems.flatMap((item) => Object.keys(item)))];
  const table = new Table({ head: headers, style: { head: ['cyan'] } });

  for (const item of flatItems) {
    table.push(
      headers.map((h) => {
        const v = item[h];
        if (v === undefined || v === null) return '';
        if (typeof v === 'number') return v.toLocaleString();
        return String(v);
      }),
    );
  }

  return table.toString();
}

function toTable(data: AnalyticsResponse | null | undefined): string {
  if (!data?.columnHeaders || !data?.rows) {
    return new Table().toString();
  }

  const headers = data.columnHeaders.map((h) => h.name);
  const table = new Table({ head: headers, style: { head: ['cyan'] } });

  for (const row of data.rows) {
    table.push(
      row.map((v) => (typeof v === 'number' ? v.toLocaleString() : String(v))),
    );
  }

  return table.toString();
}
