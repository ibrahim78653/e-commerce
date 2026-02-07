/**
 * Orders Page - Order History
 * Display user's order history with status and details
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ordersAPI } from '../services/api';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const getStatusIcon = (status) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'PENDING':
                return <Clock className="text-yellow-500" size={20} />;
            case 'CONFIRMED':
                return <CheckCircle className="text-blue-500" size={20} />;
            case 'SHIPPED':
                return <Truck className="text-purple-500" size={20} />;
            case 'DELIVERED':
                return <CheckCircle className="text-green-500" size={20} />;
            case 'CANCELLED':
                return <XCircle className="text-red-500" size={20} />;
            default:
                return <Package className="text-gray-500" size={20} />;
        }
    };

    const getStatusColor = (status) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'CONFIRMED':
                return 'bg-blue-100 text-blue-800';
            case 'SHIPPED':
                return 'bg-purple-100 text-purple-800';
            case 'DELIVERED':
                return 'bg-green-100 text-green-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
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
                    <p className="text-gray-600 mb-8">
                        Start shopping to see your orders here
                    </p>
                    <Link to="/">
                        <button className="btn btn-primary">
                            Start Shopping
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container min-h-screen py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

            <div className="space-y-4">
                {orders.map((order) => (
                    <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        Order #{order.id}
                                    </h3>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                        {getStatusIcon(order.status)}
                                        <span className="ml-1">{order.status}</span>
                                    </span>
                                </div>
                                <p className="text-gray-600">
                                    Placed on {formatDate(order.created_at)}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">
                                    ₹{(order.total_amount || 0).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="border-t border-gray-200 pt-4 space-y-3">
                            {order.items?.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{item.product_name}</p>
                                        <p className="text-sm text-gray-600">
                                            Qty: {item.quantity}
                                            {item.selected_size && ` • Size: ${item.selected_size}`}
                                            {item.selected_color && ` • ${item.selected_color}`}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-gray-900">
                                        ₹{(item.price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}

                            {order.items?.length > 3 && (
                                <p className="text-sm text-gray-600">
                                    + {order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>

                        {/* Shipping Address */}
                        <div className="border-t border-gray-200 mt-4 pt-4">
                            <p className="text-sm font-medium text-gray-700 mb-1">Shipping Address</p>
                            <p className="text-sm text-gray-600">
                                {order.customer_name}<br />
                                {order.address}
                            </p>
                        </div>

                        {/* Payment Info */}
                        <div className="border-t border-gray-200 mt-4 pt-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Payment: <span className="font-medium text-gray-900">
                                        {order.payment_method === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}
                                    </span>
                                </p>
                                {order.payment?.payment_status && (
                                    <p className="text-sm text-gray-600">
                                        Status: <span className="font-medium text-gray-900">
                                            {order.payment.payment_status}
                                        </span>
                                    </p>
                                )}
                            </div>

                            <Link
                                to={`/orders/${order.id}`}
                                className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                            >
                                View Details
                                <ChevronRight size={18} />
                            </Link>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default OrdersPage;
