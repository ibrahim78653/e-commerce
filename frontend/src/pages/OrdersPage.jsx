/**
 * Orders Page - Order History
 * Display user's order history with status, details, and invoice download
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package, Clock, CheckCircle, Truck, XCircle,
    ChevronRight, Download, FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ordersAPI } from '../services/api';
import Skeleton from '../components/ui/Skeleton';
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
            // Fetch full order (with items) if needed
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

    const getStatusIcon = (status) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'PENDING': return <Clock className="text-yellow-500" size={16} />;
            case 'CONFIRMED': return <CheckCircle className="text-red-500" size={16} />;
            case 'SHIPPED': return <Truck className="text-red-500" size={16} />;
            case 'DELIVERED': return <CheckCircle className="text-green-500" size={16} />;
            case 'CANCELLED': return <XCircle className="text-red-500" size={16} />;
            default: return <Package className="text-gray-500" size={16} />;
        }
    };

    const getStatusColor = (status) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'CONFIRMED': return 'bg-red-100 text-red-800';
            case 'SHIPPED': return 'bg-red-100 text-red-800';
            case 'DELIVERED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="container py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} variant="card" className="h-48" />
                    ))}
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="container min-h-screen py-16">
                <div className="max-w-md mx-auto text-center">
                    <Package size={80} className="mx-auto text-gray-300 mb-6" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">No orders yet</h2>
                    <p className="text-gray-600 mb-8">Start shopping to see your orders here</p>
                    <Link to="/">
                        <button className="btn btn-primary">Start Shopping</button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container min-h-screen py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
                    {orders.length} order{orders.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="space-y-5">
                {orders.map((order, orderIdx) => (
                    <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: orderIdx * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                        {/* Card Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white flex flex-wrap items-center justify-between gap-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                                    <FileText size={18} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">Order #{order.id}</h3>
                                    <p className="text-xs text-gray-500">Placed on {formatDate(order.created_at)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    <span className="uppercase">{order.status}</span>
                                </span>
                                <span className="text-xl font-bold text-gray-900">
                                    ₹{(order.total_amount || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="px-6 py-4 space-y-3 border-b border-gray-50">
                            {order.items?.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-red-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                                        <Package size={16} className="text-red-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm truncate">{item.product_name}</p>
                                        <p className="text-xs text-gray-500">
                                            Qty: {item.quantity}
                                            {item.selected_size && ` • Size: ${item.selected_size}`}
                                            {item.selected_color && ` • ${item.selected_color}`}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-gray-900 text-sm flex-shrink-0">
                                        ₹{(item.price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                            {order.items?.length > 3 && (
                                <p className="text-xs text-gray-500 pl-15 font-medium">
                                    + {order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>

                        {/* Card Footer */}
                        <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-sm text-gray-600">
                                Payment: <span className="font-medium text-gray-900">
                                    {order.payment_method === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}
                                </span>
                                <span className="mx-2 text-gray-300">|</span>
                                <span className="text-gray-500">{order.items?.length || 0} item(s)</span>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Invoice Download */}
                                {!(order.payment_method === 'whatsapp' && order.status?.toLowerCase() === 'pending') && (
                                    <button
                                        id={`invoice-btn-${order.id}`}
                                        onClick={(e) => handleDownloadInvoice(e, order)}
                                        disabled={downloadingId === order.id}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:border-red-400 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {downloadingId === order.id ? (
                                            <span className="animate-spin inline-block w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full" />
                                        ) : (
                                            <Download size={13} />
                                        )}
                                        Invoice
                                    </button>
                                )}

                                {/* View Details */}
                                <Link
                                    to={`/orders/${order.id}`}
                                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-semibold"
                                >
                                    View Details
                                    <ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default OrdersPage;
