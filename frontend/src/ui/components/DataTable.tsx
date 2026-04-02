import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  csvValue?: (row: T) => string;
}

function downloadCsv<T>(filename: string, rows: T[], columns: ColumnDef<T>[]) {
  const headers = columns.map(c => c.header).join(',');
  const body = rows.map(row =>
    columns.map(c => {
      const val = c.csvValue ? c.csvValue(row) : String(c.cell(row) ?? '');
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',')
  ).join('\n');
  const blob = new Blob([headers + '\n' + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function DataTable<T>({
  title,
  subtitle,
  rows,
  columns,
  action,
  emptyMessage = 'No records found.',
  csvFilename,
  isLoading = false,
}: {
  title: string;
  subtitle?: string;
  rows: T[];
  columns: ColumnDef<T>[];
  action?: ReactNode;
  emptyMessage?: string;
  csvFilename?: string;
  isLoading?: boolean;
}) {
  const headerAction = (
    <div className="flex items-center gap-2">
      {csvFilename && !isLoading && rows.length > 0 && (
        <button
          className="button text-xs"
          onClick={() => downloadCsv(csvFilename, rows, columns)}
        >
          Export CSV
        </button>
      )}
      {action}
    </div>
  );

  return (
    <div className="panel p-5">
      <SectionHeader title={title} subtitle={subtitle} action={headerAction} />
      <div className="table-shell overflow-x-auto">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      <Search className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-300">No data available</p>
                      <p className="mt-1 text-xs text-slate-500">{emptyMessage}</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.cell(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
