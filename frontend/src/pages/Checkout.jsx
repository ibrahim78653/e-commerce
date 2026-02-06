/**
 * Checkout Page
 * Handle payment via Razorpay or WhatsApp
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Phone as PhoneIcon, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useCart } from '../context/CartContext';
import useAuthStore from '../store/authStore';
import { ordersAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const Checkout = () => {
    const navigate = useNavigate();
    const { cart, getTotal, clearCart } = useCart();
    const { user, isAuthenticated } = useAuthStore();
    const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'whatsapp'
    const [isProcessing, setIsProcessing] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            customer_name: user?.full_name || '',
            customer_email: user?.email || '',
            customer_phone: user?.phone || '',
        },
    });

    const total = getTotal();

    if (cart.length === 0) {
        navigate('/cart');
        return null;
    }

    const handleRazorpayCheckout = async (orderData) => {
        try {
            setIsProcessing(true);

            // Create order in database
            const orderResponse = await ordersAPI.create({
                ...orderData,
                payment_method: 'razorpay',
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    selected_size: item.selectedSize,
                    selected_color: item.selectedColor,
                    color_variant_id: item.selectedVariantId,
                })),
            });

            const order = orderResponse.data;

            // Create Razorpay order
            const razorpayResponse = await ordersAPI.createRazorpayOrder({
                order_id: order.id,
                amount: total,
            });

            const { razorpay_order_id, key_id } = razorpayResponse.data;

            // Initialize Razorpay
            const options = {
                key: key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: total * 100,
                currency: 'INR',
                name: 'Burhani Collection',
                description: `Order #${order.id}`,
                order_id: razorpay_order_id,
                handler: async (response) => {
                    try {
                        // Verify payment
                        await ordersAPI.verifyRazorpayPayment({
                            order_id: order.id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        toast.success('Payment successful!');
                        clearCart();
                        navigate('/orders');
                    } catch (error) {
                        toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: orderData.customer_name,
                    email: orderData.customer_email,
                    contact: orderData.customer_phone,
                },
                theme: {
                    color: '#dc2626',
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', () => {
                toast.error('Payment failed. Please try again.');
            });
            rzp.open();

        } catch (error) {
            console.error('Checkout error:', error);
            toast.error('Failed to process order');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleWhatsAppCheckout = async (orderData) => {
        try {
            setIsProcessing(true);

            const response = await ordersAPI.createWhatsAppOrder({
                ...orderData,
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    selected_size: item.selectedSize,
                    selected_color: item.selectedColor,
                    color_variant_id: item.selectedVariantId,
                })),
            });

            const { whatsapp_url } = response.data;

            toast.success('Redirecting to WhatsApp...');
            clearCart();
            window.location.href = whatsapp_url;

        } catch (error) {
            console.error('WhatsApp checkout error:', error);
            toast.error('Failed to create WhatsApp order');
        } finally {
            setIsProcessing(false);
        }
    };

    const onSubmit = async (data) => {
        if (paymentMethod === 'razorpay') {
            await handleRazorpayCheckout(data);
        } else {
            await handleWhatsAppCheckout(data);
        }
    };

    return (
        <div className="container min-h-screen py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Checkout Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Shipping Information */}
                        <div className="card">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                                <MapPin className="mr-2" size={24} />
                                Shipping Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Full Name"
                                    placeholder="John Doe"
                                    error={errors.customer_name?.message}
                                    {...register('customer_name', { required: 'Name is required' })}
                                />

                                <Input
                                    label="Phone Number"
                                    type="tel"
                                    placeholder="9876543210"
                                    error={errors.customer_phone?.message}
                                    {...register('customer_phone', {
                                        required: 'Phone is required',
                                        pattern: {
                                            value: /^[0-9]{10,15}$/,
                                            message: 'Invalid phone number',
                                        },
                                    })}
                                />

                                <div className="md:col-span-2">
                                    <Input
                                        label="Email (optional)"
                                        type="email"
                                        placeholder="you@example.com"
                                        {...register('customer_email')}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Shipping Address
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Street address, apartment, etc."
                                        className="input"
                                        {...register('shipping_address', { required: 'Address is required' })}
                                    />
                                    {errors.shipping_address && (
                                        <p className="mt-1 text-sm text-red-600">{errors.shipping_address.message}</p>
                                    )}
                                </div>

                                <Input
                                    label="City"
                                    placeholder="Mumbai"
                                    {...register('shipping_city')}
                                />

                                <Input
                                    label="State"
                                    placeholder="Maharashtra"
                                    {...register('shipping_state')}
                                />

                                <Input
                                    label="Pincode"
                                    placeholder="400001"
                                    {...register('shipping_pincode')}
                                />
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="card">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>

                            <div className="space-y-3">
                                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${paymentMethod === 'razorpay' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="razorpay"
                                        checked={paymentMethod === 'razorpay'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="mr-3"
                                    />
                                    <CreditCard className="mr-3 text-primary-600" size={24} />
                                    <div>
                                        <p className="font-semibold text-gray-900">Pay Online (Razorpay)</p>
                                        <p className="text-sm text-gray-600">Credit/Debit Card, UPI, Net Banking</p>
                                    </div>
                                </label>

                                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${paymentMethod === 'whatsapp' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="whatsapp"
                                        checked={paymentMethod === 'whatsapp'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="mr-3"
                                    />
                                    <PhoneIcon className="mr-3 text-green-600" size={24} />
                                    <div>
                                        <p className="font-semibold text-gray-900">WhatsApp Order</p>
                                        <p className="text-sm text-gray-600">Order via WhatsApp - Cash on Delivery</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                            isLoading={isProcessing}
                        >
                            {paymentMethod === 'razorpay' ? 'Proceed to Payment' : 'Send WhatsApp Order'}
                        </Button>
                    </form>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="card sticky top-24">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

                        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                            {cart.map((item) => {
                                const price = item.discounted_price || item.original_price;
                                return (
                                    <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex justify-between text-sm">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-gray-600">
                                                {item.selectedSize && `${item.selectedSize}`}
                                                {item.selectedSize && item.selectedColor && ' | '}
                                                {item.selectedColor && `${item.selectedColor}`}
                                            </p>
                                            <p className="text-gray-600">Qty: {item.quantity}</p>
                                        </div>
                                        <span className="font-medium">₹{(price * item.quantity).toFixed(2)}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <hr className="my-4" />

                        <div className="space-y-2">
                            <div className="flex justify-between text-gray-700">
                                <span>Subtotal</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Shipping</span>
                                <span className="text-green-600 font-medium">FREE</span>
                            </div>
                            <hr className="my-2" />
                            <div className="flex justify-between text-xl font-bold text-gray-900">
                                <span>Total</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
