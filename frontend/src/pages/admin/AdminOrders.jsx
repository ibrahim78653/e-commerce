import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import {
    Package, Download, FileText, FileSpreadsheet,
    ChevronDown, Calendar, Filter, ArrowUpDown,
    X, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { generateInvoice } from '../../utils/generateInvoice';

// ─── Status badge colours ───────────────────────────────────────────────────
const STATUS_BADGE = {
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled:  'bg-red-100   text-red-800   border-red-200',
    shipped:    'bg-purple-100 text-purple-800 border-purple-200',
    confirmed:  'bg-blue-100  text-blue-800  border-blue-200',
    pending:    'bg-yellow-100 text-yellow-800 border-yellow-200',
};

// ─── Filter / sort options ──────────────────────────────────────────────────
const FILTER_OPTIONS = [
    { value: 'all',           label: 'All Orders' },
    { value: 'current_year',  label: 'Current Year' },
    { value: 'last_year',     label: 'Last Year' },
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month',    label: 'Last Month' },
    { value: 'this_week',     label: 'This Week' },
    { value: 'last_week',     label: 'Last Week' },
    { value: 'custom',        label: 'Custom Range…' },
];

const SORT_OPTIONS = [
    { value: 'newest',      label: 'Newest First' },
    { value: 'oldest',      label: 'Oldest First' },
    { value: 'amount_high', label: 'Amount: High → Low' },
    { value: 'amount_low',  label: 'Amount: Low → High' },
];

// ─── Helper: today's date as YYYY-MM-DD ────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);

// ─── Tiny styled select ─────────────────────────────────────────────────────
const StyledSelect = ({ icon: Icon, value, onChange, options, disabled }) => (
    <div className="relative flex items-center">
        {Icon && (
            <span className="absolute left-3 text-gray-400 pointer-events-none">
                <Icon size={14} />
            </span>
        )}
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`
                appearance-none text-sm border border-gray-200 bg-white rounded-lg
                pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400
                shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${Icon ? 'pl-8' : 'pl-3'}
            `}
        >
            {options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
        <ChevronDown size={12} className="absolute right-2.5 text-gray-400 pointer-events-none" />
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════
const AdminOrders = () => {
    const [orders, setOrders]               = useState([]);
    const [loading, setLoading]             = useState(false);
    const [filterStatus, setFilterStatus]   = useState('all');
    const [searchQuery, setSearchQuery]     = useState('');
    const [page, setPage]                   = useState(1);
    const [totalPages, setTotalPages]       = useState(1);
    const [totalOrders, setTotalOrders]     = useState(0);
    const [downloadingId, setDownloadingId] = useState(null);
    const navigate = useNavigate();

    // ── Export state ──────────────────────────────────────────────────────
    const [showExportPanel, setShowExportPanel] = useState(false);
    const [exportFilter, setExportFilter]       = useState('all');
    const [exportSort, setExportSort]           = useState('newest');
    const [exportFormat, setExportFormat]       = useState('xlsx');
    const [startDate, setStartDate]             = useState(todayStr());
    const [endDate, setEndDate]                 = useState(todayStr());
    const [exporting, setExporting]             = useState(false);
    const panelRef = useRef(null);

    // ── Fetch orders ──────────────────────────────────────────────────────
    const fetchOrders = async (pageToFetch = 1) => {
        setLoading(true);
        try {
            const params = {
                page: pageToFetch,
                page_size: 20
            };
            if (filterStatus !== 'all') params.status = filterStatus;
            if (searchQuery.trim()) params.search = searchQuery.trim();
            
            const res = await ordersAPI.getAllAdmin(params);
            setOrders(res.data.items || []);
            setTotalPages(res.data.pages || 1);
            setTotalOrders(res.data.total || 0);
            setPage(res.data.page || 1);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    // Debounced search/filter effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchOrders(1);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [filterStatus, searchQuery]);

    // Close panel on outside click
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setShowExportPanel(false);
            }
        };
        if (showExportPanel) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showExportPanel]);

    // ── Status update ─────────────────────────────────────────────────────
    const handleStatusUpdate = async (e, id, newStatus) => {
        e.stopPropagation();
        try {
            await ordersAPI.updateStatus(id, { status: newStatus });
            setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
            toast.success('Order status updated');
        } catch {
            toast.error('Failed to update status');
        }
    };

    // ── Invoice download ──────────────────────────────────────────────────
    const handleDownloadInvoice = async (e, order) => {
        e.stopPropagation();
        setDownloadingId(order.id);
        try {
            let fullOrder = order;
            if (!order.items || order.items.length === 0) {
                const res = await ordersAPI.getById(order.id);
                fullOrder = res.data;
            }
            generateInvoice(fullOrder);
            toast.success(`Invoice #${order.id} downloaded`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate invoice');
        } finally {
            setDownloadingId(null);
        }
    };

    // ── Export handler ────────────────────────────────────────────────────
    const handleExport = async () => {
        if (exportFilter === 'custom') {
            if (!startDate || !endDate) {
                toast.error('Please select both start and end dates');
                return;
            }
            if (startDate > endDate) {
                toast.error('Start date must be before or equal to end date');
                return;
            }
        }

        setExporting(true);
        const toastId = toast.loading(
            `Generating ${exportFormat.toUpperCase()} export…`,
            { duration: Infinity }
        );

        try {
            const res = await ordersAPI.exportOrders({
                filterBy:  exportFilter,
                sortBy:    exportSort,
                startDate: exportFilter === 'custom' ? startDate : null,
                endDate:   exportFilter === 'custom' ? endDate   : null,
                format:    exportFormat,
            });

            // Direct browser download — no Axios blob corruption
            const { downloadUrl } = res;
            const a = document.createElement('a');
            a.href = downloadUrl;
            const base =
                exportFilter === 'custom'
                    ? `orders_custom_${startDate}_to_${endDate}`
                    : `orders_${exportFilter}`;
            a.download = `${base}.${exportFormat}`;
            document.body.appendChild(a);
            a.click();
            a.remove();

            toast.dismiss(toastId);
            toast.success(`✅ ${a.download} downloaded!`);
            setShowExportPanel(false);
        } catch (err) {
            console.error(err);
            toast.dismiss(toastId);
            toast.error('Export failed. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    // ── Filtered orders (by order status, not export filter) ──────────────
    // The backend now filters orders, so we just use the fetched orders directly
    const filteredOrders = orders;

    // ── Loading state ─────────────────────────────────────────────────────
    if (loading) return (
        <div className="p-8 text-center">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading orders…</p>
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 bg-white rounded-xl shadow-sm">

            {/* ── Top bar ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap justify-between items-start mb-6 gap-4">

                {/* Title */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Order Management</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{totalOrders} order(s)</p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3">

                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search order ID or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="appearance-none text-sm border border-gray-200 bg-white rounded-lg pl-3 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 shadow-sm w-48 sm:w-64"
                        />
                    </div>

                    {/* Status filter */}
                    <StyledSelect
                        icon={Filter}
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        options={[
                            { value: 'all',       label: 'All Statuses' },
                            { value: 'pending',   label: 'Pending' },
                            { value: 'confirmed', label: 'Confirmed' },
                            { value: 'shipped',   label: 'Shipped' },
                            { value: 'delivered', label: 'Delivered' },
                            { value: 'cancelled', label: 'Cancelled' },
                        ]}
                    />

                    {/* Export button + dropdown panel */}
                    <div className="relative" ref={panelRef}>
                        <button
                            id="export-orders-btn"
                            onClick={() => setShowExportPanel(v => !v)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-lg shadow hover:from-red-700 hover:to-red-800 active:scale-95 transition-all"
                        >
                            <FileSpreadsheet size={15} />
                            Export Orders
                            <ChevronDown
                                size={13}
                                className={`transition-transform ${showExportPanel ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* ── Export panel ─────────────────────────────── */}
                        <AnimatePresence>
                            {showExportPanel && (
                                <motion.div
                                    key="export-panel"
                                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0,  scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                    transition={{ duration: 0.18 }}
                                    className="absolute right-0 top-full mt-2 z-50 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
                                >
                                    {/* Panel header */}
                                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-600 to-red-700">
                                        <div className="flex items-center gap-2 text-white font-semibold text-sm">
                                            <FileSpreadsheet size={15} />
                                            Export Orders
                                        </div>
                                        <button
                                            onClick={() => setShowExportPanel(false)}
                                            className="text-white/70 hover:text-white transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    <div className="p-4 space-y-4">

                                        {/* Date / time filter */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                <Calendar size={11} className="inline mr-1" />
                                                Date Filter
                                            </label>
                                            <StyledSelect
                                                value={exportFilter}
                                                onChange={e => setExportFilter(e.target.value)}
                                                options={FILTER_OPTIONS}
                                                disabled={exporting}
                                            />
                                        </div>

                                        {/* Custom date pickers */}
                                        <AnimatePresence>
                                            {exportFilter === 'custom' && (
                                                <motion.div
                                                    key="custom-dates"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="grid grid-cols-2 gap-3 overflow-hidden"
                                                >
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1 font-medium">
                                                            Start Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={startDate}
                                                            max={endDate || todayStr()}
                                                            onChange={e => setStartDate(e.target.value)}
                                                            disabled={exporting}
                                                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1 font-medium">
                                                            End Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={endDate}
                                                            min={startDate}
                                                            max={todayStr()}
                                                            onChange={e => setEndDate(e.target.value)}
                                                            disabled={exporting}
                                                            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Sort */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                <ArrowUpDown size={11} className="inline mr-1" />
                                                Sort By
                                            </label>
                                            <StyledSelect
                                                value={exportSort}
                                                onChange={e => setExportSort(e.target.value)}
                                                options={SORT_OPTIONS}
                                                disabled={exporting}
                                            />
                                        </div>

                                        {/* Format toggle */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                                Format
                                            </label>
                                            <div className="flex gap-2">
                                                {['xlsx', 'csv'].map(fmt => (
                                                    <button
                                                        key={fmt}
                                                        onClick={() => setExportFormat(fmt)}
                                                        disabled={exporting}
                                                        className={`
                                                            flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50
                                                            ${exportFormat === fmt
                                                                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}
                                                        `}
                                                    >
                                                        {fmt === 'xlsx' ? '📊 Excel (.xlsx)' : '📄 CSV (.csv)'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-gray-100" />

                                        {/* Summary label */}
                                        <p className="text-xs text-gray-400 text-center">
                                            Exports full dataset (not just this page)
                                        </p>

                                        {/* Export action button */}
                                        <button
                                            id="do-export-btn"
                                            onClick={handleExport}
                                            disabled={exporting}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold rounded-xl shadow hover:from-red-700 hover:to-red-800 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {exporting ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin" />
                                                    Generating…
                                                </>
                                            ) : (
                                                <>
                                                    <Download size={14} />
                                                    Download {exportFormat.toUpperCase()}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── Orders table ─────────────────────────────────────────── */}
            <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th className="px-5 py-3 text-left font-semibold">Order ID</th>
                            <th className="px-5 py-3 text-left font-semibold">Customer</th>
                            <th className="px-5 py-3 text-left font-semibold">Date</th>
                            <th className="px-5 py-3 text-left font-semibold">Total</th>
                            <th className="px-5 py-3 text-left font-semibold">Status</th>
                            <th className="px-5 py-3 text-left font-semibold">Update</th>
                            <th className="px-5 py-3 text-center font-semibold">Invoice</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="py-12 text-center">
                                    <Package size={40} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-400">No orders found</p>
                                </td>
                            </tr>
                        ) : filteredOrders.map((order) => (
                            <tr
                                key={order.id}
                                onClick={() => navigate(`/admin/orders/${order.id}`)}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <td className="px-5 py-4 font-bold text-red-600">#{order.id}</td>
                                <td className="px-5 py-4">
                                    <div className="font-medium text-gray-900">{order.customer_name}</div>
                                    <div className="text-xs text-gray-400">{order.customer_phone}</div>
                                    {order.customer_email && (
                                        <div className="text-xs text-gray-400 truncate max-w-[150px]">
                                            {order.customer_email}
                                        </div>
                                    )}
                                </td>
                                <td className="px-5 py-4 text-gray-600">
                                    {new Date(order.created_at).toLocaleDateString('en-IN')}
                                </td>
                                <td className="px-5 py-4 font-bold text-gray-900">
                                    ₹{Number(order.total_amount).toFixed(2)}
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${STATUS_BADGE[(order.status || 'pending').toLowerCase()] || STATUS_BADGE.pending}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                    <select
                                        className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                                        value={order.status}
                                        onChange={e => handleStatusUpdate(e, order.id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                                <td className="px-5 py-4 text-center" onClick={e => e.stopPropagation()}>
                                    <button
                                        id={`admin-invoice-btn-${order.id}`}
                                        onClick={e => handleDownloadInvoice(e, order)}
                                        disabled={downloadingId === order.id}
                                        title={`Download invoice for order #${order.id}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {downloadingId === order.id ? (
                                            <span className="animate-spin inline-block w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full" />
                                        ) : (
                                            <Download size={12} />
                                        )}
                                        PDF
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-2">
                    <p className="text-sm text-gray-500">
                        Showing page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchOrders(page - 1)}
                            disabled={page === 1}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Simple logic to show current page and surrounding pages
                                let pageNum = i + 1;
                                if (totalPages > 5 && page > 3) {
                                    pageNum = page - 3 + i + (page + 2 > totalPages ? totalPages - page - 2 : 0);
                                }
                                if (pageNum > totalPages || pageNum < 1) return null;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => fetchOrders(pageNum)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                            page === pageNum
                                                ? 'bg-red-600 text-white'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => fetchOrders(page + 1)}
                            disabled={page === totalPages}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
