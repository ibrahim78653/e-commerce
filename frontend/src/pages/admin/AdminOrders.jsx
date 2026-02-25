import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import { Package, Download, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { generateInvoice } from '../../utils/generateInvoice';

const STATUS_BADGE = {
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [downloadingId, setDownloadingId] = useState(null);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await ordersAPI.getAllAdmin();
            setOrders(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleStatusUpdate = async (e, id, newStatus) => {
        e.stopPropagation();
        try {
            await ordersAPI.updateStatus(id, { status: newStatus });
            setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
            toast.success("Order status updated");
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

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

    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.status === filterStatus);

    if (loading) return (
        <div className="p-8 text-center">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading orders…</p>
        </div>
    );

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Order Management</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{filteredOrders.length} order(s)</p>
                </div>
                <select
                    className="input max-w-xs text-sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

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
                                        <div className="text-xs text-gray-400 truncate max-w-[150px]">{order.customer_email}</div>
                                    )}
                                </td>
                                <td className="px-5 py-4 text-gray-600">
                                    {new Date(order.created_at).toLocaleDateString('en-IN')}
                                </td>
                                <td className="px-5 py-4 font-bold text-gray-900">₹{Number(order.total_amount).toFixed(2)}</td>
                                <td className="px-5 py-4">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${STATUS_BADGE[(order.status || 'pending').toLowerCase()] || STATUS_BADGE.pending}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                    <select
                                        className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                                        value={order.status}
                                        onChange={(e) => handleStatusUpdate(e, order.id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                                <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        id={`admin-invoice-btn-${order.id}`}
                                        onClick={(e) => handleDownloadInvoice(e, order)}
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
        </div>
    );
};

export default AdminOrders;
