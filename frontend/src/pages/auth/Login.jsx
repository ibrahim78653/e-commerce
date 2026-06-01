/**
 * Login Page - Luxury Redesign
 * Burhani Collection — Premium Boutique
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Phone, ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isLoading } = useAuthStore();
    const [loginType, setLoginType] = useState('email');

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        const success = await login({
            identifier: data.identifier,
            password: data.password,
        });

        if (success) {
            const user = useAuthStore.getState().user;
            if (user?.role === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                const from = location.state?.from?.pathname || '/';
                navigate(from, { replace: true });
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex">
            {/* ── Left Panel (decorative, desktop only) ─────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#1a0a00] flex-col items-center justify-center overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(45deg, #D4AF37 0, #D4AF37 1px, transparent 0, transparent 50%)`,
                        backgroundSize: '20px 20px',
                    }}
                />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl" />

                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 text-center px-12"
                >
                    {/* Logo */}
                    <div className="mb-8">
                        <img
                            src="/logo-best.jpeg"
                            alt="Burhani Collection"
                            className="w-24 h-24 object-cover rounded-full mx-auto border-2 border-[#D4AF37]/40 shadow-2xl shadow-[#D4AF37]/20"
                        />
                    </div>
                    <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.4em] mb-4">Premium Boutique</p>
                    <h2
                        className="text-4xl font-black text-[#FDFBF7] leading-tight mb-4"
                        style={{ fontFamily: '"Times New Roman", Times, serif' }}
                    >
                        Burhani<br />Collection
                    </h2>
                    <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-5" />
                    <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                        Welcome back to your premium fashion destination. Curated elegance, delivered to your door.
                    </p>

                    {/* Decorative gold dots */}
                    <div className="flex justify-center gap-2 mt-8">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/40" />
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ── Right Panel (Form) ─────────────────────────────────────────── */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile Logo (only on mobile) */}
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
                            Welcome Back
                        </h1>
                        <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl border border-[#D4AF37]/15 shadow-sm p-7">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Login Type Toggle */}
                            <div className="flex gap-1.5 p-1 bg-[#FDFBF7] border border-[#D4AF37]/20 rounded-xl">
                                {[
                                    { type: 'email', icon: Mail, label: 'Email' },
                                    { type: 'phone', icon: Phone, label: 'Phone' },
                                ].map(({ type, icon: Icon, label }) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setLoginType(type)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 ${
                                            loginType === type
                                                ? 'bg-[#1a0a00] text-[#D4AF37] shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <Icon size={13} />
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Identifier Input */}
                            <Input
                                label={loginType === 'email' ? 'Email Address' : 'Phone Number'}
                                type={loginType === 'email' ? 'email' : 'tel'}
                                icon={loginType === 'email' ? Mail : Phone}
                                placeholder={loginType === 'email' ? 'you@example.com' : '9876543210'}
                                error={errors.identifier?.message}
                                {...register('identifier', {
                                    required: `${loginType === 'email' ? 'Email' : 'Phone'} is required`,
                                })}
                            />

                            {/* Password Input */}
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
                                    })}
                                />
                                <div className="text-right mt-1.5">
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs font-bold text-[#A94A4A] hover:text-[#8a3535] transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

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
                                {isLoading ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>

                        {/* Register Link */}
                        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                            <p className="text-gray-500 text-sm">
                                Don't have an account?{' '}
                                <Link to="/register" className="font-bold text-[#A94A4A] hover:text-[#8a3535] transition-colors">
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </div>

                    {/* Guest Link */}
                    <div className="mt-5 text-center">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 font-medium transition-colors group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                            Continue as Guest
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
