/**
 * Skeleton loader for product cards and lists
 */
const Skeleton = ({ className = '', variant = 'default' }) => {
    const variants = {
        default: 'h-4 bg-gray-200 rounded',
        card: 'h-64 bg-gray-200 rounded-xl',
        circle: 'rounded-full bg-gray-200',
        text: 'h-3 bg-gray-200 rounded',
    };

    return (
        <div className={`animate-pulse ${variants[variant]} ${className}`} />
    );
};

export const ProductCardSkeleton = () => (
    <div className="card">
        <Skeleton variant="card" className="mb-4" />
        <Skeleton className="h-6 mb-2 w-3/4" />
        <Skeleton variant="text" className="mb-2 w-full" />
        <Skeleton variant="text" className="mb-4 w-2/3" />
        <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
    </div>
);

export default Skeleton;
