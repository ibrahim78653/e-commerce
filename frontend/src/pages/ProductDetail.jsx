/**
 * Product Detail Page
 * Display product info, image gallery, and add to cart
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Package, Truck, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const loadProduct = async () => {
            setLoading(true);
            try {
                const response = await productsAPI.getById(id);
                setProduct(response.data);

                // Set default selections
                const sizes = response.data.sizes?.split(',').map(s => s.trim()) || [];
                const colors = response.data.colors?.split(',').map(c => c.trim()) || [];

                if (sizes.length > 0) setSelectedSize(sizes[0]);
                if (colors.length > 0) setSelectedColor(colors[0]);
            } catch (error) {
                console.error('Failed to load product:', error);
                toast.error('Product not found');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [id, navigate]);

    const handleAddToCart = () => {
        if (!product) return;

        addToCart(product, quantity, selectedSize, selectedColor);
    };

    const handleBuyNow = () => {
        handleAddToCart();
        navigate('/checkout');
    };

    if (loading) {
        return (
            <div className="container py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton variant="card" className="h-96" />
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-20" />
                        <Skeleton className="h-12 w-1/3" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) return null;

    const price = product.discounted_price || product.original_price;
    const hasDiscount = product.discounted_price && product.discounted_price < product.original_price;
    const discount = hasDiscount
        ? Math.round(((product.original_price - product.discounted_price) / product.original_price) * 100)
        : 0;

    const sizes = product.sizes?.split(',').map(s => s.trim()) || [];
    const colors = product.colors?.split(',').map(c => c.trim()) || [];

    return (
        <div className="container py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Image Gallery */}
                <div>
                    {/* Main Image */}
                    <motion.div
                        key={selectedImage}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gray-100 rounded-2xl overflow-hidden mb-4"
                    >
                        <img
                            src={
                                product.images?.[selectedImage]?.image_url?.startsWith('http')
                                    ? product.images[selectedImage].image_url
                                    : `http://localhost:8000${product.images?.[selectedImage]?.image_url || '/placeholder.jpg'}`
                            }
                            alt={product.name}
                            className="w-full h-96 object-cover"
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/600x400?text=Product+Image';
                            }}
                        />
                    </motion.div>

                    {/* Thumbnails */}
                    {product.images && product.images.length > 1 && (
                        <div className="grid grid-cols-3 gap-4">
                            {product.images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                                            ? 'border-primary-600 ring-2 ring-primary-200'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <img
                                        src={
                                            image.image_url?.startsWith('http')
                                                ? image.image_url
                                                : `http://localhost:8000${image.image_url}`
                                        }
                                        alt={`${product.name} ${index + 1}`}
                                        className="w-full h-24 object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div>
                    {/* Category */}
                    {product.category && (
                        <p className="text-primary-600 font-medium mb-2">{product.category.name}</p>
                    )}

                    {/* Title */}
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

                    {/* Price */}
                    <div className="flex items-baseline gap-4 mb-6">
                        <span className="text-4xl font-bold text-gray-900">₹{price.toFixed(2)}</span>
                        {hasDiscount && (
                            <>
                                <span className="text-2xl text-gray-400 line-through">
                                    ₹{product.original_price.toFixed(2)}
                                </span>
                                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-semibold">
                                    {discount}% OFF
                                </span>
                            </>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                        {product.description || product.short_description}
                    </p>

                    {/* Size Selection */}
                    {sizes.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Select Size</h3>
                            <div className="flex gap-2 flex-wrap">
                                {sizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`px-6 py-2 rounded-lg border-2 font-medium transition-all ${selectedSize === size
                                                ? 'border-primary-600 bg-primary-50 text-primary-600'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Color Selection */}
                    {colors.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Select Color</h3>
                            <div className="flex gap-2 flex-wrap">
                                {colors.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`px-6 py-2 rounded-lg border-2 font-medium transition-all ${selectedColor === color
                                                ? 'border-primary-600 bg-primary-50 text-primary-600'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">Quantity</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center border-2 border-gray-300 rounded-lg">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="px-4 py-2 hover:bg-gray-100"
                                >
                                    -
                                </button>
                                <span className="px-6 py-2 font-semibold">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="px-4 py-2 hover:bg-gray-100"
                                >
                                    +
                                </button>
                            </div>
                            <p className="text-gray-600">
                                {product.stock} items available
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 mb-8">
                        <Button
                            variant="primary"
                            size="lg"
                            className="flex-1"
                            icon={ShoppingCart}
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                        >
                            Add to Cart
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="flex-1"
                            onClick={handleBuyNow}
                            disabled={product.stock === 0}
                        >
                            Buy Now
                        </Button>
                        <button className="p-3 border-2 border-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors">
                            <Heart size={24} />
                        </button>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-gray-50 rounded-xl">
                        <div className="text-center">
                            <Package className="mx-auto mb-2 text-primary-600" size={32} />
                            <p className="text-sm font-medium text-gray-700">Easy Returns</p>
                        </div>
                        <div className="text-center">
                            <Truck className="mx-auto mb-2 text-primary-600" size={32} />
                            <p className="text-sm font-medium text-gray-700">Free Shipping</p>
                        </div>
                        <div className="text-center">
                            <Shield className="mx-auto mb-2 text-primary-600" size={32} />
                            <p className="text-sm font-medium text-gray-700">Secure Payment</p>
                        </div>
                    </div>

                    {/* Product Details */}
                    {product.material && (
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Product Details</h3>
                            <div className="space-y-2 text-gray-700">
                                <p><span className="font-medium">Material:</span> {product.material}</p>
                                {product.sku && <p><span className="font-medium">SKU:</span> {product.sku}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
