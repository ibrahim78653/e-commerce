/**
 * Order Detail Page
 * Display details of a specific order
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronLeft, MapPin, CreditCard, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { ordersAPI } from '../services/api';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

const OrderDetail = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const getStatusIcon = (status) => {
        const s = status?.toUpperCase();
        switch (s) {
            case 'PENDING':
                return <Clock className="text-yellow-500" size={24} />;
            case 'CONFIRMED':
                return <CheckCircle className="text-blue-500" size={24} />;
            case 'SHIPPED':
                return <Truck className="text-purple-500" size={24} />;
            case 'DELIVERED':
                return <CheckCircle className="text-green-500" size={24} />;
            case 'CANCELLED':
                return <XCircle className="text-red-500" size={24} />;
            default:
                return <Package className="text-gray-500" size={24} />;
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
        return new Date(dateString).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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

    return (
        <div className="container py-8 min-h-screen">
            <Link
                to="/orders"
                className="inline-flex items-center text-gray-600 hover:text-primary-600 font-medium mb-8 transition-colors"
            >
                <ChevronLeft size={20} className="mr-1" />
                Back to My Orders
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Order #{order.id}</h1>
                    <p className="text-gray-600">Placed on {formatDate(order.created_at)}</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="uppercase">{order.status}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <Package className="mr-2" size={24} />
                            Order Items
                        </h2>
                        <div className="divide-y divide-gray-200">
                            {order.items?.map((item, index) => (
                                <div key={index} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                                        <Package className="text-gray-400" size={32} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 text-lg">{item.product_name}</h3>
                                        <p className="text-gray-600">
                                            {item.selected_size && `Size: ${item.selected_size}`}
                                            {item.selected_size && item.selected_color && ' | '}
                                            {item.selected_color && `Color: ${item.selected_color}`}
                                        </p>
                                        <p className="text-gray-600">Quantity: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                                        <p className="text-sm text-gray-500">₹{item.price.toFixed(2)} each</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <MapPin className="mr-2" size={24} />
                            Shipping Details
                        </h2>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="font-bold text-gray-900 mb-1">{order.customer_name}</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{order.address}</p>
                            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 uppercase font-semibold">Phone</p>
                                    <p className="text-gray-900">{order.customer_phone}</p>
                                </div>
                                {order.customer_email && (
                                    <div>
                                        <p className="text-sm text-gray-500 uppercase font-semibold">Email</p>
                                        <p className="text-gray-900">{order.customer_email}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="card sticky top-24">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <CreditCard className="mr-2" size={24} />
                            Payment Summary
                        </h2>

                        <div className="space-y-4">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{order.total_amount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping</span>
                                <span className="text-green-600 font-medium">FREE</span>
                            </div>
                            <hr className="border-gray-200" />
                            <div className="flex justify-between text-2xl font-bold text-gray-900">
                                <span>Total</span>
                                <span>₹{order.total_amount.toFixed(2)}</span>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <p className="text-sm text-gray-500 uppercase font-bold mb-3">Payment Information</p>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    {order.payment_method === 'razorpay' ? (
                                        <>
                                            <CreditCard className="text-primary-600" size={24} />
                                            <div>
                                                <p className="font-semibold text-gray-900">Paid Online</p>
                                                <p className="text-xs text-gray-500 uppercase">Via Razorpay</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Phone className="text-green-600" size={24} />
                                            <div>
                                                <p className="font-semibold text-gray-900">WhatsApp Order</p>
                                                <p className="text-xs text-gray-500 uppercase">Cash on Delivery</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
