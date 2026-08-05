import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { downloadDashboardExport } from '../../lib/dashboardApi';

const BRAND = '#087536';

/**
 * Downloads a dashboard dataset as a spreadsheet file.
 *
 * The server decides what the caller may export, so this stays a thin trigger:
 * it never filters rows itself, which is what keeps the file consistent with
 * what the dashboard above it is allowed to show.
 */
function ExportButton({ dataset, label = 'Export to Excel', onError }) {
  const [isExporting, setIsExporting] = useState(false);

  const runExport = async () => {
    setIsExporting(true);

    try {
      await downloadDashboardExport(dataset);
      onError?.('');
    } catch (error) {
      onError?.(error.message || 'The export could not be generated.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={runExport}
      disabled={isExporting}
      title="Downloads a CSV file that opens directly in Excel"
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-60"
    >
      {isExporting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" style={{ color: BRAND }} />
      )}
      {isExporting ? 'Preparing...' : label}
    </button>
  );
}

export default ExportButton;
