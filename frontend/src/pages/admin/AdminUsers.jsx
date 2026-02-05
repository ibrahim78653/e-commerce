import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import { User, Ban, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await usersAPI.getAll();
            setUsers(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleBlockUser = async (user) => {
        if (!window.confirm(`Are you sure you want to ${user.is_active ? 'block' : 'unblock'} this user?`)) return;

        try {
            // is_active = !block_status (so if we want to block (true), is_active becomes false)
            // Function expects blockStatus: true to block.
            // If user is active (true), we want to block (true).
            const shouldBlock = user.is_active;

            await usersAPI.toggleBlock(user.id, shouldBlock);

            setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !shouldBlock } : u));
            toast.success(`User ${shouldBlock ? 'blocked' : 'unblocked'} successfully`);
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-6">User Management</h2>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">User</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Role</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                            <User size={20} />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.full_name || 'No Name'}</div>
                                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <div>{user.email}</div>
                                    <div>{user.phone}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {user.is_active ? 'Active' : 'Blocked'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium">
                                    {user.role !== 'admin' && (
                                        <button
                                            onClick={() => toggleBlockUser(user)}
                                            className={`flex items-center gap-1 ml-auto ${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                                }`}
                                        >
                                            {user.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
                                            {user.is_active ? 'Block' : 'Unblock'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
