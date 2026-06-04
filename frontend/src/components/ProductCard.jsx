/**
 * Product Card Component
 * Displays product with image, info, and add to cart action
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import useWishlistStore from '../store/wishlistStore';
import Button from './ui/Button';
import VariantCarousel from './ui/VariantCarousel';
import CONFIG from '../config';

const ProductCard = ({ product }) => {
    const { addToCart } = useCart();
    const { toggleItem, isInWishlist } = useWishlistStore();
    const navigate = useNavigate();
    const [activeVariant, setActiveVariant] = useState(null);

    const isWishlisted = isInWishlist(product.id);

    const price = product.discounted_price || product.original_price;
    const hasDiscount = product.discounted_price && product.discounted_price < product.original_price;

    // Get first image or placeholder
    const imageUrl = product.images?.[0]?.image_url || CONFIG.PLACEHOLDER_URL;
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
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="group cursor-pointer h-full"
            onClick={handleCardClick}
        >
            <div className="relative bg-[#FDFBF7] rounded-2xl overflow-hidden border border-[#D4AF37]/15 hover:border-[#D4AF37]/50 shadow-sm hover:shadow-xl hover:shadow-[#1a0a00]/5 transition-all duration-500 h-full flex flex-col">
                
                {/* Gold Shimmer Sweep Overlay on Hover */}
                <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-10">
                    <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-[#D4AF37]/10 to-transparent rotate-45 -translate-x-[110%] group-hover:translate-x-[110%] transition-transform duration-1000 ease-out" />
                </div>

                {/* Image Area */}
                <div className="relative overflow-hidden bg-[#1a0a00]/5 h-[230px] flex-shrink-0">
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
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {
                                e.target.src = CONFIG.PLACEHOLDER_URL;
                            }}
                        />
                    )}

                    {/* Luxury Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
                        {hasDiscount && (
                            <span className="bg-[#A94A4A] text-[#FDFBF7] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                                -{Math.round(((product.original_price - product.discounted_price) / product.original_price) * 100)}%
                            </span>
                        )}
                        {product.is_featured && (
                            <span className="bg-[#D4AF37] text-[#1a0a00] px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                                Featured
                            </span>
                        )}
                    </div>

                    {/* Heart/Wishlist Button */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <button
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                toggleItem(product);
                            }}
                            className="bg-[#FDFBF7]/70 backdrop-blur-md p-2 rounded-full border border-white/20 hover:bg-[#FDFBF7] text-gray-700 transition-all duration-200 shadow-sm"
                        >
                            <Heart size={16} className={`${isWishlisted ? 'text-[#A94A4A] fill-[#A94A4A]' : 'text-gray-700 hover:text-[#A94A4A]'}`} />
                        </button>
                    </div>

                    {/* Out of Stock Overlay */}
                    {product.stock === 0 && (
                        <div className="absolute inset-0 bg-[#1a0a00]/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                            <span className="bg-[#FDFBF7]/90 text-gray-900 border border-[#D4AF37] px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest shadow-xl">
                                Out of Stock
                            </span>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="p-4 flex flex-col flex-grow">
                    {/* Category */}
                    {product.category && (
                        <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-[0.2em] mb-1.5">
                            {product.category.name}
                        </p>
                    )}

                    {/* Product Name */}
                    <h3 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-[#A94A4A] transition-colors duration-300">
                        {product.name}
                    </h3>

                    {/* Price and Add Button Container */}
                    <div className="mt-auto pt-3 border-t border-gray-100/70 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                            <span className="text-base font-bold text-gray-900">
                                ₹{price.toLocaleString()}
                            </span>
                            {hasDiscount && (
                                <span className="text-xs text-gray-400 line-through mt-0.5">
                                    ₹{product.original_price.toLocaleString()}
                                </span>
                            )}
                        </div>

                        {/* Premium Add Button */}
                        {product.stock !== 0 && (
                            <button
                                onClick={handleAddToCart}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#A94A4A] text-[#A94A4A] hover:bg-[#A94A4A] hover:text-[#FDFBF7] text-xs font-bold uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-sm shadow-[#A94A4A]/5 hover:shadow-md"
                            >
                                <ShoppingCart size={13} className="stroke-[2.5]" />
                                <span>Add</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
