/**
 * Orders Page - Luxury Redesign
 * Burhani Collection — Premium Boutique
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package, Clock, CheckCircle, Truck, XCircle,
    ChevronRight, Download, FileText, ShoppingBag, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { generateInvoice } from '../utils/generateInvoice';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await ordersAPI.getAll();
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to load orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async (e, order) => {
        e.preventDefault();
        e.stopPropagation();
        setDownloadingId(order.id);
        try {
            let fullOrder = order;
            if (!order.items || order.items.length === 0) {
                const res = await ordersAPI.getById(order.id);
                fullOrder = res.data;
            }
            generateInvoice(fullOrder);
            toast.success(`Invoice for Order #${order.id} downloaded!`);
        } catch (err) {
            console.error('Invoice generation failed:', err);
            toast.error('Failed to generate invoice');
        } finally {
            setDownloadingId(null);
        }
    };

    const getStatusConfig = (status) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'PENDING':   return { icon: Clock,         color: '#D4AF37', bg: '#D4AF37', label: 'Pending' };
            case 'CONFIRMED': return { icon: CheckCircle,   color: '#A94A4A', bg: '#A94A4A', label: 'Confirmed' };
            case 'SHIPPED':   return { icon: Truck,          color: '#7B68EE', bg: '#7B68EE', label: 'Shipped' };
            case 'DELIVERED': return { icon: CheckCircle,   color: '#22c55e', bg: '#22c55e', label: 'Delivered' };
            case 'CANCELLED': return { icon: XCircle,       color: '#ef4444', bg: '#ef4444', label: 'Cancelled' };
            default:          return { icon: Package,       color: '#9ca3af', bg: '#9ca3af', label: status };
        }
    };

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
        });

    // ── Loading State ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7]">
                <div className="bg-[#1a0a00] border-b border-[#D4AF37]/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-2">Burhani Collection</p>
                        <div className="h-9 w-40 bg-white/10 rounded-lg animate-pulse" />
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-[#D4AF37]/10 h-44 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    // ── Empty State ───────────────────────────────────────────────────────────
    if (orders.length === 0) {
        return (
            <div className="min-h-screen bg-[#FDFBF7]">
                <div className="bg-[#1a0a00] border-b border-[#D4AF37]/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-2">Burhani Collection</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-[#FDFBF7]"
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                            My Orders
                        </h1>
                    </div>
                </div>
                <div className="flex items-center justify-center py-28 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-md"
                    >
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#A94A4A]/10 flex items-center justify-center border border-[#D4AF37]/30 mx-auto mb-8">
                            <Package size={46} className="text-[#D4AF37]/60" />
                        </div>
                        <h2 className="text-3xl font-bold text-[#1a0a00] mb-3"
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                            No Orders Yet
                        </h2>
                        <p className="text-gray-500 text-sm leading-relaxed mb-8">
                            You haven't placed any orders. Explore our premium boutique collection and make your first purchase.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1a0a00] text-[#D4AF37] font-bold text-sm uppercase tracking-[0.15em] rounded-full hover:bg-[#2d1200] transition-all duration-300 shadow-lg shadow-[#1a0a00]/20"
                        >
                            <Sparkles size={16} />
                            Start Shopping
                        </Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── Orders List ───────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* Page Header */}
            <div className="bg-[#1a0a00] border-b border-[#D4AF37]/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-end gap-4"
                    >
                        <div>
                            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-2">Burhani Collection</p>
                            <h1 className="text-3xl md:text-4xl font-bold text-[#FDFBF7]"
                                style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                My Orders
                            </h1>
                        </div>
                        <span className="mb-1 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold tracking-wider">
                            {orders.length} order{orders.length !== 1 ? 's' : ''}
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* Order Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-5">
                {orders.map((order, orderIdx) => {
                    const statusConfig = getStatusConfig(order.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: orderIdx * 0.06, duration: 0.4 }}
                            className="bg-white rounded-2xl border border-[#D4AF37]/15 hover:border-[#D4AF37]/35 shadow-sm hover:shadow-lg hover:shadow-[#1a0a00]/5 transition-all duration-300 overflow-hidden group"
                        >
                            {/* Card Header */}
                            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FDFBF7] to-white border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: `${statusConfig.bg}15` }}>
                                        <FileText size={17} style={{ color: statusConfig.color }} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-base leading-tight"
                                            style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                            Order #{order.id}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-0.5">Placed on {formatDate(order.created_at)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Status Badge */}
                                    <span
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border"
                                        style={{
                                            color: statusConfig.color,
                                            borderColor: `${statusConfig.color}40`,
                                            background: `${statusConfig.bg}10`,
                                        }}
                                    >
                                        <StatusIcon size={11} />
                                        {statusConfig.label}
                                    </span>
                                    {/* Order Total */}
                                    <span className="text-lg font-black text-gray-900">
                                        ₹{(order.total_amount || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Order Items Preview */}
                            <div className="px-5 py-4 space-y-2.5 border-b border-gray-50">
                                {order.items?.slice(0, 3).map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center bg-[#FDFBF7] border border-[#D4AF37]/15">
                                            <Package size={15} className="text-[#D4AF37]/60" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 text-xs truncate">{item.product_name}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                Qty: {item.quantity}
                                                {item.selected_size && ` · Size: ${item.selected_size}`}
                                                {item.selected_color && ` · ${item.selected_color}`}
                                            </p>
                                        </div>
                                        <p className="text-xs font-bold text-gray-700 flex-shrink-0">
                                            ₹{(item.price * item.quantity).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                                {order.items?.length > 3 && (
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] pl-14">
                                        +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                                <div className="text-xs text-gray-400">
                                    <span className="font-semibold text-gray-600">
                                        {order.payment_method === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}
                                    </span>
                                    <span className="mx-2 text-gray-200">|</span>
                                    <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Invoice Download */}
                                    {!(order.payment_method === 'whatsapp' && order.status?.toLowerCase() === 'pending') && (
                                        <button
                                            id={`invoice-btn-${order.id}`}
                                            onClick={(e) => handleDownloadInvoice(e, order)}
                                            disabled={downloadingId === order.id}
                                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A94A4A] border border-[#A94A4A]/25 hover:border-[#A94A4A]/60 hover:bg-[#A94A4A]/5 px-3 py-1.5 rounded-lg transition-all duration-200 disabled:opacity-40"
                                        >
                                            {downloadingId === order.id ? (
                                                <span className="w-3 h-3 border-2 border-[#A94A4A] border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Download size={11} />
                                            )}
                                            Invoice
                                        </button>
                                    )}

                                    {/* View Details */}
                                    <Link
                                        to={`/orders/${order.id}`}
                                        className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1a0a00] hover:text-[#A94A4A] transition-colors duration-200 group/link"
                                    >
                                        View Details
                                        <ChevronRight size={14} className="group-hover/link:translate-x-0.5 transition-transform duration-200" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrdersPage;
