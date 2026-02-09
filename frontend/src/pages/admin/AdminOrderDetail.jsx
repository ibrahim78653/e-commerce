import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import { ArrowLeft, Package, MapPin, User, Clock, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';

const AdminOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await ordersAPI.getById(id);
                setOrder(res.data);
            } catch (error) {
                console.error(error);
                toast.error("Failed to fetch order details");
                navigate('/admin'); // or back to orders list
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

    if (loading) return <div className="p-8 text-center">Loading order details...</div>;
    if (!order) return <div className="p-8 text-center">Order not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Orders
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            Order #{order.id}
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                {order.status.toUpperCase()}
                            </span>
                        </h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            <Clock size={16} />
                            Placed on {new Date(order.created_at).toLocaleString()}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <select
                            className="input bg-white border-gray-300 shadow-sm"
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Customer Details */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary-700">
                            <User size={20} /> Customer
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Name</label>
                                <p className="font-medium text-gray-900">{order.customer_name}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Email</label>
                                <p className="text-gray-600 break-all">{order.customer_email || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Phone</label>
                                <p className="text-gray-600">{order.customer_phone}</p>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary-700">
                            <MapPin size={20} /> Shipping Address
                        </h2>
                        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                            {order.address}
                        </p>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-primary-700">
                            <CreditCard size={20} /> Payment
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Method</label>
                                <p className="font-medium capitalize">{order.payment_method}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold">Total Amount</label>
                                <p className="text-2xl font-bold text-gray-900">₹{order.total_amount}</p>
                            </div>
                            {order.razorpay_payment_id && (
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Transaction ID</label>
                                    <p className="font-mono text-sm text-gray-600">{order.razorpay_payment_id}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-primary-700">
                            <Package size={20} /> Order Items
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Product</th>
                                    <th className="px-6 py-4 font-semibold text-center">Size</th>
                                    <th className="px-6 py-4 font-semibold text-center">Color</th>
                                    <th className="px-6 py-4 font-semibold text-right">Price</th>
                                    <th className="px-6 py-4 font-semibold text-center">Qty</th>
                                    <th className="px-6 py-4 font-semibold text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {order.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {item.product_name}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600">
                                            {item.selected_size || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.selected_color ? (
                                                <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                                                    {item.selected_color}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600">
                                            ₹{item.price}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t border-gray-200">
                                <tr>
                                    <td colSpan="5" className="px-6 py-3 text-right font-medium text-gray-500">Subtotal</td>
                                    <td className="px-6 py-3 text-right font-medium text-gray-900">
                                        ₹{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="5" className="px-6 py-3 text-right font-medium text-gray-500">Shipping</td>
                                    <td className="px-6 py-3 text-right font-medium text-gray-900">
                                        ₹{(order.total_amount - order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)).toFixed(2)}
                                    </td>
                                </tr>
                                <tr className="bg-gray-100">
                                    <td colSpan="5" className="px-6 py-4 text-right font-bold text-gray-900 text-lg">Total Amount</td>
                                    <td className="px-6 py-4 text-right font-bold text-primary-600 text-lg">
                                        ₹{order.total_amount.toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetail;
