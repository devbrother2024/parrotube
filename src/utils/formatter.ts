import Table from 'cli-table3';

interface ColumnHeader {
  name: string;
  columnType: string;
}

interface AnalyticsResponse {
  columnHeaders?: ColumnHeader[];
  rows?: unknown[][];
}

export function output(data: unknown, format: string = 'json'): void {
  if (format === 'table') {
    console.log(toTable(data as AnalyticsResponse));
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
