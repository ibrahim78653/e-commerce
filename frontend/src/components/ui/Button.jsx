/**
 * Reusable Button Component
 * Supports multiple variants with loading states
 */
import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    className = '',
    icon: Icon,
    iconPosition = 'left',
    ...props
}) => {
    const baseClasses = 'btn inline-flex items-center justify-center font-medium transition-all duration-200';

    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        outline: 'btn-outline',
        ghost: 'btn-ghost',
        danger: 'bg-red-600 text-white hover:bg-red-700',
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-6 py-2.5',
        lg: 'px-8 py-3 text-lg',
    };

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return (
        <button
            className={classes}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {!isLoading && Icon && iconPosition === 'left' && <Icon size={18} />}
            <span>{children}</span>
            {!isLoading && Icon && iconPosition === 'right' && <Icon size={18} />}
        </button>
    );
};

export default Button;
