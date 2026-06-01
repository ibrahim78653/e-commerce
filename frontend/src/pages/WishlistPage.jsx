/**
 * Wishlist Page - Luxury Redesign
 * Burhani Collection — Premium Boutique
 */
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import useWishlistStore from '../store/wishlistStore';
import ProductCard from '../components/ProductCard';

const WishlistPage = () => {
    const { items, loading, fetchWishlist } = useWishlistStore();

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    // ── Loading State ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-14 h-14 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin mx-auto mb-4" />
                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Loading wishlist…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="bg-[#1a0a00] border-b border-[#D4AF37]/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-end gap-4"
                    >
                        <div>
                            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-2">
                                Burhani Collection
                            </p>
                            <h1
                                className="text-3xl md:text-4xl font-bold text-[#FDFBF7]"
                                style={{ fontFamily: '"Times New Roman", Times, serif' }}
                            >
                                My Wishlist
                            </h1>
                        </div>
                        {items.length > 0 && (
                            <span className="mb-1 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold tracking-wider">
                                {items.length} {items.length === 1 ? 'item' : 'items'}
                            </span>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* ── Main Content ─────────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {items.length === 0 ? (
                    // ── Empty State ──────────────────────────────────────────
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-center justify-center py-24 text-center"
                    >
                        <div className="relative mb-8">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#A94A4A]/10 flex items-center justify-center border border-[#D4AF37]/30">
                                <Heart size={46} className="text-[#A94A4A]/60" />
                            </div>
                            {/* Decorative rings */}
                            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/15 scale-125" />
                            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/8 scale-150" />
                        </div>

                        <h2
                            className="text-3xl font-bold text-[#1a0a00] mb-3"
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}
                        >
                            Your Wishlist is Empty
                        </h2>
                        <p className="text-gray-500 text-sm tracking-wide max-w-sm mx-auto mb-8 leading-relaxed">
                            Tap the ♥ icon on any product to save it here for later. Your curated wishlist awaits.
                        </p>

                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1a0a00] text-[#D4AF37] font-bold text-sm uppercase tracking-[0.15em] rounded-full hover:bg-[#2d1200] transition-all duration-300 shadow-lg shadow-[#1a0a00]/20 hover:shadow-xl"
                        >
                            <Sparkles size={15} />
                            Explore Collection
                        </Link>
                    </motion.div>
                ) : (
                    // ── Wishlist Grid ────────────────────────────────────────
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                        >
                            {items.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.06 }}
                                >
                                    <ProductCard product={product} />
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Bottom CTA */}
                        <div className="mt-12 text-center">
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-6 py-3 border border-[#D4AF37]/40 text-gray-600 font-semibold text-sm rounded-full hover:border-[#D4AF37] hover:text-[#1a0a00] transition-all duration-200"
                            >
                                <ShoppingBag size={16} />
                                Continue Shopping
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;
