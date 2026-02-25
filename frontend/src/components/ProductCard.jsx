/**
 * Product Card Component
 * Displays product with image, info, and add to cart action
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Button from './ui/Button';
import VariantCarousel from './ui/VariantCarousel';
import CONFIG from '../config';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [activeVariant, setActiveVariant] = useState(null);

    const price = product.discounted_price || product.original_price;
    const hasDiscount = product.discounted_price && product.discounted_price < product.original_price;

    // Get first image or placeholder
    const imageUrl = product.images?.[0]?.image_url || '/placeholder.jpg';
    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${CONFIG.IMAGE_BASE_URL}${imageUrl}`;

    const carouselVariants = product.color_variants?.filter(v => v.show_in_carousel && v.images?.length > 0) || [];
    const baseImages = product.images?.filter(img => !img.color_variant_id) || [];
    const hasCarousel = carouselVariants.length > 0 || baseImages.length > 1;

    const productUrl = activeVariant
        ? `/product/${product.id}?variant=${activeVariant.id}`
        : `/product/${product.id}`;

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const sizes = product.sizes?.split(',') || [];
        const colors = product.colors?.split(',') || [];

        addToCart(
            product,
            1,
            sizes[0]?.trim() || null,
            colors[0]?.trim() || null
        );
    };

    const handleCardClick = () => {
        navigate(productUrl);
    };

    return (
        <motion.div
            whileHover={{ y: -8 }}
            transition={{ duration: 0.2 }}
            className="group cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="card card-hover overflow-hidden p-0 h-full flex flex-col">
                {/* Image Area */}
                <div className="relative overflow-hidden bg-gray-100 h-64 flex-shrink-0">
                    {hasCarousel ? (
                        <VariantCarousel
                            variants={product.color_variants}
                            images={baseImages}
                            productName={product.name}
                            onVariantChange={setActiveVariant}
                        />
                    ) : (
                        <img
                            src={fullImageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                                e.target.src = CONFIG.PLACEHOLDER_URL;
                            }}
                        />
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {hasDiscount && (
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                -{Math.round(((product.original_price - product.discounted_price) / product.original_price) * 100)}%
                            </span>
                        )}
                        {product.is_featured && (
                            <span className="bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                Featured
                            </span>
                        )}
                    </div>

                    {/* Heart Action */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors"
                        >
                            <Heart size={18} className="text-gray-700" />
                        </button>
                    </div>

                    {/* Out of Stock Overlay */}
                    {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg font-bold text-gray-900 border border-white/50 shadow-xl">
                                OUT OF STOCK
                            </span>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="p-4 flex flex-col flex-1">
                    {/* Category */}
                    {product.category && (
                        <p className="text-xs text-primary-500 font-bold uppercase tracking-wider mb-1">
                            {product.category.name}
                        </p>
                    )}

                    {/* Name */}
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors">
                        {product.name}
                    </h3>

                    <div className="mt-auto">
                        <div className="flex items-center justify-between gap-2 border-t border-gray-50 pt-3">
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-gray-900 leading-none">
                                    ₹{price.toLocaleString()}
                                </span>
                                {hasDiscount && (
                                    <span className="text-xs text-gray-400 line-through mt-0.5">
                                        ₹{product.original_price.toLocaleString()}
                                    </span>
                                )}
                            </div>

                            {/* Add to Cart Button */}
                            {product.stock !== 0 && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="!bg-primary-600 !border-0 hover:!bg-primary-700 !rounded-md !px-4 !py-2 !h-auto shadow-md shadow-primary-500/20 active:scale-95 transition-all"
                                    icon={ShoppingCart}
                                    onClick={handleAddToCart}
                                >
                                    Add
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
