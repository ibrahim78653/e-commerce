/**
 * User Profile Page
 * Display and edit user profile information
 */
import { useState } from 'react';
import { User, Mail, Phone, Lock, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';

const ProfilePage = () => {
    const { user, updateUser } = useAuthStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword } = useForm();

    const handleChangePassword = async (data) => {
        try {
            setIsLoading(true);
            await authAPI.changePassword(data);
            toast.success('Password changed successfully');
            setIsChangePasswordOpen(false);
            resetPassword();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container min-h-screen py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Info */}
                <div className="lg:col-span-2">
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                            <User className="mr-2" size={24} />
                            Personal Information
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name
                                </label>
                                <p className="text-lg text-gray-900">{user?.full_name || 'Not provided'}</p>
                            </div>

                            {user?.email && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <Mail className="mr-1" size={16} />
                                        Email
                                    </label>
                                    <p className="text-lg text-gray-900">{user.email}</p>
                                    {user.email_verified ? (
                                        <span className="text-sm text-green-600">✓ Verified</span>
                                    ) : (
                                        <span className="text-sm text-gray-500">Not verified</span>
                                    )}
                                </div>
                            )}

                            {user?.phone && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <Phone className="mr-1" size={16} />
                                        Phone
                                    </label>
                                    <p className="text-lg text-gray-900">{user.phone}</p>
                                    {user.phone_verified ? (
                                        <span className="text-sm text-green-600">✓ Verified</span>
                                    ) : (
                                        <span className="text-sm text-gray-500">Not verified</span>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Account Type
                                </label>
                                <p className="text-lg text-gray-900 capitalize">{user?.role || 'Customer'}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Member Since
                                </label>
                                <p className="text-lg text-gray-900">
                                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    }) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="card mt-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                            <Lock className="mr-2" size={24} />
                            Security
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <div className="flex items-center justify-between">
                                    <p className="text-lg text-gray-900">••••••••</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsChangePasswordOpen(true)}
                                    >
                                        Change Password
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-6">
                    <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                        <h3 className="font-semibold mb-2">Account Status</h3>
                        <p className="text-3xl font-bold mb-1">
                            {user?.is_active ? 'Active' : 'Inactive'}
                        </p>
                        <p className="text-sm text-white/80">
                            {user?.is_active ? 'Your account is in good standing' : 'Account is deactivated'}
                        </p>
                    </div>

                    <div className="card">
                        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <p className="font-medium text-gray-900">Order History</p>
                                <p className="text-sm text-gray-600">View all your orders</p>
                            </button>
                            <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <p className="font-medium text-gray-900">Addresses</p>
                                <p className="text-sm text-gray-600">Manage shipping addresses</p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            <Modal
                isOpen={isChangePasswordOpen}
                onClose={() => {
                    setIsChangePasswordOpen(false);
                    resetPassword();
                }}
                title="Change Password"
            >
                <form onSubmit={handlePasswordSubmit(handleChangePassword)} className="space-y-4">
                    <Input
                        label="Current Password"
                        type="password"
                        icon={Lock}
                        error={passwordErrors.old_password?.message}
                        {...registerPassword('old_password', {
                            required: 'Current password is required',
                        })}
                    />

                    <Input
                        label="New Password"
                        type="password"
                        icon={Lock}
                        error={passwordErrors.new_password?.message}
                        {...registerPassword('new_password', {
                            required: 'New password is required',
                            minLength: {
                                value: 8,
                                message: 'Password must be at least 8 characters',
                            },
                            pattern: {
                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                message: 'Password must contain uppercase, lowercase, and number',
                            },
                        })}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        isLoading={isLoading}
                        icon={Save}
                    >
                        Change Password
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default ProfilePage;
