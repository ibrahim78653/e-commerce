/**
 * Product Card Component
 * Displays product with image, info, and add to cart action
 */
import { motion } from 'framer-motion';
import { ShoppingCart, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Button from './ui/Button';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();

    const price = product.discounted_price || product.original_price;
    const hasDiscount = product.discounted_price && product.discounted_price < product.original_price;

    // Get first image or placeholder
    const imageUrl = product.images?.[0]?.image_url || '/placeholder.jpg';
    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:8000${imageUrl}`;

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Get default size and color if available
        const sizes = product.sizes?.split(',') || [];
        const colors = product.colors?.split(',') || [];

        addToCart(
            product,
            1,
            sizes[0]?.trim() || null,
            colors[0]?.trim() || null
        );
    };

    return (
        <motion.div
            whileHover={{ y: -8 }}
            transition={{ duration: 0.2 }}
            className="group"
        >
            <Link to={`/product/${product.id}`} className="card card-hover block overflow-hidden p-0">
                {/* Image */}
                <div className="relative overflow-hidden bg-gray-100">
                    <img
                        src={fullImageUrl}
                        alt={product.name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300?text=Product+Image';
                        }}
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {hasDiscount && (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                {Math.round(((product.original_price - product.discounted_price) / product.original_price) * 100)}% OFF
                            </span>
                        )}
                        {product.is_featured && (
                            <span className="bg-accent-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                Featured
                            </span>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors">
                            <Heart size={20} className="text-gray-700" />
                        </button>
                    </div>

                    {/* Stock Status */}
                    {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-white px-4 py-2 rounded-lg font-semibold text-gray-900">
                                Out of Stock
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Category */}
                    {product.category && (
                        <p className="text-sm text-gray-500 mb-1">{product.category.name}</p>
                    )}

                    {/* Product Name */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {product.name}
                    </h3>

                    {/* Description */}
                    {product.short_description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {product.short_description}
                        </p>
                    )}

                    {/* Price & Action */}
                    <div className="flex items-center justify-between mt-4">
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-gray-900">
                                    ₹{price.toFixed(2)}
                                </span>
                                {hasDiscount && (
                                    <span className="text-sm text-gray-400 line-through">
                                        ₹{product.original_price.toFixed(2)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {product.stock > 0 && (
                            <Button
                                variant="primary"
                                size="sm"
                                icon={ShoppingCart}
                                onClick={handleAddToCart}
                            >
                                Add
                            </Button>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default ProductCard;
