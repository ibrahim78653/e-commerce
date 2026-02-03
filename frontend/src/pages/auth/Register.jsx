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
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
                        Create Account
                    </h1>
                    <p className="text-gray-600">
                        Join us and start shopping
                    </p>
                </div>

                {/* Register Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Register Type Toggle */}
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setRegisterType('email')}
                                className={`flex-1 py-2 rounded-md font-medium transition-all ${registerType === 'email'
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-gray-600'
                                    }`}
                            >
                                <Mail className="inline mr-2" size={18} />
                                Email
                            </button>
                            <button
                                type="button"
                                onClick={() => setRegisterType('phone')}
                                className={`flex-1 py-2 rounded-md font-medium transition-all ${registerType === 'phone'
                                        ? 'bg-white text-primary-600 shadow-sm'
                                        : 'text-gray-600'
                                    }`}
                            >
                                <Phone className="inline mr-2" size={18} />
                                Phone
                            </button>
                        </div>

                        {/* Full Name */}
                        <Input
                            label="Full Name"
                            type="text"
                            icon={User}
                            placeholder="John Doe"
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
                        <div>
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
                                    pattern: {
                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                        message: 'Password must contain uppercase, lowercase, and number',
                                    },
                                })}
                            />

                            {/* Password Strength Indicator */}
                            {password && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1 flex-1 rounded-full transition-all ${level <= passwordStrength.strength
                                                        ? passwordStrength.color
                                                        : 'bg-gray-200'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs ${passwordStrength.color.replace('bg-', 'text-')}`}>
                                        {passwordStrength.text}
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
                                validate: (value) =>
                                    value === password || 'Passwords do not match',
                            })}
                        />

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            isLoading={isLoading}
                            icon={UserPlus}
                        >
                            Create Account
                        </Button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-primary-600 hover:text-primary-700 font-semibold"
                            >
                                Sign In
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
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
