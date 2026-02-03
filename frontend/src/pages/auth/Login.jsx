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
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-gray-600">
                        Sign in to continue shopping
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Login Type Toggle */}
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setLoginType('email')}
                                className={`flex-1 py-2 rounded-md font-medium transition-all ${loginType === 'email'
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-gray-600'
                                    }`}
                            >
                                <Mail className="inline mr-2" size={18} />
                                Email
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginType('phone')}
                                className={`flex-1 py-2 rounded-md font-medium transition-all ${loginType === 'phone'
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-gray-600'
                                    }`}
                            >
                                <Phone className="inline mr-2" size={18} />
                                Phone
                            </button>
                        </div>

                        {/* Email/Phone Input */}
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
                        <Input
                            label="Password"
                            type="password"
                            icon={Lock}
                            placeholder="••••••••"
                            error={errors.password?.message}
                            {...register('password', {
                                required: 'Password is required',
                                minLength: {
                                    value: 8,
                                    message: 'Password must be at least 8 characters',
                                },
                            })}
                        />

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            isLoading={isLoading}
                            icon={LogIn}
                        >
                            Sign In
                        </Button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="text-primary-600 hover:text-primary-700 font-semibold"
                            >
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Continue as Guest */}
                <div className="mt-6 text-center">
                    <Link
                        to="/"
                        className="text-gray-600 hover:text-gray-900 font-medium"
                    >
                        ← Continue as Guest
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
