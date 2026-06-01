import React, { useState, useRef, useEffect, useCallback } from 'react';
import { excelAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Upload, Download, FileSpreadsheet, RefreshCw,
  CheckCircle, XCircle, AlertCircle, Eye, EyeOff,
  Filter, Clock, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight
} from 'lucide-react';

/* ────────────────────────────────────────────
   Utility: trigger browser download from Blob
───────────────────────────────────────────── */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ────────────────────────────────────────────
   Sub-component: Stat Card
───────────────────────────────────────────── */
function StatCard({ label, value, color, icon: Icon }) {
  const colors = {
    green:  'bg-emerald-50 border-emerald-200 text-emerald-700',
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    amber:  'bg-amber-50 border-amber-200 text-amber-700',
    red:    'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`rounded-xl border px-5 py-4 flex items-center gap-3 ${colors[color]}`}>
      <Icon size={22} />
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs font-medium opacity-80">{label}</p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-component: Import Result Banner
───────────────────────────────────────────── */
function ResultBanner({ result, onDismiss }) {
  if (!result) return null;
  const isError = result.status === 'validation_failed';
  const summary = result.summary || {};

  // Derive counts from summary or direct arrays
  const newlyAddedCount    = summary.newly_added_count    ?? (result.newly_added?.length    ?? 0);
  const updatedCount       = summary.updated_count        ?? (result.updated?.length        ?? 0);
  const alreadyPresentCount= summary.already_present_count?? (result.already_present?.length?? 0);
  const failedCount        = summary.failed_count         ?? (result.failed?.length         ?? 0);

  return (
    <div className={`rounded-xl border p-4 mb-4 ${isError ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <h4 className={`font-semibold flex items-center gap-2 ${isError ? 'text-red-700' : 'text-emerald-700'}`}>
          {isError ? <XCircle size={18}/> : <CheckCircle size={18}/>}
          {isError ? 'Validation Failed — File Not Imported' : `Import Completed · ${result.total_rows ?? 0} rows processed`}
        </h4>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>

      {!isError && (
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <StatCard label="Newly Added"    value={newlyAddedCount}     color="green" icon={CheckCircle}/>
            <StatCard label="Updated"        value={updatedCount}         color="blue"  icon={RefreshCw}/>
            <StatCard label="Already Present"value={alreadyPresentCount} color="amber" icon={AlertCircle}/>
            <StatCard label="Failed"         value={failedCount}          color="red"   icon={XCircle}/>
          </div>

          {/* Sections uploaded */}
          {result.sections_uploaded?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Columns uploaded:</p>
              <div className="flex flex-wrap gap-1">
                {result.sections_uploaded.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-mono">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Newly added list */}
          {result.newly_added?.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs font-semibold text-green-700 cursor-pointer">✓ {newlyAddedCount} Newly Added Products</summary>
              <div className="mt-1 max-h-32 overflow-y-auto rounded bg-white border border-green-100 p-2 space-y-0.5">
                {result.newly_added.map((p, i) => (
                  <p key={i} className="text-xs text-green-700">
                    <span className="font-mono font-medium">{p.product_id}</span> — {p.product_name}
                  </p>
                ))}
              </div>
            </details>
          )}

          {/* Updated list */}
          {result.updated?.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs font-semibold text-blue-700 cursor-pointer">↻ {updatedCount} Updated Products</summary>
              <div className="mt-1 max-h-32 overflow-y-auto rounded bg-white border border-blue-100 p-2 space-y-0.5">
                {result.updated.map((p, i) => (
                  <p key={i} className="text-xs text-blue-700">
                    <span className="font-mono font-medium">{p.product_id}</span> — {p.product_name}
                    {p.changed_fields?.length > 0 && (
                      <span className="ml-2 text-blue-400">({p.changed_fields.join(', ')} changed)</span>
                    )}
                  </p>
                ))}
              </div>
            </details>
          )}

          {/* Already present list */}
          {result.already_present?.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs font-semibold text-amber-600 cursor-pointer">○ {alreadyPresentCount} Already Present (no changes)</summary>
              <div className="mt-1 max-h-32 overflow-y-auto rounded bg-white border border-amber-100 p-2 space-y-0.5">
                {result.already_present.map((p, i) => (
                  <p key={i} className="text-xs text-amber-700">
                    <span className="font-mono font-medium">{p.product_id}</span> — {p.product_name}
                  </p>
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {/* Errors (validation or failed rows) */}
      {(result.errors?.length > 0 || result.failed?.length > 0) && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-white border border-red-100 p-3 space-y-1">
          {(result.errors || result.failed || []).map((e, i) => (
            <p key={i} className="text-xs text-red-600">
              <span className="font-medium">{e.product_id || `Row ${e.row}`}:</span> {e.error}
            </p>
          ))}
        </div>
      )}

      {/* Preview table */}
      {result.preview?.length > 0 && (
        <details className="mt-3">
          <summary className="text-sm font-medium text-gray-600 cursor-pointer">
            Preview first {result.preview.length} rows
          </summary>
          <div className="overflow-x-auto mt-2 rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {['product_id','product_name','original_price','discounted_price','color','size','is_active'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.preview.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono">{row.product_id}</td>
                    <td className="px-3 py-2">{row.product_name}</td>
                    <td className="px-3 py-2">₹{row.original_price}</td>
                    <td className="px-3 py-2">{row.discounted_price ? `₹${row.discounted_price}` : '—'}</td>
                    <td className="px-3 py-2">{row.color}</td>
                    <td className="px-3 py-2">{row.size}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {row.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-component: Products Table
───────────────────────────────────────────── */
function ProductsTable({ products, loading, onToggle, toggling }) {
  if (loading) return (
    <div className="flex justify-center py-12">
      <RefreshCw size={24} className="animate-spin text-emerald-500"/>
    </div>
  );
  if (!products.length) return (
    <div className="text-center py-12 text-gray-400">
      <FileSpreadsheet size={40} className="mx-auto mb-2 opacity-40"/>
      <p>No products found. Import an Excel file to get started.</p>
    </div>
  );
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {['Product ID','Name','Price','Sale Price','Colors','Sizes','Status','Toggle'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {products.map((p) => (
            <tr key={p.product_id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.product_id}</td>
              <td className="px-4 py-3 font-medium text-gray-800 max-w-[180px] truncate">{p.product_name}</td>
              <td className="px-4 py-3 text-gray-600">₹{p.original_price}</td>
              <td className="px-4 py-3 text-gray-600">{p.discounted_price ? `₹${p.discounted_price}` : '—'}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {(p.colors || []).slice(0,3).map(c => (
                    <span key={c} className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{c}</span>
                  ))}
                  {(p.colors||[]).length > 3 && <span className="text-xs text-gray-400">+{p.colors.length-3}</span>}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">{(p.sizes||[]).join(', ') || '—'}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {p.is_active ? '● Active' : '○ Inactive'}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggle(p.product_id)}
                  disabled={toggling === p.product_id}
                  title={p.is_active ? 'Deactivate' : 'Activate'}
                  className="text-gray-500 hover:text-emerald-600 transition-colors disabled:opacity-40"
                >
                  {toggling === p.product_id
                    ? <RefreshCw size={18} className="animate-spin"/>
                    : p.is_active ? <ToggleRight size={22} className="text-emerald-500"/> : <ToggleLeft size={22}/>
                  }
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-component: Audit Logs
───────────────────────────────────────────── */
function AuditLogs({ logs, loading }) {
  if (loading) return <div className="text-center py-6 text-gray-400"><RefreshCw size={18} className="animate-spin mx-auto"/></div>;
  if (!logs.length) return <p className="text-center py-6 text-gray-400 text-sm">No import history yet.</p>;
  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {logs.map((log) => {
        // Support both old (created/updated/deactivated) and new (newly_added_count/updated_count/already_present_count) field names
        const added   = log.newly_added_count    ?? log.created    ?? 0;
        const updated = log.updated_count        ?? log.updated    ?? 0;
        const present = log.already_present_count?? log.deactivated?? 0;
        const failed  = log.failed_count         ?? log.failed     ?? 0;
        return (
          <div key={log.log_id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
            <Clock size={14} className="mt-0.5 text-gray-400 shrink-0"/>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs mb-1">
                <span className="font-semibold text-gray-700">{new Date(log.timestamp).toLocaleString()}</span>
                <span className={`font-medium ${log.status === 'completed' ? 'text-emerald-600' : 'text-red-500'}`}>{log.status}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="text-green-600">+{added} added</span>
                <span className="text-blue-600">↻ {updated} updated</span>
                <span className="text-amber-600">○ {present} unchanged</span>
                {failed > 0 && <span className="text-red-600">✕ {failed} failed</span>}
              </div>
              {log.sections_uploaded?.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Columns: {log.sections_uploaded.join(', ')}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const ExcelProductManager = () => {
  const fileRef = useRef(null);

  // Upload state
  const [selectedFile, setSelectedFile]   = useState(null);
  const [partialMode,  setPartialMode]     = useState(false);
  const [importing,    setImporting]       = useState(false);
  const [importResult, setImportResult]    = useState(null);

  // Products list state
  const [products,     setProducts]        = useState([]);
  const [prodLoading,  setProdLoading]     = useState(false);
  const [toggling,     setToggling]        = useState(null);
  const [filterActive, setFilterActive]    = useState('all');
  const [search,       setSearch]          = useState('');
  const [page,         setPage]            = useState(1);
  const [totalPages,   setTotalPages]      = useState(1);
  const [totalCount,   setTotalCount]      = useState(0);

  // Logs state
  const [logs,         setLogs]            = useState([]);
  const [logsLoading,  setLogsLoading]     = useState(false);
  const [showLogs,     setShowLogs]        = useState(false);

  // Export state
  const [exporting,    setExporting]       = useState(false);
  const [dlTemplate,   setDlTemplate]      = useState(false);

  // ── Fetch products ──
  const fetchProducts = useCallback(async () => {
    setProdLoading(true);
    try {
      const params = { page, page_size: 15, search: search || undefined };
      if (filterActive !== 'all') params.is_active = filterActive === 'active';
      const res = await excelAPI.listProducts(params);
      setProducts(res.data.items);
      setTotalPages(res.data.pages);
      setTotalCount(res.data.total);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setProdLoading(false);
    }
  }, [page, search, filterActive]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Fetch logs ──
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await excelAPI.getLogs(20);
      setLogs(res.data);
    } catch {
      toast.error('Failed to load import logs');
    } finally {
      setLogsLoading(false);
    }
  };
  useEffect(() => { if (showLogs) fetchLogs(); }, [showLogs]);

  // ── Handlers ──
  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.xlsx')) { toast.error('Only .xlsx files accepted'); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5 MB'); return; }
    setSelectedFile(f);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!selectedFile) { toast.error('Select an .xlsx file first'); return; }
    setImporting(true);
    try {
      const res = await excelAPI.importExcel(selectedFile, partialMode);
      setImportResult(res.data);
      if (res.data.status === 'completed') {
        const s = res.data.summary || {};
        const added   = s.newly_added_count    ?? (res.data.newly_added?.length    ?? 0);
        const updated = s.updated_count        ?? (res.data.updated?.length        ?? 0);
        const present = s.already_present_count?? (res.data.already_present?.length?? 0);
        const failed  = s.failed_count         ?? (res.data.failed?.length         ?? 0);
        toast.success(
          `Import done — ${added} added, ${updated} updated, ${present} unchanged${ failed ? `, ${failed} failed` : '' }`
        );
        fetchProducts();
        if (showLogs) fetchLogs();
      } else {
        toast.error('Validation failed — see errors below');
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Import failed');
      setImportResult({ status: 'validation_failed', errors: [], preview: [] });
    } finally {
      setImporting(false);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleExport = async (isActive) => {
    setExporting(true);
    try {
      const res = await excelAPI.exportExcel(isActive);
      const stamp = new Date().toISOString().slice(0,10);
      downloadBlob(res.data, `burhani_products_${stamp}.xlsx`);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleTemplate = async () => {
    setDlTemplate(true);
    try {
      const res = await excelAPI.downloadTemplate();
      downloadBlob(res.data, 'burhani_product_template.xlsx');
      toast.success('Template downloaded');
    } catch {
      toast.error('Template download failed');
    } finally {
      setDlTemplate(false);
    }
  };

  const handleToggle = async (productId) => {
    setToggling(productId);
    try {
      const res = await excelAPI.toggleProduct(productId);
      const now = res.data.is_active;
      toast.success(`Product ${now ? 'activated' : 'deactivated'}`);
      setProducts(prev => prev.map(p =>
        p.product_id === productId ? { ...p, is_active: now } : p
      ));
    } catch {
      toast.error('Toggle failed');
    } finally {
      setToggling(null);
    }
  };

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handleFilter = (val) => { setFilterActive(val); setPage(1); };

  // ─────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet size={22} className="text-emerald-600"/> Excel Product Manager
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Bulk import, export, and manage products via Excel</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleTemplate}
            disabled={dlTemplate}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {dlTemplate ? <RefreshCw size={15} className="animate-spin"/> : <Download size={15}/>}
            Template
          </button>
          <button
            onClick={() => handleExport(null)}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-emerald-500 text-emerald-700 rounded-lg bg-white hover:bg-emerald-50 transition-colors disabled:opacity-50"
          >
            {exporting ? <RefreshCw size={15} className="animate-spin"/> : <Download size={15}/>}
            Export All
          </button>
          <button
            onClick={() => handleExport(true)}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Eye size={15}/> Export Active
          </button>
        </div>
      </div>

      {/* ── Import Card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Upload size={18} className="text-emerald-600"/> Upload Excel File
        </h3>

        <ResultBanner result={importResult} onDismiss={() => setImportResult(null)}/>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* Drop zone */}
          <label
            htmlFor="excel-upload"
            className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer transition-colors
              ${selectedFile ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'}`}
          >
            <FileSpreadsheet size={32} className={selectedFile ? 'text-emerald-500' : 'text-gray-400'}/>
            <p className="mt-2 text-sm font-medium text-gray-700">
              {selectedFile ? selectedFile.name : 'Click or drag .xlsx file here'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Max 5 MB · .xlsx only</p>
            <input
              id="excel-upload"
              ref={fileRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          {/* Options + Upload btn */}
          <div className="flex flex-col gap-3 min-w-[180px]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={partialMode}
                onChange={e => setPartialMode(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600"
              />
              <span className="text-sm text-gray-600">Partial success mode</span>
            </label>
            <p className="text-xs text-gray-400">
              {partialMode
                ? '✓ Valid rows are saved even if some fail'
                : '✕ Any error rolls back all changes'}
            </p>
            <button
              onClick={handleImport}
              disabled={!selectedFile || importing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-auto"
            >
              {importing
                ? <><RefreshCw size={16} className="animate-spin"/> Importing…</>
                : <><Upload size={16}/> Import Now</>}
            </button>
          </div>
        </div>

        {/* Schema hint */}
        <details className="mt-4">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">View required column schema</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {['product_id*','product_name','original_price*','discounted_price','description','color','size','product_images','is_active'].map(col => (
              <code key={col} className={`px-2 py-0.5 rounded text-xs ${col.endsWith('*') ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                {col}
              </code>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">* required · color/size/images = comma-separated · is_active = TRUE/FALSE</p>
        </details>
      </div>

      {/* ── Products Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            Products
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{totalCount}</span>
          </h3>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Filter buttons */}
            {[['all','All'],['active','Active'],['inactive','Inactive']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => handleFilter(val)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
                  ${filterActive === val
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {val === 'active' && <Eye size={12} className="inline mr-1"/>}
                {val === 'inactive' && <EyeOff size={12} className="inline mr-1"/>}
                {label}
              </button>
            ))}
            {/* Search */}
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={handleSearch}
              className="pl-3 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <button onClick={fetchProducts} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Refresh">
              <RefreshCw size={16} className={prodLoading ? 'animate-spin text-emerald-500' : 'text-gray-500'}/>
            </button>
          </div>
        </div>

        <ProductsTable
          products={products}
          loading={prodLoading}
          onToggle={handleToggle}
          toggling={toggling}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16}/>
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p+1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Audit Logs ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <button
          onClick={() => setShowLogs(v => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <Clock size={16} className="text-gray-400"/> Import History
          </h3>
          <span className="text-xs text-gray-400">{showLogs ? '▲ Hide' : '▼ Show'}</span>
        </button>
        {showLogs && (
          <div className="mt-4">
            <AuditLogs logs={logs} loading={logsLoading}/>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelProductManager;
