/**
 * Order Detail Page
 * Display details of a specific order with invoice download
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Package, Clock, CheckCircle, Truck, XCircle,
    ChevronLeft, MapPin, CreditCard, Phone, Mail,
    Download, FileText, User
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ordersAPI } from '../services/api';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import { generateInvoice } from '../utils/generateInvoice';

const OrderDetail = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        loadOrder();
    }, [id]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            const response = await ordersAPI.getById(id);
            setOrder(response.data);
        } catch (error) {
            console.error('Failed to load order details:', error);
            toast.error('Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async () => {
        if (!order) return;
        setDownloading(true);
        try {
            generateInvoice(order);
            toast.success('Invoice downloaded successfully!');
        } catch (err) {
            console.error('Invoice generation failed:', err);
            toast.error('Failed to generate invoice');
        } finally {
            setDownloading(false);
        }
    };

    const getStatusIcon = (status) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'PENDING': return <Clock className="text-yellow-500" size={24} />;
            case 'CONFIRMED': return <CheckCircle className="text-red-500" size={24} />;
            case 'SHIPPED': return <Truck className="text-red-500" size={24} />;
            case 'DELIVERED': return <CheckCircle className="text-green-500" size={24} />;
            case 'CANCELLED': return <XCircle className="text-red-500" size={24} />;
            default: return <Package className="text-gray-500" size={24} />;
        }
    };

    const getStatusColor = (status) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'CONFIRMED': return 'bg-red-100 text-red-800 border border-red-200';
            case 'SHIPPED': return 'bg-red-100 text-red-800 border border-red-200';
            case 'DELIVERED': return 'bg-green-100 text-green-800 border border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border border-red-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];
    const getStepIndex = (status) => STATUS_STEPS.indexOf((status || '').toLowerCase());

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="container py-8">
                <Skeleton className="w-48 h-8 mb-8" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <Skeleton variant="card" className="h-64" />
                        <Skeleton variant="card" className="h-48" />
                    </div>
                    <div className="lg:col-span-1">
                        <Skeleton variant="card" className="h-96" />
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container py-16 text-center">
                <Package size={80} className="mx-auto text-gray-300 mb-6" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Order not found</h2>
                <Link to="/orders" className="text-primary-600 hover:text-primary-700 font-medium">
                    Back to My Orders
                </Link>
            </div>
        );
    }

    const subtotal = (order.items || []).reduce((s, i) => s + (i.price * i.quantity), 0);
    const shipping = order.total_amount - subtotal;
    const currentStep = getStepIndex(order.status);
    const isCancelled = (order.status || '').toLowerCase() === 'cancelled';

    return (
        <div className="container py-8 min-h-screen">

            {/* Back + Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <Link
                    to="/orders"
                    className="inline-flex items-center text-gray-600 hover:text-primary-600 font-medium transition-colors"
                >
                    <ChevronLeft size={20} className="mr-1" />
                    Back to My Orders
                </Link>

                {/* Download Invoice Button */}
                {!(order.payment_method === 'whatsapp' && order.status?.toLowerCase() === 'pending') && (
                    <motion.button
                        id="download-invoice-btn"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleDownloadInvoice}
                        disabled={downloading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                    >
                        {downloading ? (
                            <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Generating…</>
                        ) : (
                            <><Download size={18} /> Download Invoice</>
                        )}
                    </motion.button>
                )}
            </div>

            {/* Order Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center">
                            <FileText className="text-red-600" size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
                            <p className="text-gray-500 text-sm mt-0.5">
                                <Clock size={13} className="inline mr-1" />
                                Placed on {formatDate(order.created_at)}
                            </p>
                        </div>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="uppercase">{order.status}</span>
                    </div>
                </div>

                {/* Progress Tracker */}
                {!isCancelled && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between relative">
                            <div className="absolute left-0 right-0 top-4 h-1 bg-gray-200 z-0 mx-8" />
                            <div
                                className="absolute left-0 top-4 h-1 bg-gradient-to-r from-red-500 to-red-600 z-0 ml-8 transition-all duration-700"
                                style={{ width: `${currentStep > 0 ? (currentStep / (STATUS_STEPS.length - 1)) * (100 - (2 * 100 / (STATUS_STEPS.length + 1))) : 0}%` }}
                            />
                            {STATUS_STEPS.map((step, idx) => (
                                <div key={step} className="flex flex-col items-center z-10 flex-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
                                        ${idx <= currentStep
                                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                                            : 'bg-white border-2 border-gray-300 text-gray-400'}`}>
                                        {idx < currentStep ? '✓' : idx + 1}
                                    </div>
                                    <span className={`text-xs mt-1.5 font-medium capitalize ${idx <= currentStep ? 'text-red-600' : 'text-gray-400'}`}>
                                        {step}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Items + Info Cards */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Order Items */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <Package className="text-red-500" size={20} />
                            <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
                            <span className="ml-auto text-sm text-gray-500">{order.items?.length || 0} item(s)</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {order.items?.map((item, index) => (
                                <div key={index} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex-shrink-0 flex items-center justify-center">
                                        <Package className="text-red-300" size={28} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{item.product_name}</h3>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {item.selected_size && (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                    Size: {item.selected_size}
                                                </span>
                                            )}
                                            {item.selected_color && (
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                    Color: {item.selected_color}
                                                </span>
                                            )}
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                Qty: {item.quantity}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                                        <p className="text-xs text-gray-400">₹{item.price.toFixed(2)} each</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Info Grid: Customer + Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                                    <User size={16} className="text-red-500" />
                                </div>
                                <h3 className="font-bold text-gray-900">Customer Details</h3>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Name</p>
                                    <p className="font-semibold text-gray-900 mt-0.5">{order.customer_name}</p>
                                </div>
                                {order.customer_email && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</p>
                                        <p className="text-gray-700 mt-0.5 flex items-center gap-1">
                                            <Mail size={13} className="text-gray-400" />{order.customer_email}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Phone</p>
                                    <p className="text-gray-700 mt-0.5 flex items-center gap-1">
                                        <Phone size={13} className="text-gray-400" />{order.customer_phone}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Shipping Address */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                    <MapPin size={16} className="text-green-500" />
                                </div>
                                <h3 className="font-bold text-gray-900">Shipping Address</h3>
                            </div>
                            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed text-sm">
                                {order.address}
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* RIGHT: Payment Summary + Invoice */}
                <div className="lg:col-span-1 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24"
                    >
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                                <CreditCard size={16} className="text-red-500" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Payment Summary</h2>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Subtotal ({order.items?.length || 0} items)</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Shipping</span>
                                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                                    {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
                                </span>
                            </div>
                            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-lg">
                                <span>Total</span>
                                <span>₹{order.total_amount.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="mt-5 pt-5 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Payment Method</p>
                            <div className={`flex items-center gap-3 p-3 rounded-xl ${order.payment_method === 'razorpay' ? 'bg-red-50' : 'bg-green-50'}`}>
                                {order.payment_method === 'razorpay' ? (
                                    <>
                                        <CreditCard className="text-red-600" size={22} />
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">Online Payment</p>
                                            <p className="text-xs text-gray-500">Via Razorpay</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Phone className="text-green-600" size={22} />
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">WhatsApp / COD</p>
                                            <p className="text-xs text-gray-500">Cash on Delivery</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            {order.razorpay_payment_id && (
                                <p className="text-xs text-gray-500 mt-2 break-all">
                                    Txn ID: <span className="font-mono">{order.razorpay_payment_id}</span>
                                </p>
                            )}
                        </div>

                        {/* Download Invoice CTA */}
                        {!(order.payment_method === 'whatsapp' && order.status?.toLowerCase() === 'pending') ? (
                            <div className="mt-6 pt-5 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Invoice</p>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleDownloadInvoice}
                                    disabled={downloading}
                                    id="invoice-sidebar-btn"
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                                >
                                    {downloading ? (
                                        <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Generating…</>
                                    ) : (
                                        <><Download size={16} /> Download PDF Invoice</>
                                    )}
                                </motion.button>
                                <p className="text-xs text-gray-400 text-center mt-2">
                                    Invoice #{String(order.id).padStart(5, '0')}
                                </p>
                            </div>
                        ) : (
                            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Invoice</p>
                                <div className="py-3 px-4 bg-gray-50 text-gray-500 rounded-xl font-medium text-sm border border-gray-100 flex items-center justify-center gap-2">
                                    <Clock size={16} /> Pending Confirmation
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
