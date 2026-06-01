/**
 * User Profile Page - Luxury Redesign
 * Burhani Collection — Premium Boutique
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Save, ShieldCheck, Package, Heart, ChevronRight, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
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

    // Helper to get user initials
    const getInitials = (name) => {
        if (!name) return 'BC';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
        : 'N/A';

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* ── Page Header ───────────────────────────────────────────────── */}
            <div className="bg-[#1a0a00] border-b border-[#D4AF37]/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-5"
                    >
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#9E7E47] flex items-center justify-center text-[#1a0a00] text-xl font-black shadow-lg border-2 border-[#D4AF37]/40">
                                {getInitials(user?.full_name)}
                            </div>
                            {user?.is_active && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-[#1a0a00]" />
                            )}
                        </div>
                        <div>
                            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-1">My Account</p>
                            <h1
                                className="text-2xl md:text-3xl font-bold text-[#FDFBF7]"
                                style={{ fontFamily: '"Times New Roman", Times, serif' }}
                            >
                                {user?.full_name || 'Valued Customer'}
                            </h1>
                            <p className="text-gray-400 text-xs mt-0.5">Member since {memberSince}</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Main Content ──────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* ── Left: Profile + Security ──────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Personal Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white rounded-2xl border border-[#D4AF37]/15 shadow-sm overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h2 className="font-bold text-gray-900 flex items-center gap-2 text-base"
                                    style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                    <User size={18} className="text-[#D4AF37]" />
                                    Personal Information
                                </h2>
                                <button
                                    onClick={() => {
                                        resetProfile({
                                            full_name: user?.full_name || '',
                                            phone: user?.phone || '',
                                            email: user?.email || '',
                                        });
                                        setIsEditModalOpen(true);
                                    }}
                                    className="text-xs font-bold uppercase tracking-wider text-[#A94A4A] border border-[#A94A4A]/30 hover:border-[#A94A4A] hover:bg-[#A94A4A]/5 px-3 py-1.5 rounded-lg transition-all duration-200"
                                >
                                    Edit Profile
                                </button>
                            </div>

                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Full Name */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-1.5">Full Name</p>
                                    <p className="text-gray-900 font-semibold text-sm">{user?.full_name || '—'}</p>
                                </div>

                                {/* Email */}
                                {user?.email && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-1.5 flex items-center gap-1">
                                            <Mail size={10} /> Email
                                        </p>
                                        <p className="text-gray-900 font-semibold text-sm">{user.email}</p>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 inline-flex items-center gap-1 ${user.email_verified ? 'text-green-600' : 'text-gray-400'}`}>
                                            {user.email_verified ? '✓ Verified' : 'Not verified'}
                                        </span>
                                    </div>
                                )}

                                {/* Phone */}
                                {user?.phone && (
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-1.5 flex items-center gap-1">
                                            <Phone size={10} /> Phone
                                        </p>
                                        <p className="text-gray-900 font-semibold text-sm">{user.phone}</p>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 inline-flex items-center gap-1 ${user.phone_verified ? 'text-green-600' : 'text-gray-400'}`}>
                                            {user.phone_verified ? '✓ Verified' : 'Not verified'}
                                        </span>
                                    </div>
                                )}

                                {/* Account Type */}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-1.5">Account Type</p>
                                    <p className="text-gray-900 font-semibold text-sm capitalize">{user?.role || 'Customer'}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Security */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-white rounded-2xl border border-[#D4AF37]/15 shadow-sm overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="font-bold text-gray-900 flex items-center gap-2 text-base"
                                    style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                    <ShieldCheck size={18} className="text-[#D4AF37]" />
                                    Security
                                </h2>
                            </div>
                            <div className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-1.5">Password</p>
                                    <p className="text-gray-700 font-semibold text-sm tracking-widest">••••••••••</p>
                                </div>
                                <button
                                    onClick={() => setIsChangePasswordOpen(true)}
                                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#A94A4A] border border-[#A94A4A]/30 hover:border-[#A94A4A] hover:bg-[#A94A4A]/5 px-3 py-1.5 rounded-lg transition-all duration-200"
                                >
                                    <Lock size={12} />
                                    Change
                                </button>
                            </div>
                        </motion.div>

                        {/* Address Book */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <AddressBook />
                        </motion.div>
                    </div>

                    {/* ── Right: Status + Quick Actions ─────────────────────── */}
                    <div className="space-y-5">

                        {/* Account Status Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a0a00] to-[#2d1200] border border-[#D4AF37]/20 shadow-lg"
                        >
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Crown size={18} className="text-[#D4AF37]" />
                                    <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em]">Account Status</p>
                                </div>
                                <p className="text-3xl font-black text-[#FDFBF7] mb-1"
                                    style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                    {user?.is_active ? 'Active' : 'Inactive'}
                                </p>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    {user?.is_active
                                        ? 'Your account is in excellent standing.'
                                        : 'Your account is currently deactivated.'}
                                </p>
                                <div className="mt-5 pt-4 border-t border-[#D4AF37]/15">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Member Since</p>
                                    <p className="text-[#D4AF37] font-bold text-sm mt-0.5">{memberSince}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-white rounded-2xl border border-[#D4AF37]/15 shadow-sm overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Quick Actions</h3>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {[
                                    { icon: Package, label: 'Order History', sub: 'View all your orders', path: '/orders', color: '#A94A4A' },
                                    { icon: Heart, label: 'Wishlist', sub: 'View saved products', path: '/wishlist', color: '#D4AF37' },
                                ].map(({ icon: Icon, label, sub, path, color }) => (
                                    <button
                                        key={label}
                                        onClick={() => navigate(path)}
                                        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#FDFBF7] group transition-colors duration-200"
                                    >
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
                                            style={{ background: `${color}15` }}>
                                            <Icon size={16} style={{ color }} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-bold text-gray-900 text-sm">{label}</p>
                                            <p className="text-gray-400 text-xs">{sub}</p>
                                        </div>
                                        <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── Change Password Modal ─────────────────────────────────────── */}
            <Modal
                isOpen={isChangePasswordOpen}
                onClose={() => { setIsChangePasswordOpen(false); resetPassword(); }}
                title="Change Password"
            >
                <form onSubmit={handlePasswordSubmit(handleChangePassword)} className="space-y-4">
                    <Input
                        label="Current Password"
                        type="password"
                        icon={Lock}
                        error={passwordErrors.old_password?.message}
                        {...registerPassword('old_password', { required: 'Current password is required' })}
                    />
                    <Input
                        label="New Password"
                        type="password"
                        icon={Lock}
                        error={passwordErrors.new_password?.message}
                        {...registerPassword('new_password', {
                            required: 'New password is required',
                            minLength: { value: 8, message: 'Password must be at least 8 characters' },
                            pattern: {
                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                message: 'Must contain uppercase, lowercase, and number',
                            },
                        })}
                    />
                    <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} icon={Save}>
                        Change Password
                    </Button>
                </form>
            </Modal>

            {/* ── Edit Profile Modal ────────────────────────────────────────── */}
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
                            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
                        })}
                    />
                    <Input
                        label="Phone Number"
                        type="tel"
                        icon={Phone}
                        error={profileErrors.phone?.message}
                        {...registerProfile('phone', {
                            required: 'Phone number is required',
                            pattern: { value: /^[0-9]{10}$/, message: 'Must be 10 digits' }
                        })}
                    />
                    <Button type="submit" variant="primary" className="w-full" isLoading={isUpdatingProfile} icon={Save}>
                        Save Changes
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default ProfilePage;
