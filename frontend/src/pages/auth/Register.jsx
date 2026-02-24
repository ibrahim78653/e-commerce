/**
 * Register Page
 * User registration with email/phone + password
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import useAuthStore from '../../store/authStore';
import Button from '../../components/ui/Button';
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

    // Password strength indicator
    const getPasswordStrength = (pwd) => {
        if (!pwd) return { strength: 0, text: '', color: '' };
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (/[a-z]/.test(pwd)) strength++;
        if (/[A-Z]/.test(pwd)) strength++;
        if (/\d/.test(pwd)) strength++;

        const levels = [
            { strength: 0, text: 'Weak', color: 'bg-red-500' },
            { strength: 1, text: 'Fair', color: 'bg-orange-500' },
            { strength: 2, text: 'Good', color: 'bg-yellow-500' },
            { strength: 3, text: 'Strong', color: 'bg-green-500' },
            { strength: 4, text: 'Very Strong', color: 'bg-green-600' },
        ];

        return levels[strength];
    };

    const passwordStrength = getPasswordStrength(password);

    return (
        <div className="min-h-screen bg-gradient-premium flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-200/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-accent-200/20 rounded-full blur-3xl animate-float shadow-indigo-500/20" style={{ animationDelay: '1.5s' }} />

            <div className="w-full max-w-lg relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30 rotate-3">
                        <UserPlus className="text-white" size={32} />
                    </div>
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
                        Create Account
                    </h1>
                    <p className="text-gray-600">
                        Join <span className="text-primary-600 font-bold">Burhani Collection</span> and start shopping
                    </p>
                </div>

                {/* Register Form */}
                <div className="glass rounded-3xl shadow-2xl p-10 border border-white/50">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Register Type Toggle */}
                        <div className="flex gap-2 p-1.5 bg-gray-100/50 backdrop-blur rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setRegisterType('email')}
                                className={`flex-1 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${registerType === 'email'
                                    ? 'bg-white text-primary-600 shadow-md'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Mail size={18} />
                                Email
                            </button>
                            <button
                                type="button"
                                onClick={() => setRegisterType('phone')}
                                className={`flex-1 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${registerType === 'phone'
                                    ? 'bg-white text-primary-600 shadow-md'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Phone size={18} />
                                Phone
                            </button>
                        </div>

                        {/* Full Name */}
                        <Input
                            label="Full Name"
                            type="text"
                            icon={User}
                            placeholder="John Doe"
                            className="rounded-xl shadow-sm border-gray-100"
                            error={errors.full_name?.message}
                            {...register('full_name', {
                                required: 'Full name is required',
                                minLength: {
                                    value: 2,
                                    message: 'Name must be at least 2 characters',
                                },
                            })}
                        />

                        {/* Email/Phone Input */}
                        <Input
                            label={registerType === 'email' ? 'Email Address' : 'Phone Number'}
                            type={registerType === 'email' ? 'email' : 'tel'}
                            icon={registerType === 'email' ? Mail : Phone}
                            placeholder={registerType === 'email' ? 'you@example.com' : '9876543210'}
                            className="rounded-xl shadow-sm border-gray-100"
                            error={errors.identifier?.message}
                            {...register('identifier', {
                                required: `${registerType === 'email' ? 'Email' : 'Phone'} is required`,
                                pattern: registerType === 'phone' ? {
                                    value: /^[0-9]{10,15}$/,
                                    message: 'Invalid phone number',
                                } : undefined,
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
                                    pattern: {
                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                        message: 'Must contain Uppercase, Lowercase & Number',
                                    },
                                })}
                            />

                            {/* Password Strength Indicator */}
                            {password && (
                                <div className="px-1 py-1">
                                    <div className="flex gap-1.5 mb-1.5">
                                        {[1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${level <= passwordStrength.strength
                                                    ? passwordStrength.color
                                                    : 'bg-gray-200'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
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
                            className="rounded-xl shadow-sm border-gray-100"
                            error={errors.confirm_password?.message}
                            {...register('confirm_password', {
                                required: 'Please confirm your password',
                                validate: (value) =>
                                    value === password || 'Passwords do not match',
                            })}
                        />

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full py-4 text-lg rounded-2xl shadow-xl shadow-primary-500/20 active:translate-y-0.5 transition-all"
                            isLoading={isLoading}
                        >
                            Create Account
                        </Button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-10 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-primary-600 hover:text-primary-700 font-bold hover:underline"
                            >
                                Sign In
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
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
