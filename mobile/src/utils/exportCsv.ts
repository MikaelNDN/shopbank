import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

interface Column<T> {
  header: string;
  value: (row: T) => string | number;
}

function escape(cell: string | number): string {
  const str = String(cell ?? '');
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportCsv<T>(
  filename: string,
  rows: T[],
  columns: Column<T>[],
): Promise<void> {
  const header = columns.map((c) => escape(c.header)).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escape(c.value(row))).join(','),
  );
  const csv = [header, ...lines].join('\n');

  const safeName = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${safeName}`;
  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: filename,
      UTI: 'public.comma-separated-values-text',
    });
  }
}
