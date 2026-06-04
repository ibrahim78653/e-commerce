/**
 * Shopping Cart Page - Luxury Redesign
 * Burhani Collection — Premium Boutique
 */
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import CONFIG from '../config';

const CartPage = () => {
    const navigate = useNavigate();
    const { cart, removeFromCart, updateQuantity, getTotal, getShippingCost, getGrandTotal, clearCart } = useCart();

    const total = getTotal();
    const shippingCost = getShippingCost();
    const grandTotal = getGrandTotal();

    // ── Empty State ──────────────────────────────────────────────────────────
    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-md"
                >
                    {/* Icon */}
                    <div className="relative inline-block mb-8">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#A94A4A]/10 flex items-center justify-center mx-auto border border-[#D4AF37]/30">
                            <ShoppingBag size={48} className="text-[#D4AF37]" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#A94A4A] flex items-center justify-center text-white text-sm font-bold shadow-lg">0</div>
                    </div>

                    <h1
                        className="text-3xl font-bold text-[#1a0a00] mb-3"
                        style={{ fontFamily: '"Times New Roman", Times, serif' }}
                    >
                        Your Cart is Empty
                    </h1>
                    <p className="text-gray-500 text-sm tracking-wide mb-8 leading-relaxed">
                        Discover our exquisite collection and add your favourite pieces to the cart.
                    </p>

                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1a0a00] text-[#D4AF37] font-bold text-sm uppercase tracking-[0.15em] rounded-full hover:bg-[#2d1200] transition-all duration-300 shadow-lg shadow-[#1a0a00]/20 hover:shadow-xl"
                    >
                        <Sparkles size={16} />
                        Explore Collection
                    </Link>
                </motion.div>
            </div>
        );
    }

    // ── Cart with items ──────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            {/* Page Header */}
            <div className="bg-[#1a0a00] border-b border-[#D4AF37]/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-2">Burhani Collection</p>
                        <h1
                            className="text-3xl md:text-4xl font-bold text-[#FDFBF7]"
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}
                        >
                            Shopping Cart
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">{cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</p>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* ── Cart Items ─────────────────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-4">
                        <AnimatePresence>
                            {cart.map((item, index) => {
                                const variant = item.color_variants?.find(v => v.id === item.selectedVariantId);
                                const variantImage = variant?.images?.find(img => img.is_primary)?.image_url || variant?.images?.[0]?.image_url;
                                const imageUrl = variantImage || item.images?.find(img => img.is_primary)?.image_url || item.images?.[0]?.image_url || '/placeholder.jpg';
                                const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${CONFIG.IMAGE_BASE_URL}${imageUrl}`;
                                const price = item.discounted_price || item.original_price;
                                const hasDiscount = item.discounted_price && item.discounted_price < item.original_price;

                                return (
                                    <motion.div
                                        key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -80, scale: 0.97 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="group bg-white rounded-2xl border border-[#D4AF37]/15 hover:border-[#D4AF37]/40 shadow-sm hover:shadow-lg hover:shadow-[#1a0a00]/5 transition-all duration-400 overflow-hidden"
                                    >
                                        <div className="flex gap-4 p-4 sm:p-5">
                                            {/* Product Image */}
                                            <Link to={`/product/${item.id}`} className="flex-shrink-0">
                                                <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden bg-gray-50 border border-[#D4AF37]/10">
                                                    <img
                                                        src={fullImageUrl}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        onError={(e) => { e.target.src = CONFIG.PLACEHOLDER_URL || 'https://via.placeholder.com/150'; }}
                                                    />
                                                </div>
                                            </Link>

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                {/* Category */}
                                                {item.category && (
                                                    <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-[0.2em] mb-1">{item.category.name}</p>
                                                )}
                                                <Link
                                                    to={`/product/${item.id}`}
                                                    className="font-bold text-gray-900 text-sm sm:text-base leading-snug hover:text-[#A94A4A] transition-colors duration-200 line-clamp-2 block mb-2"
                                                    style={{ fontFamily: '"Times New Roman", Times, serif' }}
                                                >
                                                    {item.name}
                                                </Link>

                                                {/* Variant Tags */}
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {item.selectedSize && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider border border-[#D4AF37]/40 text-gray-600 px-2.5 py-0.5 rounded-full">
                                                            Size: {item.selectedSize}
                                                        </span>
                                                    )}
                                                    {item.selectedColor && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider border border-[#D4AF37]/40 text-gray-600 px-2.5 py-0.5 rounded-full">
                                                            {item.selectedColor}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Price */}
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-lg font-bold text-gray-900">₹{price.toLocaleString()}</span>
                                                    {hasDiscount && (
                                                        <span className="text-xs text-gray-400 line-through">₹{item.original_price.toLocaleString()}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Controls (right side) */}
                                            <div className="flex flex-col items-end justify-between gap-3 flex-shrink-0">
                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                                                    className="p-1.5 rounded-full text-gray-400 hover:text-[#A94A4A] hover:bg-[#A94A4A]/8 transition-all duration-200"
                                                    title="Remove item"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                {/* Quantity Stepper */}
                                                <div className="flex items-center rounded-xl border border-[#D4AF37]/30 overflow-hidden">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                        className="px-2.5 py-2 hover:bg-[#1a0a00]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-700"
                                                    >
                                                        <Minus size={13} strokeWidth={2.5} />
                                                    </button>
                                                    <span className="w-9 text-center text-sm font-bold text-gray-900 border-x border-[#D4AF37]/20">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                                                        className="px-2.5 py-2 hover:bg-[#1a0a00]/5 transition-colors text-gray-700"
                                                    >
                                                        <Plus size={13} strokeWidth={2.5} />
                                                    </button>
                                                </div>

                                                {/* Item Total */}
                                                <p className="text-sm font-bold text-[#A94A4A]">
                                                    ₹{(price * item.quantity).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Clear Cart */}
                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={clearCart}
                                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-[#A94A4A] transition-colors duration-200"
                            >
                                <Trash2 size={13} />
                                Clear All Items
                            </button>
                        </div>
                    </div>

                    {/* ── Order Summary ──────────────────────────────────────── */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white rounded-2xl border border-[#D4AF37]/20 shadow-sm overflow-hidden">
                            {/* Summary Header */}
                            <div className="bg-[#1a0a00] px-6 py-4">
                                <h2
                                    className="text-lg font-bold text-[#D4AF37]"
                                    style={{ fontFamily: '"Times New Roman", Times, serif' }}
                                >
                                    Order Summary
                                </h2>
                            </div>

                            <div className="p-6">
                                {/* Line Items */}
                                <div className="space-y-3 mb-5 pb-5 border-b border-gray-100">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal ({cart.length} items)</span>
                                        <span className="font-semibold text-gray-900">₹{total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Shipping</span>
                                        {shippingCost === 0
                                            ? <span className="font-semibold text-green-600">FREE</span>
                                            : <span className="font-semibold text-gray-900">₹{shippingCost}</span>
                                        }
                                    </div>
                                    {total < 1200 && (
                                        <p className="text-[10px] text-[#D4AF37] font-semibold bg-[#D4AF37]/8 rounded-lg px-3 py-2">
                                            ✨ Add ₹{(1200 - total).toLocaleString()} more for free royal shipping!
                                        </p>
                                    )}
                                </div>

                                {/* Grand Total */}
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-base font-bold text-gray-900">Total Payable</span>
                                    <span className="text-xl font-bold text-[#1a0a00]">₹{grandTotal.toLocaleString()}</span>
                                </div>

                                {/* Checkout CTA */}
                                <button
                                    onClick={() => navigate('/checkout', { state: { appliedPromo: null, discountedTotal: grandTotal } })}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#1a0a00] text-[#D4AF37] font-bold text-sm uppercase tracking-[0.15em] rounded-xl hover:bg-[#2d1200] transition-all duration-300 shadow-lg shadow-[#1a0a00]/20 hover:shadow-xl mb-3 group"
                                >
                                    <span>Proceed to Checkout</span>
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                                </button>

                                <Link
                                    to="/"
                                    className="block w-full text-center px-6 py-3 border border-[#D4AF37]/40 text-gray-600 font-semibold text-sm rounded-xl hover:border-[#D4AF37] hover:text-[#1a0a00] transition-all duration-200"
                                >
                                    Continue Shopping
                                </Link>

                                {/* Trust Badges */}
                                <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                                    {[
                                        { icon: '🔒', label: 'Secure' },
                                        { icon: '↩️', label: 'Easy Returns' },
                                        { icon: '📦', label: 'Fast Ship' },
                                    ].map(b => (
                                        <div key={b.label} className="flex flex-col items-center gap-1">
                                            <span className="text-base">{b.icon}</span>
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{b.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
