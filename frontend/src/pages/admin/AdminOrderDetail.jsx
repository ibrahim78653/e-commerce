import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import { ArrowLeft, Package, MapPin, User, Clock, CreditCard, Download, FileText, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { generateInvoice } from '../../utils/generateInvoice';

const AdminOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await ordersAPI.getById(id);
                setOrder(res.data);
            } catch (error) {
                console.error(error);
                toast.error("Failed to fetch order details");
                navigate('/admin');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchOrder();
    }, [id, navigate]);

    const handleStatusUpdate = async (newStatus) => {
        try {
            await ordersAPI.updateStatus(id, { status: newStatus });
            setOrder({ ...order, status: newStatus });
            toast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    const handleDownloadInvoice = async () => {
        if (!order) return;
        setDownloading(true);
        try {
            generateInvoice(order);
            toast.success(`Invoice for Order #${order.id} generated!`);
        } catch (err) {
            console.error('Invoice generation failed:', err);
            toast.error('Failed to generate invoice');
        } finally {
            setDownloading(false);
        }
    };

    const STATUS_BADGE = {
        delivered: 'bg-green-100 text-green-800 border-green-200',
        cancelled: 'bg-red-100 text-red-800 border-red-200',
        shipped: 'bg-purple-100 text-purple-800 border-purple-200',
        confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Loading order details…</p>
            </div>
        </div>
    );

    if (!order) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <Package size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">Order not found</p>
            </div>
        </div>
    );

    const subtotal = (order.items || []).reduce((s, i) => s + (i.price * i.quantity), 0);
    const shipping = order.total_amount - subtotal;
    const badgeClass = STATUS_BADGE[(order.status || 'pending').toLowerCase()] || STATUS_BADGE.pending;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">

                {/* Top bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
                    >
                        <ArrowLeft size={20} className="mr-2" />
                        Back to Orders
                    </button>

                    {/* Download Invoice */}
                    <motion.button
                        id="admin-download-invoice-btn"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleDownloadInvoice}
                        disabled={downloading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60 text-sm"
                    >
                        {downloading ? (
                            <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Generating…</>
                        ) : (
                            <><Download size={16} /> Download Invoice</>
                        )}
                    </motion.button>
                </div>

                {/* Order Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FileText size={28} className="text-red-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${badgeClass}`}>
                                        {order.status.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-gray-500 mt-1 text-sm flex items-center gap-2">
                                    <Clock size={13} />
                                    {new Date(order.created_at).toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>

                        {/* Status Updater */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-500">Update Status:</label>
                            <select
                                className="input bg-white border-gray-300 shadow-sm text-sm font-medium rounded-lg"
                                value={order.status}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                            >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                    {/* Customer Details */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User size={15} className="text-red-400" /> Customer Information
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Name</p>
                                <p className="font-semibold text-gray-900 mt-0.5">{order.customer_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Email</p>
                                <p className="text-gray-700 mt-0.5 text-sm flex items-center gap-1">
                                    <Mail size={12} className="text-gray-400 flex-shrink-0" />
                                    <span className="break-all">{order.customer_email || 'N/A'}</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Phone</p>
                                <p className="text-gray-700 mt-0.5 text-sm flex items-center gap-1">
                                    <Phone size={12} className="text-gray-400 flex-shrink-0" />
                                    {order.customer_phone}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <MapPin size={15} className="text-green-400" /> Shipping Address
                        </h2>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                            {order.address}
                        </p>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CreditCard size={15} className="text-red-400" /> Payment Details
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Method</p>
                                <p className="font-semibold capitalize text-gray-900 mt-0.5">
                                    {order.payment_method === 'razorpay' ? 'Online (Razorpay)' : order.payment_method === 'whatsapp' ? 'WhatsApp / COD' : order.payment_method}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Grand Total</p>
                                <p className="text-2xl font-bold text-red-600 mt-0.5">₹{order.total_amount.toFixed(2)}</p>
                            </div>
                            {order.razorpay_payment_id && (
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase">Transaction ID</p>
                                    <p className="font-mono text-xs text-gray-600 mt-0.5 break-all">{order.razorpay_payment_id}</p>
                                </div>
                            )}
                        </div>

                        {/* Invoice Download in payment card */}
                        <button
                            onClick={handleDownloadInvoice}
                            disabled={downloading}
                            className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Download size={14} />
                            {downloading ? 'Generating…' : 'Download Invoice PDF'}
                        </button>
                    </div>
                </div>

                {/* Order Items Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Package size={18} className="text-red-500" />
                        <h2 className="text-base font-bold text-gray-900">Order Items</h2>
                        <span className="ml-auto text-sm text-gray-400">{order.items?.length || 0} item(s)</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">#</th>
                                    <th className="px-6 py-3 font-semibold">Product</th>
                                    <th className="px-6 py-3 font-semibold text-center">Size</th>
                                    <th className="px-6 py-3 font-semibold text-center">Color</th>
                                    <th className="px-6 py-3 font-semibold text-right">Unit Price</th>
                                    <th className="px-6 py-3 font-semibold text-center">Qty</th>
                                    <th className="px-6 py-3 font-semibold text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(order.items || []).map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-400 font-medium">{idx + 1}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">{item.product_name}</td>
                                        <td className="px-6 py-4 text-center text-gray-600">{item.selected_size || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            {item.selected_color
                                                ? <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">{item.selected_color}</span>
                                                : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-700">₹{Number(item.price).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center font-semibold">{item.quantity}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t border-gray-200 text-sm">
                                <tr>
                                    <td colSpan="6" className="px-6 py-3 text-right text-gray-500 font-medium">Subtotal</td>
                                    <td className="px-6 py-3 text-right font-semibold text-gray-900">₹{subtotal.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="6" className="px-6 py-3 text-right text-gray-500 font-medium">Shipping</td>
                                    <td className="px-6 py-3 text-right font-semibold text-gray-900">₹{shipping.toFixed(2)}</td>
                                </tr>
                                <tr className="bg-gradient-to-r from-red-900 to-red-800">
                                    <td colSpan="6" className="px-6 py-4 text-right font-bold text-white text-base">Grand Total</td>
                                    <td className="px-6 py-4 text-right font-bold text-yellow-300 text-base">₹{order.total_amount.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Invoice Path Note for Admin */}
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                    <FileText size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-900 text-sm">Invoice Reference</p>
                        <p className="text-red-700 text-xs mt-0.5">
                            Invoice ID: <span className="font-mono font-bold">INV-{String(order.id).padStart(5, '0')}</span>
                            &nbsp;|&nbsp; File: <span className="font-mono">BurhaniCollection_Invoice_{order.id}.pdf</span>
                            &nbsp;|&nbsp; Placed: {new Date(order.created_at).toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetail;
