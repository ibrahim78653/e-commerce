/**
 * Shopping Cart Page
 * Display cart items, update quantities, and checkout
 */
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import CONFIG from '../config';

const CartPage = () => {
    const navigate = useNavigate();
    const { cart, removeFromCart, updateQuantity, getTotal, getShippingCost, getGrandTotal, clearCart } = useCart();

    const total = getTotal();
    const shippingCost = getShippingCost();
    const grandTotal = getGrandTotal();

    if (cart.length === 0) {
        return (
            <div className="container min-h-screen py-16">
                <div className="max-w-md mx-auto text-center">
                    <ShoppingBag size={80} className="mx-auto text-gray-300 mb-6" />
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
                    <p className="text-gray-600 mb-8">
                        Add some products to get started
                    </p>
                    <Link to="/">
                        <Button variant="primary" size="lg">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container min-h-screen py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.map((item) => {
                        const variant = item.color_variants?.find(v => v.id === item.selectedVariantId);
                        const variantImage = variant?.images?.find(img => img.is_primary)?.image_url || variant?.images?.[0]?.image_url;
                        const imageUrl = variantImage || item.images?.find(img => img.is_primary)?.image_url || item.images?.[0]?.image_url || '/placeholder.jpg';

                        const fullImageUrl = imageUrl.startsWith('http')
                            ? imageUrl
                            : `${CONFIG.IMAGE_BASE_URL}${imageUrl}`;
                        const price = item.discounted_price || item.original_price;

                        return (
                            <motion.div
                                key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                className="card flex gap-4"
                            >
                                {/* Image */}
                                <img
                                    src={fullImageUrl}
                                    alt={item.name}
                                    className="w-24 h-24 object-cover rounded-lg"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/150?text=Product';
                                    }}
                                />

                                {/* Info */}
                                <div className="flex-1">
                                    <Link
                                        to={`/product/${item.id}`}
                                        className="font-semibold text-gray-900 hover:text-primary-600 text-lg"
                                    >
                                        {item.name}
                                    </Link>

                                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                                        {item.selectedSize && (
                                            <p>Size: <span className="font-medium">{item.selectedSize}</span></p>
                                        )}
                                        {item.selectedColor && (
                                            <p>Color: <span className="font-medium">{item.selectedColor}</span></p>
                                        )}
                                    </div>

                                    <p className="text-xl font-bold text-gray-900 mt-2">
                                        ₹{price.toFixed(2)}
                                    </p>
                                </div>

                                {/* Quantity Controls */}
                                <div className="flex flex-col items-end justify-between">
                                    <button
                                        onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                                        className="text-red-600 hover:text-red-700 p-2"
                                    >
                                        <Trash2 size={20} />
                                    </button>

                                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                                        <button
                                            onClick={() => updateQuantity(
                                                item.id,
                                                item.selectedSize,
                                                item.selectedColor,
                                                item.quantity - 1
                                            )}
                                            disabled={item.quantity <= 1}
                                            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(
                                                item.id,
                                                item.selectedSize,
                                                item.selectedColor,
                                                item.quantity + 1
                                            )}
                                            className="p-2 hover:bg-gray-100"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    <p className="text-lg font-semibold text-gray-900">
                                        ₹{(price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Clear Cart */}
                    <button
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-700 font-medium"
                    >
                        Clear Cart
                    </button>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="card sticky top-24">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-700">
                                <span>Subtotal</span>
                                <span className="font-medium">₹{total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Shipping</span>
                                {shippingCost === 0 ? (
                                    <span className="font-medium text-green-600">FREE</span>
                                ) : (
                                    <span className="font-medium text-gray-900">₹{shippingCost}</span>
                                )}
                            </div>
                            {total <= 1200 && (
                                <div className="text-xs text-blue-600 mt-1">
                                    Full free shipping on orders above ₹1200
                                </div>
                            )}
                            <hr className="my-4" />
                            <div className="flex justify-between text-xl font-bold text-gray-900">
                                <span>Total</span>
                                <span>₹{grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            className="w-full mb-3"
                            size="lg"
                            icon={ArrowRight}
                            iconPosition="right"
                            onClick={() => navigate('/checkout')}
                        >
                            Proceed to Checkout
                        </Button>

                        <Link to="/">
                            <Button variant="outline" className="w-full">
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
