import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import { Package, ShoppingCart, Users, DollarSign, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A94A4A'];

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 transition-all hover:shadow-md">
        <div className={`p-4 rounded-lg ${bg} ${color}`}>
            <Icon size={28} />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
    </div>
);

const AdminStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await usersAPI.getStats();
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
                toast.error('Failed to load dashboard statistics');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity size={24} className="text-red-600" />
                Dashboard Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Revenue" 
                    value={`₹${stats.total_revenue.toLocaleString()}`} 
                    icon={DollarSign} 
                    color="text-emerald-600" 
                    bg="bg-emerald-100" 
                />
                <StatCard 
                    title="Total Orders" 
                    value={stats.total_orders} 
                    icon={ShoppingCart} 
                    color="text-blue-600" 
                    bg="bg-blue-100" 
                />
                <StatCard 
                    title="Pending Orders" 
                    value={stats.pending_orders} 
                    icon={Activity} 
                    color="text-yellow-600" 
                    bg="bg-yellow-100" 
                />
                <StatCard 
                    title="Total Users" 
                    value={stats.total_users} 
                    icon={Users} 
                    color="text-purple-600" 
                    bg="bg-purple-100" 
                />
                <StatCard 
                    title="Total Products" 
                    value={stats.total_products} 
                    icon={Package} 
                    color="text-red-600" 
                    bg="bg-red-100" 
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Revenue Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue (Last 30 Days)</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.revenue_by_day} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{fontSize: 12}} />
                                <YAxis tick={{fontSize: 12}} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                                <Line type="monotone" dataKey="revenue" stroke="#A94A4A" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Orders by Status */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Orders by Status</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={Object.entries(stats.orders_by_status).map(([name, value]) => ({ name, value }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {Object.entries(stats.orders_by_status).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Top Selling Products</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.top_products} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#A94A4A" radius={[0, 4, 4, 0]}>
                                    {stats.top_products.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminStats;
