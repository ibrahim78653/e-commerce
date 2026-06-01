/**
 * User Profile Page
 * Display and edit user profile information
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import AddressBook from '../components/AddressBook';
import toast from 'react-hot-toast';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuthStore();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword } = useForm();
    const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, reset: resetProfile } = useForm({
        defaultValues: {
            full_name: user?.full_name || '',
            phone: user?.phone || '',
            email: user?.email || '',
        }
    });

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

    const handleUpdateProfile = async (data) => {
        try {
            setIsUpdatingProfile(true);
            const res = await authAPI.updateProfile(data);
            updateUser(res.data);
            toast.success('Profile updated successfully');
            setIsEditModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to update profile');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    return (
        <div className="container min-h-screen py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Info */}
                <div className="lg:col-span-2">
                    <div className="card">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                                <User className="mr-2" size={24} />
                                Personal Information
                            </h2>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    resetProfile({
                                        full_name: user?.full_name || '',
                                        phone: user?.phone || '',
                                        email: user?.email || '',
                                    });
                                    setIsEditModalOpen(true);
                                }}
                            >
                                Edit Profile
                            </Button>
                        </div>

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
                            <button
                                onClick={() => navigate('/orders')}
                                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <p className="font-medium text-gray-900">Order History</p>
                                <p className="text-sm text-gray-600">View all your orders</p>
                            </button>
                            <button 
                                onClick={() => navigate('/wishlist')}
                                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <p className="font-medium text-gray-900">Wishlist</p>
                                <p className="text-sm text-gray-600">View saved products</p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Address Book Section */}
            <div className="mt-8">
                <AddressBook />
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
            {/* Edit Profile Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Profile"
            >
                <form onSubmit={handleProfileSubmit(handleUpdateProfile)} className="space-y-4">
                    <Input
                        label="Full Name"
                        type="text"
                        icon={User}
                        error={profileErrors.full_name?.message}
                        {...registerProfile('full_name', {
                            required: 'Full name is required',
                            minLength: { value: 3, message: 'Name must be at least 3 characters' }
                        })}
                    />

                    <Input
                        label="Email Address"
                        type="email"
                        icon={Mail}
                        error={profileErrors.email?.message}
                        {...registerProfile('email', {
                            required: 'Email is required',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address'
                            }
                        })}
                    />

                    <Input
                        label="Phone Number"
                        type="tel"
                        icon={Phone}
                        error={profileErrors.phone?.message}
                        {...registerProfile('phone', {
                            required: 'Phone number is required',
                            pattern: {
                                value: /^[0-9]{10}$/,
                                message: 'Invalid phone number (must be 10 digits)'
                            }
                        })}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        isLoading={isUpdatingProfile}
                        icon={Save}
                    >
                        Save Changes
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default ProfilePage;
