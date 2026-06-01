/**
 * Register Page - Luxury Redesign
 * Burhani Collection — Premium Boutique
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import useAuthStore from '../../store/authStore';
import Input from '../../components/ui/Input';

const Register = () => {
    const navigate = useNavigate();
    const { register: registerUser, isLoading } = useAuthStore();
    const [registerType, setRegisterType] = useState('email');

    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const password = watch('password');

    const onSubmit = async (data) => {
        const userData = {
            full_name: data.full_name,
            password: data.password,
        };

        if (registerType === 'email') {
            userData.email = data.identifier;
        } else {
            userData.phone = data.identifier;
        }

        const success = await registerUser(userData);
        if (success) {
            navigate('/', { replace: true });
        }
    };

    // Password strength logic
    const getPasswordStrength = (pwd) => {
        if (!pwd) return { strength: 0, text: '', colorClass: '' };
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (/[a-z]/.test(pwd)) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/\d/.test(pwd)) strength++;

        const levels = [
            { strength: 0, text: 'Weak',       colorClass: 'bg-red-500 text-red-600' },
            { strength: 1, text: 'Fair',       colorClass: 'bg-orange-500 text-orange-600' },
            { strength: 2, text: 'Good',       colorClass: 'bg-yellow-500 text-yellow-600' },
            { strength: 3, text: 'Strong',     colorClass: 'bg-green-500 text-green-600' },
            { strength: 4, text: 'Very Strong',colorClass: 'bg-green-600 text-green-700' },
        ];
        return levels[strength];
    };

    const passwordStrength = getPasswordStrength(password);

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex">
            {/* ── Left Decorative Panel (desktop only) ─────────────────────── */}
            <div className="hidden lg:flex lg:w-5/12 relative bg-[#1a0a00] flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(45deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 50%)`,
                        backgroundSize: '20px 20px',
                    }}
                />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl" />

                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 text-center px-10"
                >
                    <div className="mb-8">
                        <img
                            src="/logo-best.jpeg"
                            alt="Burhani Collection"
                            className="w-24 h-24 object-cover rounded-full mx-auto border-2 border-[#D4AF37]/40 shadow-2xl shadow-[#D4AF37]/20"
                        />
                    </div>
                    <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.4em] mb-4">Join Us Today</p>
                    <h2
                        className="text-3xl font-black text-[#FDFBF7] leading-tight mb-4"
                        style={{ fontFamily: '"Times New Roman", Times, serif' }}
                    >
                        Become Part of<br />
                        <span className="text-[#D4AF37]">Our Family</span>
                    </h2>
                    <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-5" />
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Create your account and unlock exclusive access to our premium boutique collection.
                    </p>
                </motion.div>
            </div>

            {/* ── Right: Form ───────────────────────────────────────────────── */}
            <div className="w-full lg:w-7/12 flex items-center justify-center px-6 py-10 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="flex flex-col items-center mb-8 lg:hidden">
                        <img
                            src="/logo-best.jpeg"
                            alt="Burhani Collection"
                            className="w-20 h-20 object-cover rounded-full border-2 border-[#D4AF37]/30 mb-4"
                        />
                        <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em]">Burhani Collection</p>
                    </div>

                    {/* Heading */}
                    <div className="mb-8">
                        <h1
                            className="text-3xl font-black text-[#1a0a00] mb-1"
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}
                        >
                            Create Account
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Join <span className="font-bold text-[#A94A4A]">Burhani Collection</span> and start shopping
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl border border-[#D4AF37]/15 shadow-sm p-7">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Toggle */}
                            <div className="flex gap-1.5 p-1 bg-[#FDFBF7] border border-[#D4AF37]/20 rounded-xl">
                                {[
                                    { type: 'email', icon: Mail,  label: 'Email' },
                                    { type: 'phone', icon: Phone, label: 'Phone' },
                                ].map(({ type, icon: Icon, label }) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setRegisterType(type)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 ${
                                            registerType === type
                                                ? 'bg-[#1a0a00] text-[#D4AF37] shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <Icon size={13} />
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Full Name */}
                            <Input
                                label="Full Name"
                                type="text"
                                icon={User}
                                placeholder="Your full name"
                                error={errors.full_name?.message}
                                {...register('full_name', {
                                    required: 'Full name is required',
                                    minLength: { value: 2, message: 'At least 2 characters required' },
                                })}
                            />

                            {/* Email / Phone */}
                            <Input
                                label={registerType === 'email' ? 'Email Address' : 'Phone Number'}
                                type={registerType === 'email' ? 'email' : 'tel'}
                                icon={registerType === 'email' ? Mail : Phone}
                                placeholder={registerType === 'email' ? 'you@example.com' : '9876543210'}
                                error={errors.identifier?.message}
                                {...register('identifier', {
                                    required: `${registerType === 'email' ? 'Email' : 'Phone'} is required`,
                                    pattern: registerType === 'phone' ? {
                                        value: /^[0-9]{10,15}$/,
                                        message: 'Invalid phone number',
                                    } : undefined,
                                })}
                            />

                            {/* Password */}
                            <div>
                                <Input
                                    label="Password"
                                    type="password"
                                    icon={Lock}
                                    placeholder="••••••••"
                                    error={errors.password?.message}
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 8, message: 'Minimum 8 characters' },
                                        pattern: {
                                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                            message: 'Must include uppercase, lowercase & number',
                                        },
                                    })}
                                />

                                {/* Strength meter */}
                                {password && (
                                    <div className="mt-2 px-1">
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3, 4].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                                                        level <= passwordStrength.strength
                                                            ? passwordStrength.colorClass.split(' ')[0]
                                                            : 'bg-gray-100'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <p className={`text-[10px] font-bold ${passwordStrength.colorClass.split(' ')[1]}`}>
                                            Strength: {passwordStrength.text}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <Input
                                label="Confirm Password"
                                type="password"
                                icon={Lock}
                                placeholder="••••••••"
                                error={errors.confirm_password?.message}
                                {...register('confirm_password', {
                                    required: 'Please confirm your password',
                                    validate: (value) => value === password || 'Passwords do not match',
                                })}
                            />

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1a0a00] text-[#D4AF37] font-black text-sm uppercase tracking-[0.15em] rounded-xl hover:bg-[#2d1200] transition-all duration-300 shadow-lg shadow-[#1a0a00]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Sparkles size={15} />
                                )}
                                {isLoading ? 'Creating Account…' : 'Create Account'}
                            </button>
                        </form>

                        {/* Login Link */}
                        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                            <p className="text-gray-500 text-sm">
                                Already have an account?{' '}
                                <Link to="/login" className="font-bold text-[#A94A4A] hover:text-[#8a3535] transition-colors">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Back to home */}
                    <div className="mt-5 text-center">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 font-medium transition-colors group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                            Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;
