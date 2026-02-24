/**
 * Login Page
 * Email/Phone + password authentication
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isLoading } = useAuthStore();
    const [loginType, setLoginType] = useState('email'); // 'email' or 'phone'

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        const success = await login({
            identifier: data.identifier,
            password: data.password,
        });

        if (success) {
            // Check if user is admin
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
        <div className="min-h-screen bg-gradient-premium flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-200/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-accent-200/20 rounded-full blur-3xl animate-float shadow-indigo-500/20" style={{ animationDelay: '1.5s' }} />

            <div className="w-full max-w-lg relative z-10">
                {/* Logo/Brand */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30 -rotate-3">
                        <LogIn className="text-white" size={32} />
                    </div>
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-gray-600">
                        Sign in to <span className="text-primary-600 font-bold">Burhani Collection</span>
                    </p>
                </div>

                {/* Login Form */}
                <div className="glass rounded-3xl shadow-2xl p-10 border border-white/50">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Login Type Toggle */}
                        <div className="flex gap-2 p-1.5 bg-gray-100/50 backdrop-blur rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setLoginType('email')}
                                className={`flex-1 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${loginType === 'email'
                                    ? 'bg-white text-primary-600 shadow-md'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Mail size={18} />
                                Email
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginType('phone')}
                                className={`flex-1 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${loginType === 'phone'
                                    ? 'bg-white text-primary-600 shadow-md'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Phone size={18} />
                                Phone
                            </button>
                        </div>

                        {/* Email/Phone Input */}
                        <Input
                            label={loginType === 'email' ? 'Email Address' : 'Phone Number'}
                            type={loginType === 'email' ? 'email' : 'tel'}
                            icon={loginType === 'email' ? Mail : Phone}
                            placeholder={loginType === 'email' ? 'you@example.com' : '9876543210'}
                            className="rounded-xl shadow-sm border-gray-100"
                            error={errors.identifier?.message}
                            {...register('identifier', {
                                required: `${loginType === 'email' ? 'Email' : 'Phone'} is required`,
                            })}
                        />

                        {/* Password Input */}
                        <div className="space-y-1">
                            <Input
                                label="Password"
                                type="password"
                                icon={Lock}
                                placeholder="••••••••"
                                className="rounded-xl shadow-sm border-gray-100"
                                error={errors.password?.message}
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters',
                                    },
                                })}
                            />
                            <div className="text-right">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-primary-600 hover:text-primary-700 font-bold hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full py-4 text-lg rounded-2xl shadow-xl shadow-primary-500/20 active:translate-y-0.5 transition-all"
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-10 text-center">
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="text-primary-600 hover:text-primary-700 font-bold hover:underline"
                            >
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Continue as Guest */}
                <div className="mt-8 text-center">
                    <Link
                        to="/"
                        className="text-gray-500 hover:text-gray-900 font-medium flex items-center justify-center gap-2 group transition-all"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        Continue as Guest
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
